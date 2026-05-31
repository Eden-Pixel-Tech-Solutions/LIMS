const fs = require('fs');
const file = '/Users/stevejeraldicloud.com/Desktop/HMIS/LIS-Agent/main/serialManager.js';
let content = fs.readFileSync(file, 'utf8');

const target = `    // Parameter values: PARAM = VALUE
    for (const param of ELECTROLYTE_PARAMS) {
      // Escape special regex chars in param name (e.g. no issue here, but safe)
      const escaped = param.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
      const regex = new RegExp(\`\\\\b\${escaped}\\\\s*=\\\\s*([^\\\\s]+)\`, 'i');
      const match = line.match(regex);
      if (match) {
        const testDef = null; // unit/range come from protocol JSON at sync time
        result[param] = {
          value: match[1].trim(),
          unit: param === 'pH' ? '' : 'mmol/L',
        };
        break;
      }
    }`;

const replacement = `    // Parameter values: PARAM = VALUE
    for (const param of ELECTROLYTE_PARAMS) {
      // Escape special regex chars in param name (e.g. no issue here, but safe)
      const escaped = param.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
      const regex = new RegExp(\`\\\\b\${escaped}\\\\s*=\\\\s*(.*)\`, 'i');
      const match = line.match(regex);
      if (match) {
        const rest = match[1].trim();
        
        let value = '';
        let unit = '';
        let ref_range = '';
        
        // Extract reference range from parentheses
        const rangeMatch = rest.match(/\\((.*?)\\)/);
        if (rangeMatch) {
            ref_range = rangeMatch[1].trim();
        }
        
        // Remove the reference range part to get value and unit
        const valAndUnit = rest.replace(/\\(.*?\\)/, '').trim();
        const parts = valAndUnit.split(/\\s+/);
        
        value = parts[0] || '';
        unit = parts.slice(1).join(' ').trim();

        result[param] = {
          value: value,
          unit: unit || (param === 'pH' ? '' : 'mmol/L'),
          ref_range: ref_range,
        };
        break;
      }
    }`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log("Updated!");
