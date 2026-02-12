const cheerio = require('cheerio');

(async () => {
  const u = new URL('https://en.wikipedia.org/w/api.php');
  u.searchParams.set('action','parse');
  u.searchParams.set('page','Super_Bowl_Most_Valuable_Player');
  u.searchParams.set('prop','text');
  u.searchParams.set('section','1');
  u.searchParams.set('format','json');
  u.searchParams.set('formatversion','2');
  const html = (await (await fetch(u)).json()).parse.text;
  const $ = cheerio.load(html);

  const candidates = $('table.wikitable').toArray().map(el=>{
    const t = $(el).text().replace(/\s+/g,' ').trim();
    const ok = t.includes('Year') && t.includes('Super Bowl') && t.includes('Winner') && t.includes('Team') && t.includes('Position') && t.includes('College');
    return {el, ok, rows: $(el).find('tr').length};
  }).filter(c=>c.ok).sort((a,b)=>b.rows-a.rows);

  const table = $(candidates[0].el);

  const rows = table.find('tr').toArray();
  const hits = rows.filter(r => $(r).text().includes('XII'));
  console.log('rows containing XII:', hits.length);
  hits.slice(0,6).forEach((r,idx)=>{
    const cells = $(r).find('th,td').toArray().map(el=>({tag:el.tagName, text:$(el).text().replace(/\s+/g,' ').trim()}));
    console.log('---', idx);
    console.log(cells);
  });
})();
