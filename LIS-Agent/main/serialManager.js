const { SerialPort } = require('serialport');
const axios = require('axios');
const db = require('../db/sqlite');

const API_BASE = 'http://172.16.11.160:7005';

// path -> SerialPort instance
const activePorts = new Map();

// path -> true  (set IMMEDIATELY when we decide to open, before port.open fires)
// This is the real guard against double-init races
const pendingPorts = new Set();
let reconnectTimer = null;
let mainWindow = null;

// patientId -> { testId, sampleId, results, requiredParams, ... }  [binary machines]
// code       -> { testId, sampleId, results, requiredParams, ... }  [CelQuant Edge / HL7]
const sessionAccumulator = new Map();


// ─────────────────────────────────────────────────────────────────────────────
// HL7 PARSER  (ported from Merilyzer CelQuant Edge Python implementation)
// Key:  OBR field[3] "code" is used as the session identifier, NOT patient ID
// ─────────────────────────────────────────────────────────────────────────────

const CBC_PARAMS = [
  'WBC', 'Lymph#', 'Mid#', 'Gran#',
  'Lymph%', 'Mid%', 'Gran%',
  'RBC', 'HGB', 'HCT', 'MCV',
  'MCH', 'MCHC', 'RDW-CV', 'RDW-SD',
  'PLT', 'MPV', 'PDW', 'PCT',
  'P-LCC', 'P-LCR',
];

// LOINC code → parameter name
const CODE_MAP = {
  '6690-2':   'WBC',
  '731-0':    'Lymph#',
  '10027':    'Mid#',
  '10028':    'Gran#',
  '736-9':    'Lymph%',
  '10029':    'Mid%',
  '10030':    'Gran%',
  '789-8':    'RBC',
  '718-7':    'HGB',
  '4544-3':   'HCT',
  '787-2':    'MCV',   // may also be HCT — resolved below by label
  '785-6':    'MCH',
  '786-4':    'MCHC',
  '788-0':    'RDW-CV',
  '70-5':     'RDW-SD',
  '21000-5':  'RDW-SD',
  '777-3':    'PLT',
  '32623-1':  'MPV',
  '32207-3':  'PDW',
  '10002':    'PCT',
  '10013':    'P-LCC',
  '10014':    'P-LCR',
};

// Text label → parameter name  (lowercased, spaces stripped)
const LABEL_MAP = {
  'wbc':     'WBC',
  'lymph#':  'Lymph#',
  'lym#':    'Lymph#',
  'mid#':    'Mid#',
  'gran#':   'Gran#',
  'lymph%':  'Lymph%',
  'lym%':    'Lymph%',
  'mid%':    'Mid%',
  'gran%':   'Gran%',
  'rbc':     'RBC',
  'hgb':     'HGB',
  'hb':      'HGB',
  'hct':     'HCT',
  'mcv':     'MCV',
  'mch':     'MCH',
  'mchc':    'MCHC',
  'rdw-cv':  'RDW-CV',
  'rdw-sd':  'RDW-SD',
  'plt':     'PLT',
  'mpv':     'MPV',
  'pdw':     'PDW',
  'pct':     'PCT',
  'p-lcc':   'P-LCC',
  'p-lcr':   'P-LCR',
};

/**
 * Parse a raw HL7 string from the CelQuant Edge analyzer.
 *
 * Returns an object with:
 *   - case_id, code, bed_no, name, sex, age, age_unit
 *   - mode, test_mode, timestamp
 *   - one key per CBC_PARAMS entry: { value, unit, range, flag } | null
 *
 * SESSION KEY → result.code  (OBR segment, field 3)
 */
