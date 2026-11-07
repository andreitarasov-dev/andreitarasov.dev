import {resolveProgress} from '../lib/summerside/progress';
import type {ProgressAnchor,StageId} from '../lib/summerside/types';
export function initStoryRoute(root:HTMLElement):()=>void {
 const route=root.querySelector<HTMLElement>('[data-story-route]');
 if(!route) return ()=>{};
 const sections=[...root.querySelectorAll<HTMLElement>('[data-story-section]')];
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0;
 const update=()=>{
  frame=0;
  const anchors:ProgressAnchor[]=sections.map(s=>({stage:Number(s.dataset.anchorStage) as StageId,sectionId:s.id,top:s.getBoundingClientRect().top+scrollY,progress:Number(s.dataset.anchorProgress)}));
  const readingLine=Math.max(innerHeight*.35,route.getBoundingClientRect().top<100&&innerWidth<=700?route.getBoundingClientRect().bottom+16:0);
  const state=resolveProgress(anchors,scrollY+readingLine);
  route.dataset.currentStage=String(state.stage);route.dataset.progress=String(state.progress);
  route.querySelector<HTMLElement>('[data-route-label]')!.textContent=sections.find(s=>s.id===state.sectionId)?.dataset.anchorLabel||'Kaliningrad';
  route.querySelector<HTMLElement>('[data-route-percent]')!.textContent=motion.matches?'':`${Math.round(state.progress*100)}%`;
  route.querySelectorAll<HTMLElement>('[data-stage]').forEach(stage=>{
    stage.hidden=Number(stage.dataset.stage)!==state.stage;
    stage.querySelectorAll<SVGPathElement>('[data-route-path]').forEach(path=>{
    path.style.strokeDasharray='1';path.style.strokeDashoffset=String(motion.matches?0:1-state.progress);
    const marker=path.parentElement!.querySelector<SVGCircleElement>('[data-route-marker]')!;
    marker.style.display=motion.matches?'none':'';
    if(!stage.hidden&&!motion.matches){const point=path.getPointAtLength(path.getTotalLength()*state.progress);marker.setAttribute('cx',String(point.x));marker.setAttribute('cy',String(point.y));}
    });
  });
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 const observer=new ResizeObserver(schedule);observer.observe(root);
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);addEventListener('pageshow',schedule);motion.addEventListener('change',schedule);root.addEventListener('load',schedule,true);
 document.fonts.ready.then(schedule);schedule();
 return ()=>{cancelAnimationFrame(frame);observer.disconnect();removeEventListener('scroll',schedule);removeEventListener('resize',schedule);removeEventListener('pageshow',schedule);motion.removeEventListener('change',schedule);root.removeEventListener('load',schedule,true);};
}
