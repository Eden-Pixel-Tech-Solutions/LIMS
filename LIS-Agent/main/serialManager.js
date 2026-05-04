const { SerialPort } = require('serialport');
const axios = require('axios');
const db = require('../db/sqlite');

let currentPort = null;
const API_BASE = 'http://localhost:7005';

async function startListening(testInfo, win) {
  try {
    const { port, baud, model, sampleId, testId, machineId, parameters } = testInfo;

    // 1. FETCH DYNAMIC PROTOCOL FROM CLOUD
    console.log(`🌐 Fetching protocol for model: ${model}...`);
    let protocol = null;
    try {
      const res = await axios.get(`${API_BASE}/api/lab/machine-protocol/${model}`);
      if (res.data.success) {
        protocol = res.data.protocol;
      }
    } catch (err) {
      console.error(`❌ Protocol not found for ${model}.`);
    }

    if (!protocol) {
        console.error("No protocol available. Cannot parse data.");
        return false;
    }

    // 2. INITIALIZE PORT
    if (currentPort && currentPort.isOpen) {
      await currentPort.close();
    }

    currentPort = new SerialPort({
      path: port,
      baudRate: parseInt(baud),
      autoOpen: false
    });

    let buffer = Buffer.alloc(0);

    currentPort.open((err) => {
      if (err) {
        console.error('Error opening port:', err.message);
        return false;
      }
      console.log(`✅ Listening on ${port} for ${model} (${protocol.protocol_type})`);
    });

    currentPort.on('data', async (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      
      if (protocol.protocol_type === "HL7") {
        // --- IMPROVED HL7 DETECTION ---
        const raw = buffer.toString('utf8');
        if (raw.includes("MSH|")) {
           // HL7 messages often end with File/Block separator (0x1C 0x0D)
           const EOF_HL7 = "\x1C\x0D";
           const msgEndIndex = raw.indexOf(EOF_HL7);
           
           if (msgEndIndex !== -1) {
             const fullMsg = raw.substring(raw.indexOf("MSH|"), msgEndIndex);
             console.log("📦 Detected FULL HL7 Message Block");
             
             // Clear buffer
             buffer = buffer.slice(msgEndIndex + 2);
             
             parseHL7Message(fullMsg, protocol, testInfo, win);
           } else if (raw.length > 2000) { 
             // Fallback: If buffer gets too large without EOF, process by segment
             console.log("⚠️ Buffer large, attempting partial HL7 parse...");
             parseHL7Message(raw, protocol, testInfo, win);
             buffer = Buffer.alloc(0);
           }
        }
      } else {
        // --- BINARY PARSING LOGIC ---
        const SOF = parseInt(protocol.frame_structure["1"].data, 16) || 0xAA;
        const EOF = parseInt(protocol.frame_structure["22"].data, 16) || 0xF5;

        const startIndex = buffer.indexOf(SOF);
        const endIndex = buffer.indexOf(EOF);

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const frame = buffer.slice(startIndex, endIndex + 1);
          buffer = buffer.slice(endIndex + 1);
          parseBinaryFrame(frame, protocol, testInfo, win);
        }
      }
    });

    return true;
  } catch (err) {
    console.error("Serial startup error:", err);
    return false;
  }
}

/**
 * PARSE HL7 MESSAGE
 */
async function parseHL7Message(raw, protocol, testInfo, win) {
  try {
    // Normalize line endings
    const lines = raw.replace(/\r\n/g, "\r").replace(/\n/g, "\r").split("\r");
    const results = [];

    console.log(`📄 Parsing ${lines.length} HL7 segments...`);

    for (const line of lines) {
      if (line.startsWith("OBX")) {
        const fields = line.split("|");
        // fields[3] is Test ID (e.g. 6690-2^WBC^LN)
        const testIdPart = fields[3]?.split("^")[0]; 
        const resultValue = fields[5];
        const unit = fields[6];
        const refRange = fields[7];

        if (!testIdPart) continue;

        // MATCHING LOGIC (Robust string matching)
        const machineTest = protocol.tests.find(t => 
          t.id === testIdPart || 
          t.label.toLowerCase() === testIdPart.toLowerCase()
        );

        if (machineTest) {
          const parameterName = machineTest.name;
          
          // Filter against selected parameters (matching by ID or Name)
          const isRequested = testInfo.parameters && testInfo.parameters.some(p => 
            p.id.toString() === testIdPart || 
            p.name.toLowerCase() === parameterName.toLowerCase()
          );
          
          if (isRequested) {
            console.log(`🎯 HL7 MATCH! [${parameterName}] Result: ${resultValue} ${unit}`);
            results.push({
              parameter_name: parameterName,
              result_value: resultValue,
              unit: unit,
              reference_range: refRange
            });

            // Update UI
            win.webContents.send('test-completed', { 
              sampleId: testInfo.sampleId, 
              result_value: resultValue,
              unit: unit,
              test_name: parameterName,
              reference_range: refRange
            });
          } else {
            console.log(`⏩ HL7 Param ${parameterName} (${testIdPart}) not in requested list.`);
          }
        }
      }
    }

    if (results.length > 0) {
      console.log(`☁️ Syncing ${results.length} parameters to cloud...`);
      try {
        await axios.post(`${API_BASE}/api/lab/save-test-results`, {
          bill_item_id: testInfo.testId,
          sample_id: testInfo.sampleId,
          machine_no: testInfo.machineId,
          test_name: testInfo.model,
          results: results,
          status: 'Completed'
        });
      } catch (syncErr) {
        console.error("Cloud Sync Error:", syncErr.message);
      }
    }
  } catch (err) {
    console.error("HL7 Processing Error:", err);
  }
}

/**
 * PARSE BINARY FRAME
 */
async function parseBinaryFrame(frame, protocol, testInfo, win) {
  try {
    const testCode = frame[1];
    const unitCode = frame[2];
    
    const machineTest = protocol.frame_structure["2"].tests.find(t => t.id === testCode);
    const machineTestName = machineTest ? machineTest.name : `Test-${testCode}`;
    
    const machineUnit = protocol.frame_structure["3"].units.find(u => u.id === unitCode);
    const unitName = machineUnit ? machineUnit.unit : "";
    
    const resultValue = frame.readFloatBE(9).toFixed(2);
    const refHigh = frame.readFloatBE(13).toFixed(2);
    const refLow = frame.readFloatBE(17).toFixed(2);

    const isRequested = testInfo.parameters && testInfo.parameters.some(p => p.id.toString() === testCode.toString());
    
    if (isRequested) {
      console.log(`🎯 BINARY MATCH! [${machineTestName}] Result: ${resultValue} ${unitName}`);

      await axios.post(`${API_BASE}/api/lab/save-test-results`, {
        bill_item_id: testInfo.testId,
        sample_id: testInfo.sampleId,
        machine_no: testInfo.machineId,
        test_name: machineTestName,
        results: [{
          parameter_name: machineTestName,
          result_value: resultValue,
          unit: unitName, 
          reference_range: `${refLow} - ${refHigh}`
        }],
        status: 'Completed'
      });
      
      win.webContents.send('test-completed', { 
        sampleId: testInfo.sampleId, 
        result_value: resultValue,
        unit: unitName,
        test_name: machineTestName,
        reference_range: `${refLow} - ${refHigh}`
      });
    }
  } catch (decodeErr) {
    console.error("Binary Parsing Error:", decodeErr);
  }
}

async function stopListening() {
  if (currentPort && currentPort.isOpen) {
    await currentPort.close();
  }
}

module.exports = { startListening, stopListening };