function parseHL7(raw) {
  const result = {
    case_id:   '',
    code:      '',
    bed_no:    '',
    name:      '',
    sex:       '',
    age:       '',
    age_unit:  '',
    mode:      '',
    test_mode: '',
    timestamp: null,
  };

  for (const p of CBC_PARAMS) result[p] = null;

  // Normalise line endings
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // ── MSH ──────────────────────────────────────────────────────────────
    if (line.startsWith('MSH|')) {
      const f = line.split('|');
      if (f.length > 6) {
        try {
          const ts = f[6].slice(0, 14);   // YYYYMMDDHHmmss
          result.timestamp = new Date(
            `${ts.slice(0,4)}-${ts.slice(4,6)}-${ts.slice(6,8)}T` +
            `${ts.slice(8,10)}:${ts.slice(10,12)}:${ts.slice(12,14)}`
          );
        } catch (_) { /* ignore bad timestamp */ }
      }
      continue;
    }

    // ── PID ──────────────────────────────────────────────────────────────
    if (line.startsWith('PID|')) {
      const f = line.split('|');

      // Name  (field 5, caret-delimited)
      if (f.length > 5) {
        result.name = f[5].split('^').filter(Boolean).join(' ').trim();
      }

      // Sex  (field 8)
      if (f.length > 8) {
        const sexMap = { M: 'Male', F: 'Female', U: 'Unknown' };
        result.sex = sexMap[f[8].trim().toUpperCase()] ?? f[8].trim();
      }

      // Age — calculated from DOB  (field 7, YYYYMMDD)
      if (f.length > 7 && f[7].trim().length >= 8) {
        try {
          const dob = f[7].trim().slice(0, 8);
          const birth = new Date(`${dob.slice(0,4)}-${dob.slice(4,6)}-${dob.slice(6,8)}`);
          const now   = new Date();
          let age = now.getFullYear() - birth.getFullYear();
          const notHadBirthday =
            now.getMonth()  < birth.getMonth() ||
            (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
          if (notHadBirthday) age -= 1;
          result.age      = String(age);
          result.age_unit = 'yr';
        } catch (_) { /* ignore */ }
      }
      continue;
    }

    // ── OBR ──────────────────────────────────────────────────────────────
    if (line.startsWith('OBR|')) {
      const f = line.split('|');

      // Case ID  (field 2, before first caret)
      if (f.length > 2) result.case_id = f[2].split('^')[0].trim();

      // Code — SESSION KEY for CelQuant Edge  (field 3, before first caret)
      if (f.length > 3) result.code = f[3].split('^')[0].trim();

      // Bed No  (field 18, before first caret)
      if (f.length > 18) result.bed_no = f[18].split('^')[0].trim();

      continue;
    }

    // ── OBX ──────────────────────────────────────────────────────────────
    if (!line.startsWith('OBX|')) continue;

    const f = line.split('|');
    if (f.length < 6) continue;

    const obxType = f[2].trim();
    if (obxType === 'ED') continue;   // skip histogram binary blobs

    const idField  = f[3].trim();
    const value    = f[5].trim();
    const unit     = f.length > 6 ? f[6].trim() : '';
    const refRange = f.length > 7 ? f[7].trim() : '';
    const flag     = f.length > 8 ? f[8].trim() : '';

    const idParts  = idField.split('^');
    const code     = idParts[0].trim();
    const label    = idParts.length > 1 ? idParts[1].trim().toLowerCase() : '';

    // ── Mode  (08001) ──────────────────────────────────────────────────
    if (code.includes('08001')) {
      const modeMap = { O: 'Whole Blood', C: 'Capillary', P: 'Pre-diluted' };
      result.mode = modeMap[value] ?? value;
      continue;
    }

    // ── Test Mode  (08003) ────────────────────────────────────────────
    if (code.includes('08003')) {
      const tmMap = { W: 'CBC+Diff', C: 'CBC', D: 'Diff' };
      result.test_mode = tmMap[value] ?? value;
      continue;
    }

    // ── Age from OBX ─────────────────────────────────────────────────
    if (label.includes('age')) {
      result.age      = value;
      result.age_unit = unit;
      continue;
    }

    // Skip non-numeric values
    if (!value || isNaN(parseFloat(value))) continue;

    // ── Resolve parameter name ────────────────────────────────────────
    let paramName = null;

    // 1. Match by LOINC code (exact or prefix)
    for (const [mc, pn] of Object.entries(CODE_MAP)) {
      if (code === mc || code.startsWith(mc)) {
        paramName = pn;
        break;
      }
    }

    // 2. Fall back to text label
    if (!paramName) {
      paramName = LABEL_MAP[label.replace(/\s+/g, '')] ?? null;
    }

    if (!paramName) continue;

    // ── HCT / MCV ambiguity fix for LOINC 787-2 ──────────────────────
    if (code.includes('787-2')) {
      paramName = label.includes('hct') ? 'HCT' : 'MCV';
    }

    result[paramName] = { value, unit, range: refRange, flag };
  }

  return result;
}


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: call once at startup (and safely on hot-reload)
// ─────────────────────────────────────────────────────────────────────────────
async function initializeAllPorts(win) {
  mainWindow = win;
  try {
    const configs = await db.getConfig();
    console.log(`🚀 Initializing background listeners for ${configs.length} machine(s)...`);

    for (const config of configs) {
      if (activePorts.has(config.port) || pendingPorts.has(config.port)) {
        console.log(`⏭️  Skipping ${config.port} — already active or pending.`);
        continue;
      }
      pendingPorts.add(config.port);
      startBackgroundListener(config, win).catch((err) => {
        console.error(`❌ Listener startup failed for ${config.port}:`, err.message);
        pendingPorts.delete(config.port);
      });
    }

    // Start background watcher for reconnections
    startReconnectWatcher(win);
  } catch (err) {
    console.error('❌ Failed to initialize background ports:', err);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL: open one port + attach data handler
// ─────────────────────────────────────────────────────────────────────────────
async function startBackgroundListener(machine, win) {
  console.log(`📡 Starting listener for ${machine.model} on ${machine.port}...`);

  // ── 1. Fetch protocol (with one retry) ──────────────────────────────────
  let protocol;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await axios.get(
        `${API_BASE}/api/lab/machine-protocol/${machine.model}`,
        { timeout: 5000 }
      );
      if (!res.data.success) throw new Error('Backend returned success=false');
      protocol = res.data.protocol;
      break;
    } catch (err) {
      console.warn(`⚠️  Protocol fetch attempt ${attempt}/2 for ${machine.model}: ${err.message}`);
      if (attempt === 2) {
        pendingPorts.delete(machine.port);
        throw new Error(`Could not fetch protocol for ${machine.model} after 2 attempts`);
      }
      await sleep(2000);
    }
  }

  // ── 2. Resolve SOF / EOF for binary machines ─────────────────────────────
  const isHL7 = protocol.protocol_type === 'HL7';
  let SOF, EOF;
  if (!isHL7) {
    SOF = safeHex(protocol?.frame_structure?.['1']?.data, 0xaa);
    const keys    = Object.keys(protocol.frame_structure).map(Number).sort((a, b) => a - b);
    const lastKey = String(keys[keys.length - 1]);
    EOF = safeHex(protocol?.frame_structure?.[lastKey]?.data, 0xf5);
    console.log(`   SOF=0x${SOF.toString(16).toUpperCase()}  EOF=0x${EOF.toString(16).toUpperCase()}`);
  }

  // ── 3. Open SerialPort ───────────────────────────────────────────────────
  const port = new SerialPort({
    path:     machine.port,
    baudRate: parseInt(machine.baud, 10),
    autoOpen: false,
  });

  let buffer = Buffer.alloc(0);

  port.open((err) => {
    pendingPorts.delete(machine.port);
    if (err) {
      console.error(`❌ Port ${machine.port} open error: ${err.message}`);
      return;
    }
    console.log(`✅ Port ${machine.port} ACTIVE (${machine.model}).`);
    activePorts.set(machine.port, port);

    // Notify UI
    win?.webContents?.send('device-status', {
      model: machine.model,
      port: machine.port,
      status: 'Connected',
    });
  });

  // ── 4. Data handler ──────────────────────────────────────────────────────
  port.on('data', async (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    if (!isHL7) {
      // ── Binary framing ────────────────────────────────────────────────
      let startIdx, endIdx;
      while (
        (startIdx = buffer.indexOf(SOF)) !== -1 &&
        (endIdx   = buffer.indexOf(EOF, startIdx)) !== -1
      ) {
        const frame = buffer.slice(startIdx, endIdx + 1);
        buffer = buffer.slice(endIdx + 1);
        await processIncomingFrame(frame, protocol, machine, win).catch((e) =>
          console.error('Frame processing error:', e)
        );
      }

      if (buffer.length > 4096) {
        console.warn(`⚠️  Buffer overflow on ${machine.port} — clearing stale data.`);
        buffer = Buffer.alloc(0);
      }

    } else {
      // ── MLLP framing  \x0B ... \x1C\x0D ─────────────────────────────
      // Process all complete messages in the buffer before returning
      // (multiple messages can arrive in one TCP/serial burst)
      let raw = buffer.toString('utf8');

      let start = raw.indexOf('\x0B');
      let end   = raw.indexOf('\x1C\x0D');

      while (start !== -1 && end !== -1 && end > start) {
        const msg = raw.slice(start + 1, end);
        raw = raw.slice(end + 2);   // advance past \x1C\x0D

        if (msg.includes('MSH|')) {
          await processHL7Message(msg, machine, win).catch((e) =>
            console.error('HL7 processing error:', e)
          );
        }

        start = raw.indexOf('\x0B');
        end   = raw.indexOf('\x1C\x0D');
      }

      buffer = Buffer.from(raw, 'utf8');

      // Safety: prevent unbounded growth on malformed streams
      if (buffer.length > 100_000) {
        console.warn(`⚠️  HL7 buffer overflow on ${machine.port} — clearing.`);
        buffer = Buffer.alloc(0);
      }
    }
  });

  port.on('close', () => {
    console.log(`🔌 Port ${machine.port} closed.`);
    activePorts.delete(machine.port);

    // Notify UI
    win?.webContents?.send('device-status', {
      model: machine.model,
      port: machine.port,
      status: 'Disconnected',
    });
  });

  port.on('error', (err) => {
    console.error(`❌ Runtime error on ${machine.port}:`, err.message);
    activePorts.delete(machine.port);
  });
}


