import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const folder = join(process.cwd(), 'src/content/summerside');
test('migration preserves all 195 photo IDs and both complete cycling stages', async () => {
  expect(existsSync(join(folder, 'inventory.json')), 'source inventory exists').toBe(true);
  const inventory = JSON.parse(readFileSync(join(folder, 'inventory.json'), 'utf8'));
  const source = JSON.parse(readFileSync(join(folder, 'source/photo_sizes.json'), 'utf8'));
  expect(inventory.photoIds).toEqual(source.map((p: {id:string}) => p.id));
  expect(inventory.photoIds).toHaveLength(195);
  expect(inventory.cities).toHaveLength(14);
  const { decodeRoute } = await import('../src/lib/summerside/geometry');
  const track = JSON.parse(readFileSync(join(folder, 'source/track2.json'), 'utf8'));
  const coords = decodeRoute(track);
  expect(coords[0][0]).toBeCloseTo(12.57, 0);
  expect(coords.at(-1)![0]).toBeCloseTo(18.0, 0);
  expect(coords.at(-1)![1]).toBeCloseTo(59.3, 0);
});

test('route conversion preserves multiple and reversed topology arcs', async () => {
  expect(existsSync(join(folder, 'inventory.json'))).toBe(true);
  const { decodeRoute } = await import('../src/lib/summerside/geometry');
  expect(decodeRoute({type:'Topology',objects:{route:{type:'LineString',arcs:[0,-2]}},arcs:[[[0,0],[1,1]],[[2,2],[1,1]]]} as any))
    .toEqual([[0,0],[1,1],[2,2]]);
});

test('English draft preserves section associations and original prose links', () => {
  const inventory = JSON.parse(readFileSync(join(folder, 'inventory.json'), 'utf8'));
  const article = JSON.parse(readFileSync(join(folder, 'article.en.json'), 'utf8'));
  const source = readFileSync(join(folder, 'source/index.ru.txt'), 'utf8');
  expect(article.map((s: {id:string}) => s.id)).toEqual(inventory.sections);
  for (const city of inventory.cities) {
    expect(article.find((s: {id:string}) => s.id === city.sectionId)).toMatchObject({photoId:city.photoId,stage:city.stage});
  }
  const links = (html:string) => [...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;', '&')).sort();
  // Preserve the source links except for explicitly requested URL updates.
  const updatedSource = source
    .replace('https://journal.tinkoff.ru/work_exchange/', 'https://t-j.ru/work_exchange/')
    .replace('https://medium.com/@IngMaeSing', 'https://sikorsky.design/')
    .replace('https://www.facebook.com/salad.nights', 'mailto:tarasov.a.dev@gmail.com');
  expect(links(article.map((s: {html:string}) => s.html).join(''))).toEqual(links(updatedSource));
});

test('overview omits invisible world geometry while retaining the full cycling routes', async () => {
  const {buildOverviewGeometry}=await import('../src/lib/summerside/geometry');
  const stages=JSON.parse(readFileSync(join(folder,'routes.json'),'utf8'));
  const overview=buildOverviewGeometry(stages);
  expect(overview.paths).toHaveLength(2);
  expect(overview.cities).toHaveLength(10);
  // A regression to unclipped geography adds more than a megabyte to the HTML.
  expect(overview.land.join('').length).toBeLessThan(200_000);
  for(const path of overview.land){
    const numbers=path!.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
    expect(numbers.every((value,index)=>value>=-.01 && value<=(index%2===0?710.01:460.01))).toBe(true);
  }
});

test('every published photo and responsive variant is included in the static deployment', () => {
  const photos=JSON.parse(readFileSync(join(folder,'media.json'),'utf8'));
  expect(photos).toHaveLength(199);
  const urls=new Set<string>();
  for(const photo of photos){
    expect(photo.delivery).toBe('published');
    expect(photo.sources.map((s:{type:string})=>s.type)).toEqual(['image/avif','image/webp','image/jpeg']);
    urls.add(photo.fullUrl);urls.add(photo.fallbackUrl);
    for(const source of photo.sources){
      for(const entry of source.srcset.split(', '))urls.add(entry.split(' ')[0]);
    }
  }
  expect(urls.size).toBe(1782);
  expect([...urls].every(url=>/^\/media\/summerside\/[a-z0-9-]+\.(avif|webp|jpg)$/.test(url)&&existsSync(join(process.cwd(),'public',url)))).toBe(true);
});
