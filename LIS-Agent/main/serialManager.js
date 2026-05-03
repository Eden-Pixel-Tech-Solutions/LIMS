const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const axios = require('axios');
const db = require('../db/sqlite');

let currentPort = null;
const API_BASE = 'http://localhost:7005';

const TEST_MAP = {
  1: "ALP", 2: "ALT", 3: "AMY", 4: "AST", 5: "CHO", 6: "CKMB", 7: "CKNAC",
  8: "GGT", 9: "GLU", 10: "LDH", 11: "TRIG", 12: "UREA", 13: "URIC-ACID",
  14: "ALB", 15: "TBIL", 16: "CAL-A", 17: "CAL-O", 18: "CHL", 19: "CREAT",
  20: "DBIL", 21: "HDL", 22: "PHO", 23: "TP", 24: "MICRO PROTEIN", 25: "HBA1C",
  26: "ASO LATEX", 27: "CRP LATEX", 28: "RF LATEX", 29: "D DIMER"
};

const UNIT_MAP = {
  0: "g/L", 1: "ug/dL", 2: "mmoL/L", 3: "U/L", 4: "mg/dL", 5: "umoL/L",
  6: "mg/L", 7: "g/dL", 8: "nmol/l", 9: "U/ml", 10: "ng/ml", 11: "ug/ml",
  12: "ug%", 13: "mEq/L", 14: "%", 15: ""
};

async function startListening(testInfo, win) {
  try {
    const config = await db.getConfig();
    if (!config || !config.port) {
      console.error("No serial configuration found");
      return false;
    }

    if (currentPort && currentPort.isOpen) {
      await currentPort.close();
    }

    console.log(`Opening port ${config.port} at ${config.baud} baud...`);
    
    currentPort = new SerialPort({
      path: config.port,
      baudRate: parseInt(config.baud),
      autoOpen: false
    });

    let buffer = Buffer.alloc(0);

    currentPort.open((err) => {
      if (err) {
        console.error('Error opening port: ', err.message);
        return false;
      }
      console.log('Serial Port Opened Successfully');
    });

    currentPort.on('data', async (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      
      const startIndex = buffer.indexOf(0xAA);
      const endIndex = buffer.indexOf(0xF5);

      if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const frame = buffer.slice(startIndex, endIndex + 1);
        buffer = buffer.slice(endIndex + 1);

        console.log(`Detected Meril Frame: ${frame.toString('hex')}`);

        try {
          const testCode = frame[1];
          const unitCode = frame[2];
          const testNameFromMachine = TEST_MAP[testCode] || `Test-${testCode}`;
          const unitNameFromMachine = UNIT_MAP[unitCode] || "";
          
          const patientIdFromMachine = frame.slice(3, 9).toString().trim();
          const resultValue = frame.readFloatBE(9).toFixed(2);
          const refHigh = frame.readFloatBE(13).toFixed(2);
          const refLow = frame.readFloatBE(17).toFixed(2);

          console.log(`[${testNameFromMachine}] Result: ${resultValue} ${unitNameFromMachine} | Ref: ${refLow}-${refHigh}`);

          await axios.post(`${API_BASE}/api/lab/save-test-results`, {
            bill_item_id: testInfo.bill_item_id,
            sample_id: testInfo.sample_id,
            machine_no: config.port,
            test_id: testInfo.test_id,
            test_name: testInfo.test_name,
            results: [{
              parameter_name: testInfo.test_name,
              result_value: resultValue,
              unit: unitNameFromMachine, 
              reference_range: `${refLow} - ${refHigh}`
            }],
            status: 'Completed'
          });
          
          win.webContents.send('test-completed', { 
            sampleId: testInfo.sample_id, 
            result: resultValue,
            unit: unitNameFromMachine,
            testName: testNameFromMachine,
            testCode: testCode,
            referenceRange: `${refLow} - ${refHigh}`
          });
        } catch (decodeErr) {
          console.error("Protocol Decoding Error:", decodeErr);
        }
      }
    });

    return true;
  } catch (err) {
    console.error("Serial listener startup error:", err);
    return false;
  }
}

async function stopListening() {
  if (currentPort && currentPort.isOpen) {
    console.log("Closing serial port...");
    await currentPort.close();
  }
}

module.exports = { startListening, stopListening };