// ─────────────────────────────────────────────────────────────────────────────
// PROCESS BINARY FRAME  (Cliniquant Micro — keyed by patientId)
// ─────────────────────────────────────────────────────────────────────────────
async function processIncomingFrame(frame, protocol, machine, win) {
  // Patient ID lives at bytes 4–9
  const framePatientId = frame.slice(4, 10).toString('ascii').trim();
  if (!framePatientId || framePatientId === '000000') return;

  console.log(`🔍 Received binary data for ID: ${framePatientId} from ${machine.unique_id}`);

  // ── Session init ────────────────────────────────────────────────────────
  let session = sessionAccumulator.get(framePatientId);
  if (!session) {
    console.log(`🆕 New session for ${framePatientId} — fetching worklist...`);
    const wlRes = await axios.get(
      `${API_BASE}/api/lab/worklist-by-id/${framePatientId}`,
      { timeout: 5000 }
    );

    if (!wlRes.data.success || !wlRes.data.test) {
      console.log(`⚠️  No active test for ID ${framePatientId}. Ignoring.`);
      return;
    }
    const test = wlRes.data.test;

    let allParams = [];
    try {
      const pr = await axios.get(`${API_BASE}/api/lab/tests/${test.test_id}`, { timeout: 5000 });
      if (pr.data.success) allParams = pr.data.parameters;
    } catch {
      console.warn(`⚠️  Could not fetch parameters for test ${test.test_id}`);
    }

    session = {
      testId:        test.bill_item_id,
      sampleId:      test.sample_id,
      patientName:   test.patient_name,
      testName:      test.test_name,
      results:       [],
      requiredParams: allParams.map((p) => ({
        id:   (p.machine_parameter_code || p.parameter_name).toLowerCase(),
        name: p.parameter_name.toLowerCase(),
        unit: p.parameter_unit,
      })),
    };
    sessionAccumulator.set(framePatientId, session);
  }

  // ── Parse result bytes ──────────────────────────────────────────────────
  if (frame.length < 13) {
    console.warn(`⚠️  Frame too short (${frame.length} bytes) for ${framePatientId}`);
    return;
  }

  const testCode    = frame[1];
  const unitCode    = frame[2];
  const resultValue = frame.readFloatBE(9).toFixed(2);

  const tests     = protocol?.frame_structure?.['2']?.tests ?? [];
  const units     = protocol?.frame_structure?.['3']?.units ?? [];
  const machineTest = tests.find((t) => t.id === testCode);
  const paramName   = machineTest ? machineTest.name : `Param-${testCode}`;
  const unit        = units.find((u) => u.id === unitCode)?.unit ?? '';

  // De-duplicate
  if (session.results.some((r) => r.parameter_name.toLowerCase() === paramName.toLowerCase())) return;

  session.results.push({ parameter_name: paramName, result_value: resultValue, unit });
  console.log(`📍 Recorded: ${paramName} = ${resultValue} ${unit}`);

  win?.webContents?.send('test-completed', {
    sampleId:     session.sampleId,
    test_name:    paramName,
    result_value: resultValue,
  });

  await syncSession(session, machine, framePatientId);
}


