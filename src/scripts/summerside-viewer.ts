export function initPhotoViewer(root:HTMLElement):()=>void {
 const dialog=root.querySelector<HTMLDialogElement>('[data-photo-viewer]');
 if(!dialog || !('showModal' in dialog))return ()=>{};
 const links=[...root.querySelectorAll<HTMLAnchorElement>('[data-photo-open]')];
 const image=dialog.querySelector<HTMLImageElement>('[data-viewer-image]')!;
 const error=dialog.querySelector<HTMLElement>('[data-viewer-error]')!;
 const previous=dialog.querySelector<HTMLButtonElement>('[data-viewer-previous]')!;
 const next=dialog.querySelector<HTMLButtonElement>('[data-viewer-next]')!;
 const close=dialog.querySelector<HTMLButtonElement>('[data-viewer-close]')!;
 let index=0,opener:HTMLAnchorElement|null=null;
 const show=(n:number)=>{
   index=Math.max(0,Math.min(links.length-1,n));
   const link=links[index],alt=link.querySelector('img')!.alt;
   image.hidden=false;error.hidden=true;image.alt=alt;image.src=link.href;
   dialog.querySelector<HTMLElement>('[data-viewer-counter]')!.textContent=`${index+1} / ${links.length}`;
   dialog.querySelector<HTMLElement>('[data-viewer-caption]')!.textContent=alt;
   previous.disabled=index===0;next.disabled=index===links.length-1;
 };
 const open=(event:MouseEvent)=>{
   const target=(event.target as Element).closest<HTMLAnchorElement>('[data-photo-open]');
   if(!target || event.button!==0 || event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
   event.preventDefault();opener=target;show(links.indexOf(target));dialog.showModal();document.body.classList.add('photo-viewer-open');
 };
 const shut=()=>dialog.close();
 const closed=()=>{image.removeAttribute('src');document.body.classList.remove('photo-viewer-open');opener?.focus({preventScroll:true});};
 const back=()=>show(index-1),forward=()=>show(index+1);
 const failed=()=>{image.hidden=true;error.hidden=false;};
 const keys=(event:KeyboardEvent)=>{
   if(event.key==='ArrowLeft'){event.preventDefault();back();}
   if(event.key==='ArrowRight'){event.preventDefault();forward();}
 };
 root.addEventListener('click',open);close.addEventListener('click',shut);previous.addEventListener('click',back);next.addEventListener('click',forward);dialog.addEventListener('close',closed);dialog.addEventListener('keydown',keys);image.addEventListener('error',failed);
 return ()=>{if(dialog.open)dialog.close();root.removeEventListener('click',open);close.removeEventListener('click',shut);previous.removeEventListener('click',back);next.removeEventListener('click',forward);dialog.removeEventListener('close',closed);dialog.removeEventListener('keydown',keys);image.removeEventListener('error',failed);};
}
