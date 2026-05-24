const net = require('net');
const axios = require('axios');
const db = require('../db/sqlite');

const API_BASE = 'https://lims.poxiatechnologies.com';

// port -> true  (set IMMEDIATELY when we decide to open)
const pendingPorts = new Set();
const activeServers = new Map();
const activeClients = new Map();
let mainWindow = null;

const sessionAccumulator = new Map();
const manualContexts = new Map();

function setManualContext(testInfo) {
    if (testInfo && testInfo.machineId) {
        console.log(`📌 TCP Manual context set for machine ${testInfo.machineId} -> Sample ${testInfo.sampleId}`);
        manualContexts.set(testInfo.machineId, testInfo);
    }
}

// HL7 control characters
const VT = Buffer.from([0x0b]);
const FS = Buffer.from([0x1c]);
const CR = Buffer.from([0x0d]);

const parameter_map = {
    '2006': 'WBC',
    '2007': 'NEU%',
    '2008': 'LYM%',
    '2009': 'MON%',
    '2010': 'EOS%',
    '2011': 'BAS%',
    '2012': 'NEU#',
    '2013': 'LYM#',
    '2014': 'MON#',
    '2015': 'EOS#',
    '2016': 'BAS#',
    '2017': 'RBC',
    '2018': 'HGB',
    '2019': 'MCV',
    '2020': 'HCT',
    '2021': 'MCH',
    '2022': 'MCHC',
    '2023': 'RDW-SD',
    '2024': 'RDW-CV',
    '2025': 'PLT',
    '2026': 'MPV',
    '2027': 'PCT',
    '2028': 'PDW',
    '2029': 'P-LCR',
    '2030': 'P-LCC',
    '2031': 'CRP'
};

function parseAltaHL7(message) {
    const lines = message.split('\r');
    const patient = {};
    const results = {};

    for (const line of lines) {
        const fields = line.split('|');
        if (fields.length === 0) continue;

        const segment = fields[0].replace(/\n/g, '').trim();

        if (segment === 'MSH') {
            patient['serial_number'] = fields.length > 3 ? fields[3] : '';
        } else if (segment === 'PID') {
            patient['patient_id'] = fields.length > 3 ? fields[3] : '';
            patient['name'] = fields.length > 5 ? fields[5] : '';
            patient['gender'] = fields.length > 8 ? fields[8] : '';
        } else if (segment === 'OBR') {
            patient['sample_id'] = fields.length > 3 ? fields[3] : '';
        } else if (segment === 'OBX') {
            const test_info = fields.length > 3 ? fields[3] : '';
            const value = fields.length > 5 ? fields[5] : '';
            const code_parts = test_info.split('^');

            if (code_parts.length > 0) {
                const code = code_parts[0];
                if (parameter_map[code]) {
                    results[parameter_map[code]] = value;
                } else if (code) {
                    results[code] = value;
                }
            }
        }
    }

    return { patient, results };
}

async function syncSession(session, machine, sessionKey) {
    console.log(`\n⬆️  Syncing completed session to Backend (${session.results.length} results)`);

    try {
        const payload = {
            bill_item_id: session.testId,
            sample_id: session.sampleId,
            machine_id: machine.unique_id || machine.uniqueId || machine.id,
            results: session.results.map(r => ({
                parameter_name: r.parameter_name,
                result_value: r.result_value,
                unit: r.unit || '',
                reference_range: r.ref_range || '',
                flag: r.flag || ''
            })),
            meta: { protocol: session.protocol, session_key: sessionKey }
        };

        const res = await axios.post(`${API_BASE}/api/lab/save-test-results`, payload, { timeout: 10000 });

        if (res.data.success) {
            console.log(`✅ Session "${sessionKey}" successfully saved to DB.`);
            sessionAccumulator.delete(sessionKey);
            
            const machineId = machine.unique_id || machine.uniqueId || machine.id;
            if (manualContexts.has(machineId)) {
                manualContexts.delete(machineId);
                console.log(`📌 TCP Manual context cleared for machine ${machineId}`);
            }

            mainWindow?.webContents?.send('panel-complete', {
                sampleId: session.sampleId,
                testName: session.testName
            });
        } else {
            console.warn(`⚠️  Failed to save session "${sessionKey}": ${res.data.message}`);
        }
    } catch (err) {
        console.error(`❌ Network error while saving session "${sessionKey}": ${err.message}`);
    }
}