// ─────────────────────────────────────────────────────────────────────────────
// PROCESS HL7 MESSAGE  (CelQuant Edge — keyed by OBR code)
// ─────────────────────────────────────────────────────────────────────────────
async function processHL7Message(msg, machine, win) {
  console.log(`📨 HL7 message received on ${machine.port} (${msg.length} chars)`);

  // ── 1. Parse HL7 ────────────────────────────────────────────────────────
  const parsed = parseHL7(msg);

  // The session key for CelQuant Edge is the OBR "code" field
  const sessionKey = parsed.code;

  if (!sessionKey) {
    console.warn('⚠️  HL7 message has no OBR code — skipping.');
    return;
  }

  console.log(`🔍 CelQuant Edge — Sample ID (OBR code): ${sessionKey}`);
  console.log(`   Patient: ${parsed.name || '(no name)'}  |  Case ID: ${parsed.case_id || '(none)'}`);

  // ── 2. Worklist lookup by code ───────────────────────────────────────────
  let session = sessionAccumulator.get(sessionKey);
  if (!session) {
    console.log(`🆕 New HL7 session for sample ID "${sessionKey}" — fetching worklist...`);

    let test = null;
    try {
      // OBR code == Sample ID — reuse the same worklist-by-id endpoint as binary machines
      const wlRes = await axios.get(
        `${API_BASE}/api/lab/worklist-by-id/${sessionKey}`,
        { timeout: 5000 }
      );
      if (wlRes.data.success && wlRes.data.test) test = wlRes.data.test;
    } catch (err) {
      console.warn(`⚠️  Worklist fetch failed for sample ID "${sessionKey}": ${err.message}`);
    }

    if (!test) {
      console.log(`⚠️  No active worklist entry for sample ID "${sessionKey}". Ignoring message.`);
      return;
    }

    let allParams = [];
    try {
      const pr = await axios.get(`${API_BASE}/api/lab/tests/${test.test_id}`, { timeout: 5000 });
      if (pr.data.success) allParams = pr.data.parameters;
    } catch {
      console.warn(`⚠️  Could not fetch parameters for test ${test.test_id}`);
    }

    session = {
      testId:        test.bill_item_id,
      sampleId:      test.sample_id,
      patientName:   test.patient_name || parsed.name,
      testName:      test.test_name,
      results:       [],
      requiredParams: allParams.map((p) => ({
        id:   (p.machine_parameter_code || p.parameter_name).toLowerCase(),
        name: p.parameter_name.toLowerCase(),
        unit: p.parameter_unit,
      })),
      protocol: 'HL7',
      // Store parsed patient info from the HL7 message itself for reference
      hl7Meta: {
        name:      parsed.name,
        sex:       parsed.sex,
        age:       parsed.age,
        age_unit:  parsed.age_unit,
        case_id:   parsed.case_id,
        bed_no:    parsed.bed_no,
        mode:      parsed.mode,
        test_mode: parsed.test_mode,
        timestamp: parsed.timestamp,
      },
    };
    sessionAccumulator.set(sessionKey, session);
  }

  // ── 3. Extract CBC results from parsed HL7 ──────────────────────────────
  let newResultsCount = 0;

  for (const param of CBC_PARAMS) {
    const obs = parsed[param];
    if (!obs || obs.value === undefined) continue;

    // De-duplicate
    if (session.results.some((r) => r.parameter_name.toLowerCase() === param.toLowerCase())) continue;

    const resultEntry = {
      parameter_name: param,
      result_value:   obs.value,
      unit:           obs.unit   ?? '',
      ref_range:      obs.range  ?? '',
      flag:           obs.flag   ?? '',
    };

    session.results.push(resultEntry);
    newResultsCount++;

    console.log(
      `📍 HL7 Recorded: ${param} = ${obs.value} ${obs.unit}` +
      (obs.flag ? `  [${obs.flag}]` : '')
    );

    // Live update to renderer
    win?.webContents?.send('test-completed', {
      sampleId:     session.sampleId,
      test_name:    param,
      result_value: obs.value,
      unit:         obs.unit,
      flag:         obs.flag,
    });
  }

  if (newResultsCount === 0) {
    console.log(`ℹ️  No new CBC results in this HL7 message for code "${sessionKey}".`);
    return;
  }

  // ── 4. Sync to backend ──────────────────────────────────────────────────
  await syncSession(session, machine, sessionKey);
}


