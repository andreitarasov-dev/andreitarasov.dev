import { readFile,writeFile } from 'node:fs/promises';
import { feature } from 'topojson-client';
const dir=new URL('../src/content/summerside/',import.meta.url);
const inventory=JSON.parse(await readFile(new URL('inventory.json',dir),'utf8'));
const labels=['Kaliningrad','Frombork','Malbork','Wałcz','Germany','Berlin','Magdeburg, Hanover','The Netherlands','Amsterdam','Copenhagen','Sweden','Jönköping','Norrköping','Stockholm'];
const routes=[];
for(const id of [1,2]){
 const topo=JSON.parse(await readFile(new URL(`source/track${id}.json`,dir),'utf8'));
 const collection=feature(topo,Object.values(topo.objects)[0]);
 const coordinates=collection.features.flatMap(f=>f.geometry.coordinates);
 routes.push({id,coordinates,anchors:inventory.cities.map((c,i)=>({...c,label:labels[i]})).filter(c=>c.stage===id).map(({sectionId,progress,label})=>({sectionId,progress,label}))});
}
await writeFile(new URL('routes.json',dir),JSON.stringify(routes)+'\n');
