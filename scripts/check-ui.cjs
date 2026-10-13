const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
(async () => {
 fs.mkdirSync('review', {recursive:true});
 const browser = await chromium.launch();
 const results = [];
 try {
  for (const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]]) {
   const page = await browser.newPage({viewport:{width,height}});
   const errors = [];
   page.on('pageerror', error => errors.push(error.message));
   await page.goto(pathToFileURL(path.resolve('index.html')).href);
   await page.evaluate(async () => { await Promise.all([...document.images].map(im => im.decode())); });
   const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
   assert.equal(overflow,false, `${name}: horizontal overflow`);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('.tariff:visible').count(),5);
   await page.getByRole('button',{name:'Экономичнее',exact:true}).click();
   assert.equal(await page.locator('.tariff:visible').count(),2);
   await page.getByRole('button',{name:'Быстрее',exact:true}).click();
   assert.equal(await page.locator('.tariff:visible').count(),3);
   await page.getByRole('button',{name:'Все варианты',exact:true}).click();
   await page.locator('[data-mode="Авто экспресс"]').click();
   assert.equal(await page.locator('#delivery-mode').inputValue(),'Авто экспресс');
   if (name === 'mobile') {
    await page.locator('.menu-toggle').click();
    assert.equal(await page.locator('#navigation').isVisible(),true);
    await page.locator('#navigation a[href="#quote"]').count();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#navigation').isVisible(),false);
   }
   await page.locator('[name="category"]').selectOption({label:'Товары для дома'});
   await page.locator('[name="city"]').fill('Москва');
   await page.locator('[name="weight"]').fill('100');
   await page.locator('[name="volume"]').fill('0.5');
   await page.locator('input[value="Страхование"]').check();
   await page.locator('[name="details"]').fill('Тест поставки');
   await page.getByRole('button',{name:'Подготовить запрос'}).click();
   assert.equal(await page.locator('#request-dialog').isVisible(),true);
   const message = await page.locator('#request-text').inputValue();
   for(const expected of ['Товары для дома','Москва','100 кг','0.5 м³','Авто экспресс','Страхование','Тест поставки']) assert.ok(message.includes(expected));
   assert.ok((await page.locator('#email-request').getAttribute('href')).startsWith('mailto:logistic-company.pro@yandex.ru?'));
   await page.locator('.dialog-close').click();
   assert.equal(await page.locator('#request-dialog').isVisible(),false);
   await page.locator('.faq details').first().locator('summary').click();
   assert.equal(await page.locator('.faq details').first().getAttribute('open'),'');
   await page.locator('.faq details').first().locator('summary').click();
   assert.deepEqual(errors,[]);
   await page.evaluate(() => window.scrollTo(0,0));
   await page.screenshot({path:`review/${name}.png`,fullPage:true,animations:'disabled'});
   await page.screenshot({path:`review/${name}-first-screen.png`,animations:'disabled'});
   results.push({viewport:name,width,checks:'images, layout, tariff filters, chosen transport, mobile menu, quote, modal, FAQ',passed:true});
   await page.close();
  }
  fs.writeFileSync('review/results.json', JSON.stringify(results,null,2));
  console.log(JSON.stringify(results));
 } finally {await browser.close();}
})().catch(error => {console.error(error);process.exit(1);});
