import type { ProgressAnchor } from './types';
export function resolveProgress(anchors:ProgressAnchor[],readingY:number) {
  if(!anchors.length) return {stage:1 as const,progress:0,sectionId:''};
  let index=0;
  while(index<anchors.length-1 && anchors[index+1].top<=readingY) index++;
  const a=anchors[index],b=anchors[index+1];
  let progress=a.progress;
  if(b && b.stage===a.stage && b.top>a.top){
    const t=Math.max(0,Math.min(1,(readingY-a.top)/(b.top-a.top)));
    progress=a.progress+(b.progress-a.progress)*t;
  }
  return {stage:a.stage,progress:Math.max(0,Math.min(1,progress)),sectionId:a.sectionId};
}