async function processAltaHL7(message, machine) {
    const parsed = parseAltaHL7(message);
    let sessionKey = parsed.patient.sample_id; // Using sample_id as the session key

    let targetMachine = machine;
    if (parsed.patient.serial_number) {
        try {
            const configs = await db.getConfig();
            const matched = configs.find(c => c.serial_number === parsed.patient.serial_number);
            if (matched) {
                targetMachine = matched;
                console.log(`🎯 DYNAMIC MACHINE RESOLUTION: Matched HL7 Serial Number "${parsed.patient.serial_number}" to Machine ID: ${targetMachine.unique_id}`);
            } else {
                console.warn(`⚠️  No registered machine found matching Serial Number: "${parsed.patient.serial_number}"`);
            }
        } catch (err) {
            console.error('Error matching machine by serial number:', err);
        }
    }

    const machineId = targetMachine.unique_id || targetMachine.id;
    const manualInfo = manualContexts.get(machineId);

    if (manualInfo && manualInfo.sampleId) {
        console.log(`📌 MANUAL OVERRIDE: Mapping TCP report to Sample ID: ${manualInfo.sampleId} (Ignoring native ID: ${sessionKey || 'none'})`);
        sessionKey = manualInfo.sampleId;
    }

    if (!sessionKey) {
        console.warn('⚠️  ALTA HL7 message has no sample ID (OBR[3]) and no manual context — skipping.');
        return;
    }

    console.log(`🔍 ALTA Hematology — Target ID: ${sessionKey}`);

    let session = sessionAccumulator.get(sessionKey);
    if (!session) {
        console.log(`🆕 New ALTA session for sample ID "${sessionKey}" — fetching worklist...`);

        let test = null;
        try {
            const wlRes = await axios.get(`${API_BASE}/api/lab/worklist-by-id/${sessionKey}`, { timeout: 5000 });
            if (wlRes.data.success && wlRes.data.test) test = wlRes.data.test;
        } catch (err) {
            console.warn(`⚠️  Worklist fetch failed for sample ID "${sessionKey}": ${err.message}`);
        }

        if (!test && manualInfo) {
            test = {
                bill_item_id: manualInfo.testId,
                sample_id: manualInfo.sampleId,
                patient_name: '(Mapped via UI)',
                test_name: 'Mapped Test'
            };
        }

        if (!test) {
            console.log(`🆕 Requesting auto-creation of worklist entry for unsolicited Target ID "${sessionKey}"...`);
            try {
                const createRes = await axios.post(`${API_BASE}/api/lab/unsolicited-worklist`, {
                    sample_id: sessionKey,
                    patient_name: parsed.patient.name || '',
                    test_name: 'Analyzer Auto-Test'
                }, { timeout: 5000 });
                if (createRes.data.success && createRes.data.test) {
                    test = createRes.data.test;
                    console.log(`✅ Auto-created worklist entry for "${sessionKey}"`);
                }
            } catch (err) {
                console.error(`❌ Failed to auto-create worklist entry for "${sessionKey}": ${err.message}`);
            }
        }

        if (!test) {
            console.log(`⚠️  Could not find or create worklist entry for Target ID "${sessionKey}". Ignoring message.`);
            return;
        }

        session = {
            testId: test.bill_item_id,
            sampleId: test.sample_id,
            patientName: test.patient_name || parsed.patient.name,
            testName: test.test_name,
            results: [],
            protocol: 'TCP_HL7'
        };
        sessionAccumulator.set(sessionKey, session);
    }

    let newResultsCount = 0;

    for (const [param, val] of Object.entries(parsed.results)) {
        if (session.results.some(r => r.parameter_name.toLowerCase() === param.toLowerCase())) continue;

        session.results.push({
            parameter_name: param,
            result_value: val,
            unit: '',
            ref_range: '',
            flag: ''
        });
        newResultsCount++;

        console.log(`📍 ALTA Recorded: ${param} = ${val}`);

        mainWindow?.webContents?.send('test-completed', {
            sampleId: session.sampleId,
            test_name: param,
            result_value: val,
            unit: '',
            flag: ''
        });
    }

    if (newResultsCount > 0) {
        await syncSession(session, targetMachine, sessionKey);
    }
}

