const fs = require('fs');
const file = '/Users/stevejeraldicloud.com/Desktop/HMIS/LIS-Agent/main/serialManager.js';
let content = fs.readFileSync(file, 'utf8');

const regexBad = /const escaped = param\.replace\(\/\[\.\*\+\?\^\$\{\}\(\)\|\[\\\\\]\\\\\\\\\]\/g, '\\\\\\\\\$&'\);\s*const regex = new RegExp\(`\\\\\\\\b\$\{escaped\}\\\\\\\\s\*=\\\\\\\\s\*\(\.\*\)`\, 'i'\);\s*const match = line\.match\(regex\);\s*if \(match\) \{\s*const rest = match\[1\]\.trim\(\);\s*let value = '';\s*let unit = '';\s*let ref_range = '';\s*\/\/ Extract reference range from parentheses\s*const rangeMatch = rest\.match\(\/\\\\\(\(\.\*\?\)\\\\\)\/\);\s*if \(rangeMatch\) \{\s*ref_range = rangeMatch\[1\]\.trim\(\);\s*\}\s*\/\/ Remove the reference range part to get value and unit\s*const valAndUnit = rest\.replace\(\/\\\\\(\.\*\?\\\\\)\/\, ''\)\.trim\(\);\s*const parts = valAndUnit\.split\(\/\\\\s\+\/\);/m;

const replacement = `const escaped = param.replace(/[.*+?^\\$\\{}()|[\\]\\\\]/g, '\\\\$&');
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
        const parts = valAndUnit.split(/\\s+/);`;

if(content.match(regexBad)) {
  content = content.replace(regexBad, replacement);
  fs.writeFileSync(file, content);
  console.log("Fixed successfully via regex.");
} else {
  // Let's just find exactly what lines 380 to 420 are
  console.log("Regex didn't match, let's dump lines 378 to 415 to fix manually.");
  console.log(content.split('\\n').slice(378, 416).join('\\n'));
}
