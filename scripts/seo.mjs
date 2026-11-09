// Shared by the static generator and scoped updates of an existing hosted release.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const ORIGIN = 'https://corptimer.com';
const escape = text => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const decode = text => text.replace(/&(amp|lt|gt|quot|#39);/g, (_, code) => ({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"}[code]));

export function publicPages(root) {
  return [...fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].filter(([,url])=>!/^\/(es|fr|de|pt)\//.test(new URL(url).pathname)).map(([, url]) => {
    const slug = new URL(url).pathname.replace(/^\/|\/$/g, '');
    const file = path.join(root, slug, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    const title = decode(html.match(/<h1\b[^>]*>(.*?)<\/h1>/s)[1].replace(/<[^>]+>/g, ''));
    const description = decode(html.match(/<meta name="description" content="([^"]*)"/)[1]);
    // Existing specialty diagrams are actual, page-specific 1200 x 630 assets.
    const diagram = slug && (fs.existsSync(path.join(root, 'assets', slug + '.svg')) || html.includes(`${ORIGIN}/assets/${slug}.png`));
    return {url, slug, file, html, title, description,
      image: `${ORIGIN}/assets/${diagram ? slug + '.png' : 'social/' + (slug || 'meeting-timer') + '.png'}`,
      imageAlt: diagram ? `${title}: example timing setup` : `${title} on CorpTimer`};
  });
}

export function applySeo(root = 'docs') {
  let count = 0;
  for (const page of publicPages(root)) {
    let {html, title, description, url, slug, image, imageAlt} = page;
    const relative = slug ? '../' : './';
    let searchTitle = decode(html.match(/<title>(.*?)<\/title>/s)[1]);
    if (!slug) searchTitle = 'Online Meeting Timer with Agenda & Live Sharing | CorpTimer';
    else if (slug === 'timers') {
      searchTitle = 'Free Online Timers & Stopwatches | CorpTimer';
      description = 'Find free online timers for meetings, cooking, meditation, study and workouts. Use a countdown, Pomodoro, chess clock or stopwatch, or build your own timer.';
    } else if (slug === 'stopwatch') searchTitle = 'Online Stopwatch with Laps & Splits | CorpTimer';
    else if (searchTitle.length > 65) searchTitle = `${title} | CorpTimer`;
    description = description.replace(/ Customize your setup, use fullscreen and save it locally\. No sign-in needed\.$/, '');
    if (description.length < 90) description += ' Customize your setup, use fullscreen and save locally.';

    let head = html.slice(0, html.indexOf('</head>'));
    // Replace the complete owned metadata set, so rebuilding never duplicates tags.
    head = head.replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->\s*/g, '')
      .replace(/<meta\b[^>]*(?:property="og:[^"]+"|name="twitter:[^"]+")[^>]*>\s*/g, '')
      .replace(/<link\b[^>]*rel="(?:icon|shortcut icon|apple-touch-icon|manifest)"[^>]*>\s*/g, '')
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(searchTitle)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escape(description)}$2`);
    // Keep the existing honest application metadata, and give it its share image.
    head = head.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g, (tag, raw) => {
      const data = JSON.parse(raw);
      if (data['@type'] === 'WebApplication' || data['@type'] === 'CollectionPage') {
        data.image = image;
        if (data['@type'] === 'CollectionPage') data.isPartOf = {'@id': `${ORIGIN}/#website`};
        return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
      }
      return tag;
    });
    const site = !slug ? `<script type="application/ld+json">${JSON.stringify({
      '@context':'https://schema.org', '@graph':[
        {'@type':'WebSite','@id':`${ORIGIN}/#website`,url:`${ORIGIN}/`,name:'CorpTimer',inLanguage:'en'},
        {'@type':'WebApplication','@id':`${ORIGIN}/#meeting-timer`,name:'CorpTimer Meeting Timer',url,
          description,applicationCategory:'UtilitiesApplication',operatingSystem:'Any',
          isAccessibleForFree:true,image,browserRequirements:'JavaScript enabled. Keep the browser tab open for live alerts.'}
      ]})}</script>\n` : '';
    const metadata = `\n<!-- seo:start -->
<link rel="icon" href="${relative}favicon.ico" sizes="16x16 32x32 48x48" type="image/x-icon">
<link rel="icon" href="${relative}favicon-96x96.png" sizes="96x96" type="image/png">
<link rel="icon" href="${relative}icon.svg" sizes="any" type="image/svg+xml">
<link rel="apple-touch-icon" href="${relative}apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="${relative}manifest.webmanifest">
<meta property="og:site_name" content="CorpTimer">
<meta property="og:locale" content="en_US">
<meta property="og:type" content="website">
<meta property="og:title" content="${escape(searchTitle)}">
<meta property="og:description" content="${escape(description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${escape(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escape(searchTitle)}">
<meta name="twitter:description" content="${escape(description)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="${escape(imageAlt)}">
${site}<!-- seo:end -->\n`;
    fs.writeFileSync(page.file, head.trimEnd() + metadata + html.slice(html.indexOf('</head>')));
    count++;
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.webmanifest'), 'utf8'));
  manifest.id = './';
  manifest.description = 'Timers for meetings, focus, workouts and everyday routines.';
  manifest.lang = 'en';
  manifest.icons = [
    {src:'./icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any'},
    {src:'./icon-192.png',sizes:'192x192',type:'image/png',purpose:'any'},
    {src:'./icon-512.png',sizes:'512x512',type:'image/png',purpose:'any'},
    {src:'./icon-maskable-512.png',sizes:'512x512',type:'image/png',purpose:'maskable'}
  ];
  fs.writeFileSync(path.join(root, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(`SEO metadata updated for ${count} public pages.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
 const root=process.argv[2]||'docs';applySeo(root);
 if(fs.existsSync(path.join(root,'locales/es.json')))execFileSync('python',['-X','utf8','scripts/build-locales.py','--root',root],{stdio:'inherit'});
}
