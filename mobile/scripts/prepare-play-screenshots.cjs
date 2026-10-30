const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
async function main() {
  const source = process.argv[2];
  if (!source) throw Error('Pass the directory of verified native CI captures');
  const dest = path.resolve(__dirname, '../store/screenshots');
  await fs.mkdir(dest, { recursive: true });
  const shots = ['meeting-ready', 'duration-dial', 'kitchen-timer', 'breathing-timer', 'speech-timer', 'multi-stopwatch'];
  for (const [i, name] of shots.entries()) {
    const input = path.resolve(source, `phone-android-${name}.png`);
    // Preserve the complete captured screen. Contain-fit adds neutral margins,
    // meeting Play's 16:9 dimensions without cropping controls or inventing UI.
    await sharp(input).resize({ width: 1080, height: 1920, fit: 'contain', background: '#eeece5' }).png().toFile(path.join(dest, `phone-${i + 1}-${name}.png`));
  }
  await sharp(path.resolve(source, 'tablet-android-landscape.png')).png().toFile(path.join(dest, 'tablet-landscape.png'));
  console.log('Prepared six complete native phone captures and one landscape tablet capture.');
}
main().catch(e => { console.error(e); process.exit(1); });
