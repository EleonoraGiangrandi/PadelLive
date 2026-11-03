const fs = require('fs');
const buf = fs.readFileSync('extracted_apks/base_unpacked/classes3.dex');

const stringIdsOff = buf.readUInt32LE(0x3c);
const typeIdsOff = buf.readUInt32LE(0x44);
const methodIdsOff = buf.readUInt32LE(0x58);
const classDefsSize = buf.readUInt32LE(0x60);
const classDefsOff = buf.readUInt32LE(0x64);

function getString(idx) {
  let pos = buf.readUInt32LE(stringIdsOff + idx * 4);
  let len = 0, shift = 0;
  while (true) {
    const b = buf[pos++];
    len |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
  }
  let end = pos;
  while (end < buf.length && buf[end] !== 0) end++;
  return buf.subarray(pos, end).toString('utf8');
}
function getType(idx) {
  return getString(buf.readUInt32LE(typeIdsOff + idx * 4));
}
function getMethod(idx) {
  const classIdx = buf.readUInt16LE(methodIdsOff + idx * 8);
  const nameIdx = buf.readUInt32LE(methodIdsOff + idx * 8 + 4);
  return { class: getType(classIdx), name: getString(nameIdx) };
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
  const className = getType(buf.readUInt32LE(cOff));
  if (className.includes('ProfileActivity') || className.includes('PlayerProfile')) {
    console.log('Class:', className);
    const classDataOff = buf.readUInt32LE(cOff + 24);
    if (classDataOff === 0) continue;
    let p = classDataOff;
    let sFields, iFields, dMethods, vMethods;
    [sFields, p] = readUleb128(p); [iFields, p] = readUleb128(p);
    [dMethods, p] = readUleb128(p); [vMethods, p] = readUleb128(p);
    for (let j = 0; j < sFields + iFields; j++) { [_, p] = readUleb128(p); [_, p] = readUleb128(p); }
    for (let j = 0; j < dMethods + vMethods; j++) {
      let diff, access, codeOff;
      [diff, p] = readUleb128(p); [access, p] = readUleb128(p); [codeOff, p] = readUleb128(p);
      if (codeOff !== 0) {
        const insnsSize = buf.readUInt32LE(codeOff + 12);
        const insns = buf.subarray(codeOff + 16, codeOff + 16 + insnsSize * 2);
        for (let k = 0; k < insns.length - 2; k += 2) {
          if (insns[k] === 0x1a) {
            console.log('    str in', className, ':', getString(insns.readUInt16LE(k + 2)));
          }
        }
      }
    }
  }
}
