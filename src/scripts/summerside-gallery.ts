/** Inline galleries load a large photo only when its preview is selected. */
export function initStoryGalleries(root:HTMLElement) {
 root.querySelectorAll<HTMLElement>('[data-gallery]').forEach(gallery=>{
  const image=gallery.querySelector<HTMLImageElement>('[data-gallery-image]')!;
  const picture=gallery.querySelector<HTMLPictureElement>('[data-gallery-picture]')!;
  const strip=gallery.querySelector<HTMLElement>('[data-gallery-thumbnails]')!;
  const thumbs=[...strip.querySelectorAll<HTMLButtonElement>('[data-gallery-thumb]')];
  const previous=gallery.querySelector<HTMLButtonElement>('[data-gallery-previous]')!;
  const next=gallery.querySelector<HTMLButtonElement>('[data-gallery-next]')!;
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
   previous.disabled=index===0;next.disabled=index===thumbs.length-1;
   gallery.querySelector('[data-gallery-counter]')!.textContent=`${index+1} / ${thumbs.length}`;
   if(focus)selected.focus({preventScroll:true});
   const bounds=selected.getBoundingClientRect(),viewport=strip.getBoundingClientRect();
   if(bounds.left<viewport.left)strip.scrollLeft-=viewport.left-bounds.left;
   else if(bounds.right>viewport.right)strip.scrollLeft+=bounds.right-viewport.right;
  };
  thumbs.forEach((thumb,i)=>{
   thumb.addEventListener('click',()=>select(i));
   thumb.addEventListener('keydown',event=>{
    const target=event.key==='ArrowRight'?i+1:event.key==='ArrowLeft'?i-1:event.key==='Home'?0:event.key==='End'?thumbs.length-1:null;
    if(target!==null){event.preventDefault();select(target,true);}
   });
  });
  previous.addEventListener('click',()=>select(index-1));
  next.addEventListener('click',()=>select(index+1));
  image.addEventListener('error',()=>{image.hidden=true;error.hidden=false;});
  image.addEventListener('load',()=>{image.hidden=false;error.hidden=true;});
  if(image.complete&&image.naturalWidth===0&&image.currentSrc){image.hidden=true;error.hidden=false;}
  strip.hidden=false;
  gallery.querySelector<HTMLElement>('[data-gallery-controls]')!.hidden=false;
 });
}
