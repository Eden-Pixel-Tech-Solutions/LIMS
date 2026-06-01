const fs = require('fs');
const file = '/Users/stevejeraldicloud.com/Desktop/HMIS/LIS-Agent/main/serialManager.js';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const newBlock = `      // Escape special regex chars in param name (e.g. no issue here, but safe)
      const escaped = param.replace(/[.*+?^\\$\\{}()|[\\]\\\\]/g, '\\\\$&');
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
      }`;

const before = lines.slice(0, 380);
const after = lines.slice(423);

const newContent = before.join('\n') + '\n' + newBlock + '\n' + after.join('\n');
fs.writeFileSync(file, newContent);
console.log("Fixed manually via line slicing.");
