const fs = require('fs');
const path = require('path');

const rate = 22050;
const seconds = 0.36;
const count = Math.floor(rate * seconds);
const data = Buffer.alloc(count * 2);

for (let index = 0; index < count; index += 1) {
  const time = index / rate;
  const attack = Math.min(1, time / 0.018);
  const release = Math.exp(-time * 7.5);
  const warmFundamental = Math.sin(2 * Math.PI * 392 * time);
  const softFifth = Math.sin(2 * Math.PI * 588 * time) * 0.28;
  const signal = (warmFundamental + softFifth) * attack * release * 0.18;
  data.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(signal * 32767))), index * 2);
}

const header = Buffer.alloc(44);
header.write('RIFF', 0);
header.writeUInt32LE(36 + data.length, 4);
header.write('WAVEfmt ', 8);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(1, 22);
header.writeUInt32LE(rate, 24);
header.writeUInt32LE(rate * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write('data', 36);
header.writeUInt32LE(data.length, 40);

const output = path.join(__dirname, '..', 'assets', 'sounds', 'commitment-created.wav');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, Buffer.concat([header, data]));
