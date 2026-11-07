import { test, expect } from '@playwright/test';
import {mockImages} from './mockImages';

test.beforeEach(async({page})=>{await mockImages(page);});
test('homepage project opens the complete article and city navigation',async({page})=>{
  await page.goto('/');
  await page.getByRole('link',{name:'Across Europe by bicycle',exact:true}).click();
  await expect(page).toHaveURL(/\/summerside\/$/);
  await expect(page.locator('h1')).toHaveText('Across Europe by bicycle');
  await expect(page.locator('[data-story-section]')).toHaveCount(14);
  await expect(page.locator('[data-photo-id]')).toHaveCount(199);
  await page.locator('#overview').getByRole('link',{name:'Stockholm',exact:true}).click();
  await expect(page).toHaveURL(/#stockholm$/);
  const breadcrumb=page.getByRole('navigation',{name:'Breadcrumb'}).getByRole('link',{name:'Across Europe by bicycle',exact:true});
  await expect(breadcrumb).toBeVisible();
  await breadcrumb.click();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
  await expect(page.getByRole('heading',{name:'Full packing list',exact:true})).toBeVisible();
  await expect(page.locator('#get li').filter({hasText:'Electronics.'})).toBeVisible();
  await expect(page.locator('#get details')).toHaveCount(0);
});
test('photo viewer opens only on request, supports navigation and restores focus',async({page})=>{
 const fullRequests:string[]=[];
 page.on('request',r=>{if(r.url().includes('_h.jpg'))fullRequests.push(r.url());});
 await page.goto('/summerside/');
 // Inline equipment sources already use _h URLs; gallery originals must not preload.
 expect(fullRequests.some(url=>url.includes('42823041980_a87742bb41'))).toBe(false);
 const photo=page.locator('[data-photo-id="42823041980"] a');
 await photo.click();
 const viewer=page.getByRole('dialog',{name:'Journey photographs'});
 await expect(viewer).toBeVisible();
 await expect(viewer.locator('img')).toHaveAttribute('src',/42823041980_a87742bb41/);
 await page.getByRole('button',{name:'Next photograph'}).click();
 await expect(viewer.locator('img')).toHaveAttribute('src',/43723828875_355d1d63b0/);
 await page.keyboard.press('Escape');await expect(viewer).not.toBeVisible();await expect(photo).toBeFocused();
});
test('scroll interpolates both ways, updates deep links, and keeps stages separate',async({page})=>{
 await page.goto('/summerside/#berlin');
 const route=page.locator('[data-story-route]');
 await expect(route).toHaveAttribute('data-current-stage','1');
 await page.evaluate(()=>{const a=document.getElementById('berlin')!,b=document.getElementById('canal')!;scrollTo(0,(a.getBoundingClientRect().top+b.getBoundingClientRect().top)/2+scrollY-innerHeight*.35);});
 await expect.poll(async()=>Number(await route.getAttribute('data-progress'))).toBeGreaterThan(.5055);
 expect(Number(await route.getAttribute('data-progress'))).toBeLessThan(.7353);
 await page.evaluate(()=>document.getElementById('copenhagen')!.scrollIntoView());
 await expect(route).toHaveAttribute('data-current-stage','2');
 await page.evaluate(()=>document.getElementById('amsterdam')!.scrollIntoView());
 await expect(route).toHaveAttribute('data-current-stage','1');
 await expect.poll(async()=>Number(await route.getAttribute('data-progress'))).toBe(1);
});
test('reduced motion shows complete route and missing image leaves viewer controls usable',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/summerside/#berlin');
 await expect(page.locator('[data-stage="1"] [data-route-path]:visible')).toHaveCSS('stroke-dashoffset','0px');
 await page.route('**/*_h.jpg',r=>r.abort());
 await page.locator('[data-photo-id="42823041980"] a').click();
 await expect(page.getByText('This photograph could not be loaded.')).toBeVisible();
 await page.getByRole('button',{name:'Close photographs'}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
});
for(const size of [{width:320,height:700},{width:390,height:844},{width:1280,height:900},{width:844,height:390}]){
 test(`article fits ${size.width}×${size.height}`,async({page})=>{
   await page.setViewportSize(size);await page.goto('/summerside/');
   await expect(page.locator('h1')).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 });
}
test('article and overview remain useful without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();await mockImages(page);
 await page.goto('/summerside/');await expect(page.locator('h1')).toBeVisible();
 await expect(page.getByRole('img',{name:'Two cycling stages across Europe'})).toBeVisible();
 await expect(page.locator('#end')).toContainText('44 days');await context.close();
});

test('desktop route is centered, ordered top to bottom, and shows original cities',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto('/summerside/#berlin');
 const route=page.locator('[data-story-route]');
 await expect(route).toHaveAttribute('data-current-stage','1');
 const svg=route.locator('[data-stage="1"] .route-desktop');
 await expect(svg.locator('.route-city')).toHaveCount(7);
 const start=await svg.getByRole('link',{name:'Kaliningrad',exact:true}).boundingBox();
 const finish=await svg.getByRole('link',{name:'Amsterdam',exact:true}).boundingBox();
 expect(start!.y).toBeLessThan(finish!.y);
 expect(finish!.y-start!.y).toBeGreaterThan(350);
 const box=await route.boundingBox();
 expect(Math.abs(box!.y+box!.height/2-450)).toBeLessThan(3);
 await page.evaluate(()=>document.getElementById('jonkoping')!.scrollIntoView());
 await expect(route).toHaveAttribute('data-current-stage','2');
 const second=route.locator('[data-stage="2"] .route-desktop');
 await expect(second.locator('.route-city')).toHaveCount(5);
 await expect(second.getByRole('link',{name:'Helsingborg',exact:true})).toBeVisible();
});
