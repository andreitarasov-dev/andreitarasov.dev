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
