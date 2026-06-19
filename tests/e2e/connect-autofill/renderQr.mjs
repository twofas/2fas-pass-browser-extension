// SPDX-License-Identifier: BUSL-1.1
//
// Render a QR PNG from a payload string, for injection into the emulator camera via
// the emulator's `-virtualscene-poster` flag. High contrast + quiet zone so the 2FAS
// scanner reads it off the virtual-scene wall.
import qrcode from 'qrcode';

const data = process.argv[2];
const out = process.argv[3];

if (!data || !out) {
  console.error('usage: node renderQr.mjs <payload> <out.png>');
  process.exit(1);
}

await qrcode.toFile(out, data, {
  width: 1200,
  margin: 4,
  errorCorrectionLevel: 'M',
  color: { dark: '#000000ff', light: '#ffffffff' }
});

console.log('wrote QR png:', out, '(payload', data.length, 'chars)');
