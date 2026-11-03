const fs = require('fs');
const buf = fs.readFileSync('extracted_apks/base_unpacked/classes3.dex');

const stringIdsSize = buf.readUInt32LE(0x38);
const stringIdsOff = buf.readUInt32LE(0x3c);
const typeIdsSize = buf.readUInt32LE(0x40);
const typeIdsOff = buf.readUInt32LE(0x44);
const protoIdsSize = buf.readUInt32LE(0x48);
const protoIdsOff = buf.readUInt32LE(0x4c);
const fieldIdsSize = buf.readUInt32LE(0x50);
const fieldIdsOff = buf.readUInt32LE(0x54);
const methodIdsSize = buf.readUInt32LE(0x58);
const methodIdsOff = buf.readUInt32LE(0x5c);
const classDefsSize = buf.readUInt32LE(0x60);
const classDefsOff = buf.readUInt32LE(0x64);

const strings = [];
for (let i = 0; i < stringIdsSize; i++) {
  let pos = buf.readUInt32LE(stringIdsOff + i * 4);
  let len = 0, shift = 0;
  while (true) {
    const b = buf[pos++];
    len |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  let end = pos;
  while (end < buf.length && buf[end] !== 0) end++;
  strings.push(buf.subarray(pos, end).toString('utf8'));
}
const types = [];
for (let i = 0; i < typeIdsSize; i++) {
  types.push(strings[buf.readUInt32LE(typeIdsOff + i * 4)]);
}
const fields = [];
for (let i = 0; i < fieldIdsSize; i++) {
  const classIdx = buf.readUInt16LE(fieldIdsOff + i * 8);
  const typeIdx = buf.readUInt16LE(fieldIdsOff + i * 8 + 2);
  const nameIdx = buf.readUInt32LE(fieldIdsOff + i * 8 + 4);
  fields.push({ class: types[classIdx], type: types[typeIdx], name: strings[nameIdx] });
}
const methods = [];
for (let i = 0; i < methodIdsSize; i++) {
  const classIdx = buf.readUInt16LE(methodIdsOff + i * 8);
  const protoIdx = buf.readUInt16LE(methodIdsOff + i * 8 + 2);
  const nameIdx = buf.readUInt32LE(methodIdsOff + i * 8 + 4);
  methods.push({ class: types[classIdx], name: strings[nameIdx] });
}

function readUleb128(p) {
  let result = 0, shift = 0;
  while (true) {
    const byte = buf[p++];
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }
  return [result, p];
}

// Inspect ExtensionsKt methods
for (let i = 0; i < classDefsSize; i++) {
  const cOff = classDefsOff + i * 32;
  const className = types[buf.readUInt32LE(cOff)];
  if (className !== 'Lnet/fredericosilva/padely/ExtensionsKt;') continue;
  console.log('ExtensionsKt found!');
  const classDataOff = buf.readUInt32LE(cOff + 24);
  let p = classDataOff;
  let sFields, iFields, dMethods, vMethods;
  [sFields, p] = readUleb128(p);
  [iFields, p] = readUleb128(p);
  [dMethods, p] = readUleb128(p);
  [vMethods, p] = readUleb128(p);

  let mIdx = 0;
  for (let j = 0; j < dMethods; j++) {
    let diff, access, codeOff;
    [diff, p] = readUleb128(p);
    [access, p] = readUleb128(p);
    [codeOff, p] = readUleb128(p);
    mIdx = j === 0 ? diff : mIdx + diff;
    const m = methods[mIdx];
    console.log('\nMethod:', m.name, 'codeOff:', codeOff);
    if (codeOff !== 0) {
      const registersSize = buf.readUInt16LE(codeOff);
      const insSize = buf.readUInt16LE(codeOff + 2);
      const outsSize = buf.readUInt16LE(codeOff + 4);
      const triesSize = buf.readUInt16LE(codeOff + 6);
      const insnsSize = buf.readUInt32LE(codeOff + 12);
      const insns = buf.subarray(codeOff + 16, codeOff + 16 + insnsSize * 2);
      // Scan insns for const-string (0x1a) or const-string/jumbo (0x1b)
      console.log('  registers:', registersSize, 'insnsSize:', insnsSize);
      for (let k = 0; k < insns.length - 2; k += 2) {
        const opcode = insns[k];
        if (opcode === 0x1a) { // const-string
          const strIdx = insns.readUInt16LE(k + 2);
          console.log('    const-string:', strings[strIdx]);
        } else if (opcode === 0x1b) { // const-string/jumbo
          const strIdx = insns.readUInt32LE(k + 2);
          console.log('    const-string/jumbo:', strings[strIdx]);
          k += 2;
        } else if (opcode === 0x6e || opcode === 0x74) { // invoke-virtual / invoke-direct
          const mRefIdx = insns.readUInt16LE(k + 2);
          const invokedM = methods[mRefIdx];
          if (invokedM && invokedM.class.includes('padely')) {
            console.log('    invoke padely:', invokedM.class, invokedM.name);
          }
        }
      }
    }
  }
}
