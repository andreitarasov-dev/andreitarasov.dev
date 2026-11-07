// Offline, reproducible inventory of the pinned source snapshots.
import { readFile, writeFile } from 'node:fs/promises';
const dir = new URL('../src/content/summerside/', import.meta.url);
const source = await readFile(new URL('source/index.ru.txt', dir), 'utf8');
const photos = JSON.parse(await readFile(new URL('source/photo_sizes.json', dir), 'utf8'));
const cities = [...source.matchAll(/id: '([^']+)'[\s\S]*?this\.elementVisible\(e, ([\d.]+), (\d)\)[\s\S]*?<div(?: id=["']([^"']+)["'])?>\s*<h3[^>]*>([^<]+)<\/h3>/g)]
  .map((m) => ({photoId:m[1], progress:Number(m[2])/100, stage:Number(m[3]), sectionId:m[4] || 'canal', originalTitle:m[5]}));
if(cities.length !== 14 || photos.length !== 195) throw new Error('Unexpected source shape: review before importing');
await writeFile(new URL('inventory.json', dir), JSON.stringify({sourceCommit:'99ad53bd96944388f1ff4e0e9c7b72e8985eccb4',photoIds:photos.map(p=>p.id),cities,sections:['intro','why','get',...cities.map(c=>c.sectionId),'end'],inlinePhotoIds:['intro','packed-bicycles','verenti','kona']},null,2)+'\n');
console.log(`Inventoried ${photos.length} photographs and ${cities.length} cities.`);
