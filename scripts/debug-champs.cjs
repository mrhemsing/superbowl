const cheerio = require('cheerio');

(async () => {
  const u = new URL('https://en.wikipedia.org/w/api.php');
  u.searchParams.set('action','parse');
  u.searchParams.set('page','List_of_Super_Bowl_champions');
  u.searchParams.set('prop','text');
  u.searchParams.set('section','1');
  u.searchParams.set('format','json');
  u.searchParams.set('formatversion','2');
  const html = (await (await fetch(u)).json()).parse.text;
  const $ = cheerio.load(html);
  const table = $('table.wikitable').filter((i, el) => {
    const t = $(el).text();
    return t.includes('Winning team') && t.includes('Losing team') && t.includes('Score');
  }).first();

  const row = table.find('tr').toArray().find(r => $(r).find('th,td').first().text().includes('I'));
  const first = $(row).find('th,td').first().text().replace(/\s+/g,' ').trim();
  console.log('first cell raw:', first);

  const tds = $(row).find('td').toArray();
  console.log('td count', tds.length);
  tds.forEach((td, idx) => {
    const raw = $(td).text().replace(/\s+/g,' ').trim();
    const links = $(td).find('a').toArray().map(a=>$(a).text().replace(/\s+/g,' ').trim()).slice(0,5);
    console.log(idx, raw.slice(0,120));
    console.log('  links:', links);
  });
})();
