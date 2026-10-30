const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');
async function main() {
  const dest = path.resolve(__dirname, '../store/assets');
  await fs.mkdir(dest, { recursive: true });
  await sharp(path.resolve(__dirname, '../assets/icon.png')).resize(512, 512).png().toFile(path.join(dest, 'icon-512.png'));
  const cells = [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${686 + i * 38}" y="356" width="30" height="12" rx="3" fill="${i < 2 ? '#64c9c4' : i === 2 ? '#ff9b90' : '#355157'}"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
    <rect width="1024" height="500" fill="#eeece5"/><rect x="0" y="0" width="1024" height="8" fill="#b82933"/>
    <text x="62" y="106" font-family="Georgia,serif" font-size="34" fill="#20211e">Corp<tspan fill="#b82933">Timer</tspan></text>
    <text x="60" y="224" font-family="Georgia,serif" font-size="61" fill="#20211e">Make time</text><text x="60" y="294" font-family="Georgia,serif" font-size="61" fill="#20211e">for it.</text>
    <rect x="62" y="331" width="50" height="4" fill="#b82933"/><rect x="119" y="331" width="50" height="4" fill="#17676b"/>
    <text x="62" y="395" font-family="Arial,sans-serif" font-size="20" fill="#62635e">Meetings, training and everyday routines.</text>
    <rect x="632" y="80" width="330" height="340" rx="24" fill="#061a1e"/><text x="669" y="135" font-family="Arial,sans-serif" font-size="17" fill="#64c9c4">ONE SHARED FINISH</text>
    <text x="669" y="196" font-family="Georgia,serif" font-size="29" fill="#f5f2e9">Welcome</text>
    <text x="666" y="296" font-family="Arial,sans-serif" font-size="80" fill="#f5f2e9">5:00</text>${cells}
    <text x="669" y="400" font-family="Arial,sans-serif" font-size="17" fill="#a8c2c1">Then five equal voices.</text>
  </svg>`;
  await fs.writeFile(path.join(dest, 'feature-graphic.svg'), svg);
  await sharp(Buffer.from(svg)).png().toFile(path.join(dest, 'feature-graphic.png'));
  console.log('Created Play icon 512×512 and feature graphic 1024×500.');
}
main().catch(e => { console.error(e); process.exit(1); });
