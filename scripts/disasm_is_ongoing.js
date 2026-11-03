const fs = require('fs');
const buf = fs.readFileSync('extracted_apks/base_unpacked/classes3.dex');

// codeOff: 4607848
const codeOff = 4607848;
const insnsSize = buf.readUInt32LE(codeOff + 12);
const insns = buf.subarray(codeOff + 16, codeOff + 16 + insnsSize * 2);
console.log('insns hex:', insns.toString('hex'));
