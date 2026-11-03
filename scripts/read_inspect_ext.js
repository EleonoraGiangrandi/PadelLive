const fs = require('fs');
const path = require('path');

// We have tools to read dex or we can use our rizin/disassembler or a node script
// Let's check how inspect_extensions.js was written earlier!
if (fs.existsSync('scripts/inspect_extensions.js')) {
  console.log(fs.readFileSync('scripts/inspect_extensions.js', 'utf8'));
}
