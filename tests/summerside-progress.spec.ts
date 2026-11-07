import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
const anchors = [
  {stage:1 as const,sectionId:'start',top:100,progress:0},
  {stage:1 as const,sectionId:'amsterdam',top:500,progress:1},
  {stage:2 as const,sectionId:'copenhagen',top:700,progress:0},
  {stage:2 as const,sectionId:'stockholm',top:1100,progress:1},
];
test('interpolates within stages, holds transfer, and reverses across its boundary', async () => {
  expect(existsSync('src/lib/summerside/progress.ts')).toBe(true);
  const {resolveProgress}=await import('../src/lib/summerside/progress');
  expect(resolveProgress(anchors,300)).toEqual({stage:1,progress:.5,sectionId:'start'});
  expect(resolveProgress(anchors,699)).toEqual({stage:1,progress:1,sectionId:'amsterdam'});
  expect(resolveProgress(anchors,700)).toEqual({stage:2,progress:0,sectionId:'copenhagen'});
  expect(resolveProgress(anchors,900).progress).toBe(.5);
  expect(resolveProgress(anchors,699).stage).toBe(1);
  expect(resolveProgress(anchors,-100).progress).toBe(0);
  expect(resolveProgress(anchors,1200).progress).toBe(1);
});
test('equal-position anchors and an empty story never produce NaN', async () => {
  expect(existsSync('src/lib/summerside/progress.ts')).toBe(true);
  const {resolveProgress}=await import('../src/lib/summerside/progress');
  expect(resolveProgress([],0)).toEqual({stage:1,progress:0,sectionId:''});
  expect(resolveProgress(anchors.map(a=>({...a,top:100})),100)).toEqual({stage:2,progress:1,sectionId:'stockholm'});
});