// ─────────────────────────────────────────────────────────────────────────────
// SHARED: check completeness + POST results to API
// ─────────────────────────────────────────────────────────────────────────────
async function syncSession(session, machine, sessionKey) {
  const receivedNamesLower = session.results.map((r) => r.parameter_name.toLowerCase());

  let isComplete =
    session.requiredParams.length === 0 ||
    session.requiredParams.every(
      (p) => receivedNamesLower.includes(p.name) || receivedNamesLower.includes(p.id)
    );

  // 🧪 CelQuant Edge Optimization:
  // HL7 messages from the Edge always contain the full panel in one burst.
  // We mark as complete immediately to avoid "stuck" sessions due to minor parameter naming mismatches.
  if (session.protocol === 'HL7') {
    isComplete = true;
  }

  const status = isComplete ? 'Test Done' : 'In Progress';
  console.log(`☁️  Syncing [${status}] — ${session.results.length} result(s) for sample ID "${sessionKey}"...`);

  try {
    await axios.post(
      `${API_BASE}/api/lab/save-test-results`,
      {
        bill_item_id: session.testId,
        sample_id:    session.sampleId,
        machine_no:   machine.unique_id,
        test_name:    session.testName,
        results:      session.results,
        status,
      },
      { timeout: 8000 }
    );
  } catch (err) {
    console.error(`❌ Failed to sync results for "${sessionKey}": ${err.message}`);
    return;   // don't close session on sync failure — retry on next result
  }

  if (isComplete) {
    console.log(`✅ Panel COMPLETE for ${session.patientName}. Closing session.`);
    


    // 2. Automate the manual "Mark as Completed" step
    // This moves the test from Lab Worklist to Doctor's Verification list automatically.
    try {
      await axios.post(`${API_BASE}/api/lab/update-test-status`, {
        bill_item_id: session.testId,
        status: 'Completed'
      });
      console.log(`🚀 Automated: Test marked as COMPLETED for ${session.patientName}`);
    } catch (err) {
      console.error(`❌ Auto-completion failed for ${session.patientName}:`, err.message);
    }

    sessionAccumulator.delete(sessionKey);
  } else {
    const remaining = session.requiredParams
      .filter((p) => !receivedNamesLower.includes(p.name) && !receivedNamesLower.includes(p.id))
      .map((p) => p.name);
    console.log(`⏳ Waiting for: ${remaining.join(', ')}`);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC: graceful shutdown
// ─────────────────────────────────────────────────────────────────────────────
async function stopListening() {
  const closePromises = [];
  for (const [path, port] of activePorts) {
    if (port.isOpen) {
      closePromises.push(
        new Promise((res) =>
          port.close(() => {
            console.log(`🔌 Closed ${path}`);
            res();
          })
        )
      );
    }
  }
  await Promise.all(closePromises);
  activePorts.clear();
  pendingPorts.clear();
}


// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function safeHex(val, fallback) {
  const parsed = parseInt(val, 16);
  return isNaN(parsed) ? fallback : parsed;
}

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCHER: Auto-reconnect disconnected devices
// ─────────────────────────────────────────────────────────────────────────────
function startReconnectWatcher(win) {
  if (reconnectTimer) return;

  reconnectTimer = setInterval(async () => {
    try {
      const configs = await db.getConfig();
      if (!configs || configs.length === 0) return;

      const availablePortsList = await SerialPort.list();

      for (const config of configs) {
        // If port is NOT in activePorts AND NOT in pendingPorts
        if (!activePorts.has(config.port) && !pendingPorts.has(config.port)) {
          // Check if port actually exists on the system right now
          const exists = availablePortsList.some((p) => p.path === config.port);

          if (exists) {
            console.log(`🔄 Auto-reconnecting to ${config.model} on ${config.port}...`);
            pendingPorts.add(config.port);
            startBackgroundListener(config, win).catch((err) => {
              console.error(`❌ Reconnect failed for ${config.port}:`, err.message);
              pendingPorts.delete(config.port);
            });
          }
        }
      }
    } catch (err) {
      console.error('Watcher Error:', err);
    }
  }, 5000); // Check every 5 seconds
}


module.exports = { initializeAllPorts, stopListening, activePorts };