import fs from 'node:fs';
import path from 'node:path';

const MAP_FILE = path.resolve('src/data/stadium-backgrounds.json');
const OUT_DIR = path.resolve('public/stadiums');
const API='https://en.wikipedia.org/w/api.php';

const targets = {
  'U.S. Bank Stadium': 'U.S. Bank Stadium',
  'Sun Devil Stadium': 'Sun Devil Stadium',
  'Tulane Stadium': 'Tulane Stadium',
};

const aliases = {
  'University of Phoenix Stadium': 'State Farm Stadium',
};

const map = JSON.parse(fs.readFileSync(MAP_FILE,'utf8'));
for (const [k,v] of Object.entries(aliases)) {
  if (!map[k] && map[v]) map[k]=map[v];
}

const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

async function q(params){
 const u=new URL(API); for (const [k,v] of Object.entries(params)) u.searchParams.set(k,String(v));
 const r=await fetch(u,{headers:{'user-agent':'superbowl-stadium-bg-fetcher/0.1','accept':'application/json'}});
 if(!r.ok) throw new Error('HTTP '+r.status);
 return r.json();
}

function slugify(s){return s.normalize('NFKD').replace(/[^\w\s-]/g,'').trim().toLowerCase().replace(/\s+/g,'-');}

async function getImg(title){
 const d=await q({action:'query',format:'json',formatversion:'2',prop:'pageimages',piprop:'thumbnail',pithumbsize:'1920',titles:title});
 return d?.query?.pages?.[0]?.thumbnail?.source ?? null;
}

async function dl(url,base){
 const r=await fetch(url,{headers:{'user-agent':'superbowl-stadium-bg-fetcher/0.1'}});
 if(!r.ok) throw new Error('img '+r.status);
 const ct=r.headers.get('content-type')||'image/jpeg';
 const ext=ct.includes('png')?'.png':'.jpg';
 const p=base+ext; fs.writeFileSync(p,Buffer.from(await r.arrayBuffer())); return p;
}

for (const [venue,title] of Object.entries(targets)){
 if(map[venue]) continue;
 let ok=false;
 for (let i=0;i<6 && !ok;i++){
   try{
    const img=await getImg(title); if(!img) throw new Error('no thumb');
    const p=await dl(img,path.join(OUT_DIR,slugify(venue))); map[venue]='/stadiums/'+path.basename(p); ok=true; console.log('ok',venue,map[venue]);
   }catch(e){console.log('fail',venue,e.message); await sleep(2000*(i+1));}
 }
}

fs.writeFileSync(MAP_FILE,JSON.stringify(map,null,2)+'\n');
console.log('done');
