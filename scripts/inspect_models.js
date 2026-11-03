const fs = require('fs');
const buf = fs.readFileSync('extracted_apks/base_unpacked/classes3.dex');

const stringIdsSize = buf.readUInt32LE(0x38);
const stringIdsOff = buf.readUInt32LE(0x3c);
const typeIdsSize = buf.readUInt32LE(0x40);
const typeIdsOff = buf.readUInt32LE(0x44);
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

for (let i = 0; i < classDefsSize; i++) {
  const cOff = classDefsOff + i * 32;
  const classIdx = buf.readUInt32LE(cOff);
  const className = types[classIdx];
  if (!className || !className.includes('fredericosilva/padely')) continue;
  if (className.includes('$Creator') || className.includes('$$') || className.includes('$sam$') || className.includes('R$') || className.endsWith('/R;')) continue;

  console.log('\n==============================');
  console.log('CLASS:', className);
  const classDataOff = buf.readUInt32LE(cOff + 24);
  if (classDataOff !== 0) {
    let p = classDataOff;
    let sFields, iFields, dMethods, vMethods;
    [sFields, p] = readUleb128(p);
    [iFields, p] = readUleb128(p);
    [dMethods, p] = readUleb128(p);
    [vMethods, p] = readUleb128(p);

    let fIdx = 0;
    if (sFields + iFields > 0) {
      console.log('  --- Fields ---');
    }
    for (let j = 0; j < sFields; j++) {
      let diff, access;
      [diff, p] = readUleb128(p);
      [access, p] = readUleb128(p);
      fIdx = j === 0 ? diff : fIdx + diff;
      const f = fields[fIdx];
      if (f) console.log('    static ' + f.name + ': ' + f.type);
    }
    fIdx = 0;
    for (let j = 0; j < iFields; j++) {
      let diff, access;
      [diff, p] = readUleb128(p);
      [access, p] = readUleb128(p);
      fIdx = j === 0 ? diff : fIdx + diff;
      const f = fields[fIdx];
      if (f) console.log('    ' + f.name + ': ' + f.type);
    }

    if (dMethods + vMethods > 0) {
      console.log('  --- Methods ---');
    }
    let mIdx = 0;
    for (let j = 0; j < dMethods; j++) {
      let diff, access, codeOff;
      [diff, p] = readUleb128(p);
      [access, p] = readUleb128(p);
      [codeOff, p] = readUleb128(p);
      mIdx = j === 0 ? diff : mIdx + diff;
      const m = methods[mIdx];
      if (m) console.log('    direct ' + m.name);
    }
    mIdx = 0;
    for (let j = 0; j < vMethods; j++) {
      let diff, access, codeOff;
      [diff, p] = readUleb128(p);
      [access, p] = readUleb128(p);
      [codeOff, p] = readUleb128(p);
      mIdx = j === 0 ? diff : mIdx + diff;
      const m = methods[mIdx];
      if (m) console.log('    virtual ' + m.name);
    }
  }
}
