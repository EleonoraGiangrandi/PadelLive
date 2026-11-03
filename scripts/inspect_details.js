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
const protos = [];
for (let i = 0; i < protoIdsSize; i++) {
  const shortyIdx = buf.readUInt32LE(protoIdsOff + i * 12);
  const returnTypeIdx = buf.readUInt32LE(protoIdsOff + i * 12 + 4);
  const parametersOff = buf.readUInt32LE(protoIdsOff + i * 12 + 8);
  const params = [];
  if (parametersOff !== 0) {
    const pSize = buf.readUInt32LE(parametersOff);
    for (let j = 0; j < pSize; j++) {
      params.push(types[buf.readUInt16LE(parametersOff + 4 + j * 2)]);
    }
  }
  protos.push({ shorty: strings[shortyIdx], returnType: types[returnTypeIdx], params });
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
  methods.push({ class: types[classIdx], proto: protos[protoIdx], name: strings[nameIdx] });
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

const targetClasses = [
  'Lnet/fredericosilva/padely/models/FipEvent;',
  'Lnet/fredericosilva/padely/models/Match;',
  'Lnet/fredericosilva/padely/models/Player;',
  'Lnet/fredericosilva/padely/models/Team;',
  'Lnet/fredericosilva/padely/models/PlayerProfile;',
  'Lnet/fredericosilva/padely/models/PlayerRanking;',
  'Lnet/fredericosilva/padely/models/PlayerStats;',
  'Lnet/fredericosilva/padely/models/SetStats;',
  'Lnet/fredericosilva/padely/models/Stats;',
  'Lnet/fredericosilva/padely/models/Stats$MatchStats;',
  'Lnet/fredericosilva/padely/models/Stats$ReturnStats;',
  'Lnet/fredericosilva/padely/models/Stats$ServeStats;',
  'Lnet/fredericosilva/padely/models/Stats$TotalPointsStats;',
  'Lnet/fredericosilva/padely/models/StatsResponse;',
  'Lnet/fredericosilva/padely/models/TournamentType;',
  'Lnet/fredericosilva/padely/models/Gender;',
  'Lnet/fredericosilva/padely/models/Partner;',
  'Lnet/fredericosilva/padely/models/RssArticle;',
  'Lnet/fredericosilva/padely/PadelyPreferences;',
  'Lnet/fredericosilva/padely/ui/match/MatchActivity;',
  'Lnet/fredericosilva/padely/ui/match/MatchStatsFragment;',
  'Lnet/fredericosilva/padely/ui/match/StatsItem;',
  'Lnet/fredericosilva/padely/ui/tournament/TournamentActivity;'
];

for (let i = 0; i < classDefsSize; i++) {
  const cOff = classDefsOff + i * 32;
  const className = types[buf.readUInt32LE(cOff)];
  if (!targetClasses.includes(className)) continue;

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
    for (let j = 0; j < sFields; j++) {
      let diff, access;
      [diff, p] = readUleb128(p);
      [access, p] = readUleb128(p);
      fIdx = j === 0 ? diff : fIdx + diff;
      const f = fields[fIdx];
      if (f) console.log('  [static field] ' + f.name + ': ' + f.type);
    }
    fIdx = 0;
    for (let j = 0; j < iFields; j++) {
      let diff, access;
      [diff, p] = readUleb128(p);
      [access, p] = readUleb128(p);
      fIdx = j === 0 ? diff : fIdx + diff;
      const f = fields[fIdx];
      if (f) console.log('  [field] ' + f.name + ': ' + f.type);
    }
    let mIdx = 0;
    for (let j = 0; j < dMethods; j++) {
      let diff, access, codeOff;
      [diff, p] = readUleb128(p);
      [access, p] = readUleb128(p);
      [codeOff, p] = readUleb128(p);
      mIdx = j === 0 ? diff : mIdx + diff;
      const m = methods[mIdx];
      if (m && !m.name.startsWith('$') && m.name !== '<init>') {
        console.log('  [direct method] ' + m.name + '(' + m.proto.params.join(', ') + '): ' + m.proto.returnType);
      }
    }
    mIdx = 0;
    for (let j = 0; j < vMethods; j++) {
      let diff, access, codeOff;
      [diff, p] = readUleb128(p);
      [access, p] = readUleb128(p);
      [codeOff, p] = readUleb128(p);
      mIdx = j === 0 ? diff : mIdx + diff;
      const m = methods[mIdx];
      if (m && !m.name.startsWith('$')) {
        console.log('  [method] ' + m.name + '(' + m.proto.params.join(', ') + '): ' + m.proto.returnType);
      }
    }
  }
}
