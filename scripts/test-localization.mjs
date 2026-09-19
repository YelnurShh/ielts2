import { chromium } from '/Users/elnrsahar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=JSON.parse(fs.readFileSync('src/locales/source.json'));
const translations=JSON.parse(fs.readFileSync('src/locales/translations.json'));
assert.equal(source.length,Object.keys(translations).length);
for(const pair of Object.values(translations))assert.ok(pair.length===2&&pair.every(v=>typeof v==='string'&&v.trim()));
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5176'],{env:{...process.env,VITE_FIREBASE_EMULATORS:'true'},stdio:'ignore'});
let browser;const errors=[];const base='http://127.0.0.1:5176';
try{
 for(let i=0;i<100;i++){try{if((await fetch(base)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base);await page.getByRole('button',{name:'EN',exact:true}).click();await page.getByRole('heading',{name:/Write clearly/}).waitFor();
 await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'en');await page.getByRole('heading',{name:/Write clearly/}).waitFor();
 await page.goto(base+'/register');await page.getByLabel('Your name',{exact:true}).fill('Сабақтар');await page.getByLabel('Email',{exact:true}).fill('localization@example.test');await page.getByLabel('Password',{exact:true}).fill('Testing123!');
 await page.getByRole('button',{name:'RU',exact:true}).click();assert.equal(await page.getByLabel('Ваше имя',{exact:true}).inputValue(),'Сабақтар');assert.equal(await page.getByLabel('Пароль',{exact:true}).inputValue(),'Testing123!');await page.getByRole('button',{name:'Создать аккаунт',exact:true}).click();await page.getByRole('heading',{name:'Мой учебный путь'}).waitFor();assert.equal(await page.locator('.site-profile-name').innerText(),'Сабақтар');
 for(const [lang,heading] of [['EN','IELTS Writing Task 2: format and assessment'],['RU','IELTS Writing Task 2: формат и оценивание']]){
  await page.getByRole('button',{name:lang,exact:true}).click();await page.goto(base+'/lessons/course-01');await page.getByRole('heading',{name:heading,exact:true}).waitFor();
  const copy=await page.locator('main').innerText();assert.ok(!/[ӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(copy),copy);
 }
 await page.getByRole('button',{name:'EN',exact:true}).click();await page.getByRole('button',{name:/At least 250 words and about 40 minutes/}).click();await page.getByRole('button',{name:/Are there 250 words/}).click();await page.getByRole('button',{name:'Check and save',exact:true}).click();await page.getByText('Result saved.',{exact:true}).waitFor();await page.reload();await page.getByText('Result: 2 / 2',{exact:true}).waitFor();
 for(const lang of ['EN','RU']){
  await page.getByRole('button',{name:lang,exact:true}).click();
  for(let lesson=1;lesson<=34;lesson++){
   await page.goto(base+'/lessons/course-'+String(lesson).padStart(2,'0'));await page.locator('.lesson-section').first().waitFor();
   const copy=await page.locator('main').innerText();assert.ok(!/[ӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(copy),lang+' lesson '+lesson+'\n'+copy);
  }
 }
 await page.getByRole('button',{name:'EN',exact:true}).click();
 for(const path of ['/tasks','/tasks/matching','/tasks/gaps','/tasks/sorting','/tasks/order','/practice','/practice/course-foundation?lesson=course-01','/ai-analysis','/dashboard']){
  await page.goto(base+path);await page.locator('main h1').waitFor();const copy=await page.locator('main').innerText();assert.ok(!/[ӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(copy),path+'\n'+copy);
 }
 await page.setViewportSize({width:390,height:844});await page.goto(base);await page.getByRole('button',{name:'RU',exact:true}).click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:'/tmp/ielts-ru-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/lessons/course-01');await page.locator('.lesson-section').first().waitFor();await page.screenshot({path:'/tmp/ielts-ru-lesson.png',fullPage:true});
 const teacher=await browser.newPage();teacher.on('pageerror',e=>errors.push(e.message));await teacher.goto(base+'/register');await teacher.getByRole('button',{name:'EN',exact:true}).click();await teacher.getByLabel('Teacher',{exact:true}).check();await teacher.getByLabel('Teacher access code').fill('Teacher2026++');await teacher.getByLabel('Your name',{exact:true}).fill('Teacher localization');await teacher.getByLabel('Email',{exact:true}).fill('localization-teacher@example.test');await teacher.getByLabel('Password',{exact:true}).fill('Testing123!');await teacher.getByRole('button',{name:'Create account',exact:true}).click();await teacher.getByRole('heading',{name:'Teacher dashboard'}).waitFor();
 for(const path of ['/lessons/new','/practice/new','/tasks/new','/dashboard']){await teacher.goto(base+path);await teacher.locator('main h1').waitFor();const copy=await teacher.locator('main').innerText();assert.ok(!/[ӘәІіҢңҒғҮүҰұҚқӨөҺһ]/.test(copy.replaceAll('Сабақтар','')),path+'\n'+copy);}
 assert.deepEqual(errors,[]);console.log('PASS localization: 3 languages, persistence, preserved form data and names, translated curriculum, canonical saved answers, mobile layout.');
}catch(e){if(browser){const pages=browser.contexts().flatMap(c=>c.pages());for(const p of pages)console.log((await p.locator('body').innerText()).slice(0,14000));}throw e}finally{if(browser)await browser.close();server.kill('SIGTERM')}
