const fs = require('fs');
const buf = fs.readFileSync('extracted_apks/base_unpacked/classes3.dex');

const stringIdsSize = buf.readUInt32LE(0x38);
const stringIdsOff = buf.readUInt32LE(0x3c);
const typeIdsSize = buf.readUInt32LE(0x40);
const typeIdsOff = buf.readUInt32LE(0x44);
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
const methods = [];
for (let i = 0; i < methodIdsSize; i++) {
  const classIdx = buf.readUInt16LE(methodIdsOff + i * 8);
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

for (let i = 0; i < classDefsSize; i++) {
  const cOff = classDefsOff + i * 32;
  const className = types[buf.readUInt32LE(cOff)];
  if (!className.includes('RankingsViewModel')) continue;
  console.log('Class:', className);
  const classDataOff = buf.readUInt32LE(cOff + 24);
  if (classDataOff === 0) continue;
  let p = classDataOff;
  let sFields, iFields, dMethods, vMethods;
  [sFields, p] = readUleb128(p);
  [iFields, p] = readUleb128(p);
  [dMethods, p] = readUleb128(p);
  [vMethods, p] = readUleb128(p);
  for (let j = 0; j < sFields + iFields; j++) {
    [_, p] = readUleb128(p);
    [_, p] = readUleb128(p);
  }
  for (let j = 0; j < dMethods + vMethods; j++) {
    let diff, access, codeOff;
    [diff, p] = readUleb128(p);
    [access, p] = readUleb128(p);
    [codeOff, p] = readUleb128(p);
    if (codeOff !== 0) {
      const insnsSize = buf.readUInt32LE(codeOff + 12);
      const insns = buf.subarray(codeOff + 16, codeOff + 16 + insnsSize * 2);
      for (let k = 0; k < insns.length - 2; k += 2) {
        if (insns[k] === 0x1a) {
          console.log('  str:', strings[insns.readUInt16LE(k + 2)]);
        } else if (insns[k] === 0x6e || insns[k] === 0x74) {
          const m = methods[insns.readUInt16LE(k + 2)];
          if (m && m.class.includes('padely')) {
            console.log('  call:', m.class.split('/').pop(), m.name);
          }
        }
      }
    }
  }
}
