// Raster exports of our existing vector logo; no generated artwork or external fonts.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {publicPages} from './seo.mjs';
const require = createRequire(new URL('../mobile/package.json', import.meta.url));
const sharp = require('sharp');
const root = process.argv[2] || 'docs';
const icon = fs.readFileSync(path.join(root, 'icon.svg'));
const provenance = {Copyright:'CorpTimer',ImageDescription:'Vector export of the existing CorpTimer glasses identity. Source: docs/icon.svg; scripts/build-seo-assets.mjs.'};
for (const [file, size] of [['favicon-96x96.png',96],['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]) {
  await sharp(icon).resize(size,size).withExif({IFD0:provenance}).png().toFile(path.join(root,file));
}
// Keep the whole mark inside the maskable icon's central safe zone.
await sharp({create:{width:512,height:512,channels:4,background:'#eeece5'}})
  .composite([{input:await sharp(icon).resize(320,320).png().toBuffer(),left:96,top:96}])
  .withExif({IFD0:provenance}).png().toFile(path.join(root,'icon-maskable-512.png'));
// An ICO directory can contain PNG payloads (Windows Vista and later).
const sizes = [16,32,48];
const buffers = await Promise.all(sizes.map(size => sharp(icon).resize(size,size).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * sizes.length); header.writeUInt16LE(1,2); header.writeUInt16LE(sizes.length,4);
let offset = header.length;
buffers.forEach((buffer,i) => {const p=6+i*16;header[p]=sizes[i];header[p+1]=sizes[i];header.writeUInt16LE(1,p+4);header.writeUInt16LE(32,p+6);header.writeUInt32LE(buffer.length,p+8);header.writeUInt32LE(offset,p+12);offset+=buffer.length;});
fs.writeFileSync(path.join(root,'favicon.ico'),Buffer.concat([header,...buffers]));

const xml = s => s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const fontfile = path.resolve('docs/fonts/Manrope.ttf');
async function textLayer(text, size, width, color, weight='normal') {
  return sharp({text:{text:`<span foreground="${color}" weight="${weight}">${xml(text)}</span>`,font:`Manrope ${size}`,fontfile,width,rgba:true,wrap:'word'}}).png().toBuffer();
}
const mark = await sharp(path.join(root,'assets/corptimer-mark.svg')).resize(292).png().toBuffer();
let cards = 0;
for (const page of publicPages(root).filter(p=>p.image.includes('/social/'))) {
  const title = page.slug==='timers' ? 'A timer for your day.' : page.title;
  const background = Buffer.from('<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#eeece5"/><path d="M64 150H1136M64 530H1136" stroke="#bbbcb4"/><path d="M64 150H200" stroke="#c62d35" stroke-width="5"/><path d="M204 150H276" stroke="#299093" stroke-width="5"/></svg>');
  const dest = path.join(root, 'assets/social', (page.slug || 'meeting-timer') + '.png');
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  const layers = [
    {input:await textLayer('CorpTimer',40,600,'#20211e','bold'),left:64,top:62},
    {input:await textLayer('corptimer.com',22,260,'#62635e'),left:926,top:84},
    {input:await textLayer(title,64,720,'#20211e','bold'),left:64,top:220},
    {input:mark,left:850,top:253},
    {input:await textLayer('Timers for meetings, focus & everyday routines.',25,1050,'#62635e'),left:64,top:559}
  ];
  await sharp(background).composite(layers).withExif({IFD0:{Copyright:'CorpTimer',ImageDescription:`${page.title} social preview. Authored in scripts/build-seo-assets.mjs using the existing logo, Manrope font and brand palette.`}}).png().toFile(dest);
  cards++;
}
console.log(`Exported 6 icon files and ${cards} social cards.`);
