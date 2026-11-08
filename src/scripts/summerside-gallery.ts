/** Inline galleries load a large photo only when its preview is selected. */
export function initStoryGalleries(root:HTMLElement) {
 root.querySelectorAll<HTMLElement>('[data-gallery]').forEach(gallery=>{
  const image=gallery.querySelector<HTMLImageElement>('[data-gallery-image]')!;
  const picture=gallery.querySelector<HTMLPictureElement>('[data-gallery-picture]')!;
  const strip=gallery.querySelector<HTMLElement>('[data-gallery-thumbnails]')!;
  const thumbs=[...strip.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]')];
  const error=gallery.querySelector<HTMLElement>('[data-gallery-error]')!;
  let index=0;
  const select=(value:number,focus=false)=>{
   index=Math.max(0,Math.min(thumbs.length-1,value));
   const selected=thumbs[index];
   thumbs.forEach((thumb,i)=>thumb.setAttribute('aria-pressed',String(i===index)));
   picture.querySelectorAll('source').forEach(source=>source.remove());
   const sources=JSON.parse(selected.dataset.sources||'[]') as Array<{type:string;srcset:string}>;
   sources.forEach(source=>{
    const element=document.createElement('source');
    element.type=source.type;element.srcset=source.srcset;element.sizes='(max-width: 893px) 100vw, 840px';
    picture.insertBefore(element,image);
   });
   image.hidden=false;error.hidden=true;
   image.alt=selected.dataset.alt!;image.src=selected.dataset.fullUrl!;
   if(focus)selected.focus({preventScroll:true});
   const bounds=selected.getBoundingClientRect(),viewport=strip.getBoundingClientRect();
   // Keep roughly two or three upcoming previews in reach on either side.
   const edge=Math.min((bounds.width+8)*3,viewport.width*.4);
   const nearLeft=bounds.left<viewport.left+edge&&strip.scrollLeft>0;
   const nearRight=bounds.right>viewport.right-edge&&strip.scrollLeft<strip.scrollWidth-strip.clientWidth-1;
   if(nearLeft||nearRight){
    strip.scrollTo({left:strip.scrollLeft+bounds.left-viewport.left+bounds.width/2-viewport.width/2,
     behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
   }
  };
  thumbs.forEach((thumb,i)=>{
   thumb.addEventListener('click',()=>select(i));
   thumb.addEventListener('keydown',event=>{
    const target=event.key==='ArrowRight'?i+1:event.key==='ArrowLeft'?i-1:event.key==='Home'?0:event.key==='End'?thumbs.length-1:null;
    if(target!==null){event.preventDefault();select(target,true);}
   });
  });
  image.addEventListener('error',()=>{image.hidden=true;error.hidden=false;});
  image.addEventListener('load',()=>{image.hidden=false;error.hidden=true;});
  if(image.complete&&image.naturalWidth===0&&image.currentSrc){image.hidden=true;error.hidden=false;}
  strip.hidden=false;
 });
}
