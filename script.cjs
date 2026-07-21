const fs = require('fs');
const file = 'e:/kcecommercewebsite/kleidercare-e-commerce/src/data/products.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /category:\s*"Chemicals"[\s\S]*?description:\s*"([^"]*)"/g;
content = content.replace(regex, (match, desc) => {
  let mainDesc = desc;
  let specsStr = '';
  
  // Find where specs start (either HSN or Pkg Size)
  const hsnMatch = desc.match(/\.?\s*(HSN\s*:\s*.*)/);
  const pkgMatch = desc.match(/\.?\s*(Pkg Size\s*:\s*.*)/);
  
  let matchStr = '';
  if (hsnMatch) matchStr = hsnMatch[1];
  else if (pkgMatch) matchStr = pkgMatch[1];
  
  if (matchStr) {
    mainDesc = desc.substring(0, desc.indexOf(matchStr)).trim();
    if (mainDesc.endsWith('.')) {
      // keep it
    }
    
    // Now parse matchStr into JSON for specifications
    const specs = {};
    const parts = matchStr.split(/\.\s+(?=[A-Z])/);
    for (const part of parts) {
      const [k, ...v] = part.split(':');
      if (k && v.length) {
        specs[k.trim()] = v.join(':').trim();
      }
    }
    
    const specsJson = JSON.stringify(specs, null, 4).replace(/\n/g, '\n    ');
    
    return match.replace(
      'description: "' + desc + '"',
      'description: "' + mainDesc + '",\n    specifications: ' + specsJson
    );
  }
  return match;
});

fs.writeFileSync(file, content);
console.log("Done");