async function startTCPServer(machine, win) {
    mainWindow = win;
    const portNum = parseInt(machine.port, 10);
    if (isNaN(portNum)) {
        console.error(`❌ Invalid TCP port number for ${machine.model}: ${machine.port}`);
        return;
    }

    console.log(`📡 Starting TCP Server for ${machine.model} on port ${portNum}...`);

    const server = net.createServer((conn) => {
        console.log(`\n🔌 Analyzer Connected: ${conn.remoteAddress}:${conn.remotePort}`);
        activeClients.set(machine.port, conn);
        
        // Notify UI that machine actually connected
        mainWindow?.webContents?.send('device-status', {
            model: machine.model,
            port: machine.port,
            status: 'Connected',
        });

        let data_buffer = Buffer.alloc(0);

        conn.on('data', async (data) => {
            data_buffer = Buffer.concat([data_buffer, data]);

            const fsCrIndex = data_buffer.indexOf(Buffer.concat([FS, CR]));
            if (fsCrIndex !== -1) {
                // We have a complete message
                let hl7_data = data_buffer.slice(0, fsCrIndex);
                if (hl7_data[0] === VT[0]) {
                    hl7_data = hl7_data.slice(1);
                }

                const message = hl7_data.toString('utf-8');
                console.log("\n========== RAW ALTA HL7 ==========\n");
                console.log(message);

                await processAltaHL7(message, machine);

                // Send ACK
                const ack_message = Buffer.concat([
                    VT,
                    Buffer.from('MSH|^~\\&|LIS|||Analyzer||20260506120000||ACK^R01|1|P|2.3.1\rMSA|AA|1\r'),
                    FS,
                    CR
                ]);
                
                conn.write(ack_message, () => {
                    console.log("✅ ACK SENT to analyzer");
                });

                data_buffer = data_buffer.slice(fsCrIndex + 2);
            }
        });

        conn.on('close', () => {
            console.log('🔌 Analyzer Disconnected');
            activeClients.delete(machine.port);
            // Revert back to listening status
            mainWindow?.webContents?.send('device-status', {
                model: machine.model,
                port: machine.port,
                status: 'Listening',
            });
        });

        conn.on('error', (err) => {
            console.error('⚠️ TCP Connection Error:', err.message);
        });
    });

    server.listen(portNum, '0.0.0.0', () => {
        console.log(`✅ TCP Server listening on 0.0.0.0:${portNum}`);
        activeServers.set(machine.port, server);
        pendingPorts.delete(machine.port);

        // Tell UI we are waiting for connection
        mainWindow?.webContents?.send('device-status', {
            model: machine.model,
            port: machine.port,
            status: 'Listening',
        });
    });

    server.on('error', (err) => {
        pendingPorts.delete(machine.port);
        if (err.code === 'EADDRINUSE') {
            console.warn(`⚠️ Port ${portNum} is busy (EADDRINUSE). Retrying in 4 seconds...`);
            // Schedule a retry — the port will be freed once the old process dies
            setTimeout(() => {
                if (!activeServers.has(machine.port) && !pendingPorts.has(machine.port)) {
                    console.log(`🔄 Retrying TCP Server on port ${portNum}...`);
                    pendingPorts.add(machine.port);
                    startTCPServer(machine, win).catch(retryErr => {
                        console.error(`❌ TCP Retry failed for port ${portNum}:`, retryErr.message);
                        pendingPorts.delete(machine.port);
                    });
                }
            }, 4000);
        } else {
            console.error(`❌ TCP Server Error on port ${portNum}:`, err.message);
        }
    });
}

async function initializeAllServers(win) {
    mainWindow = win;
    try {
        const configs = await db.getConfig();
        const tcpConfigs = configs.filter(c => c.portType === 'TCP' || (c.model && c.model.includes('ALTA')));

        for (const config of tcpConfigs) {
            if (activeServers.has(config.port) || pendingPorts.has(config.port)) {
                continue;
            }
            pendingPorts.add(config.port);
            startTCPServer(config, win).catch(err => {
                console.error(`❌ Server startup failed for port ${config.port}:`, err.message);
                pendingPorts.delete(config.port);
            });
        }
    } catch (err) {
        console.error('❌ Failed to initialize background TCP servers:', err);
    }
}

async function stopListening() {
    for (const [port, server] of activeServers.entries()) {
        server.close();
        activeServers.delete(port);
        console.log(`⏹️ TCP Server on port ${port} closed.`);
    }
}

module.exports = {
    initializeAllServers,
    stopListening,
    startTCPServer,
    setManualContext,
    activeServers,
    activeClients
};
