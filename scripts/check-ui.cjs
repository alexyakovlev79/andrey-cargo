const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const path = require('node:path');

(async () => {
  fs.mkdirSync('review', { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const [name,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,740]]) {
      const page = await browser.newPage({ viewport: {width,height} });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(process.env.REVIEW_URL || pathToFileURL(path.resolve('index.html')).href);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(image => image.decode()));
      });
      assert.equal(await page.locator('h1').count(),1);
      assert.equal(await page.locator('.dcard').count(),5);
      assert.deepEqual(await page.locator('.logo .mark').allTextContents(),['765','765']);
      const badLayout = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width && rect.height && getComputedStyle(el).position !== 'fixed' && (rect.right > innerWidth + 1 || rect.left < -1);
      }).map(el => ({tag:el.tagName,class:el.className,text:el.textContent.slice(0,80)})));
      assert.deepEqual(badLayout,[],`${name}: elements extend past screen`);
      const ctaColor = await page.locator('.hero .btn-primary').evaluate(el => getComputedStyle(el).backgroundColor);
      assert.equal(ctaColor,'rgb(53, 239, 220)');
      if (width <= 1160) {
        await page.locator('#burger').click();
        assert.equal(await page.locator('#mobileMenu').isVisible(),true);
        assert.equal(await page.locator('#burger').getAttribute('aria-expanded'),'true');
        const menuTop = await page.locator('#mobileMenu').evaluate(el=>el.getBoundingClientRect().top);
        assert.equal(menuTop,width <= 600 ? 64 : 74);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#mobileMenu').isVisible(),false);
        await page.locator('#burger').click();
        await page.locator('#mobileMenu a[href="#lead"]').click();
        assert.equal(await page.locator('#mobileMenu').isVisible(),false);
      }
      await page.getByLabel('Имя',{exact:true}).fill('Тест формы');
      await page.getByLabel('Телефон',{exact:true}).fill('+7 000 000-00-00');
      await page.getByLabel('Название товара',{exact:true}).fill('Тестовый товар');
      await page.getByLabel('Вес, кг',{exact:true}).fill('100');
      await page.getByLabel('Объём, м³',{exact:true}).fill('0.5');
      await page.getByLabel('Способ доставки',{exact:true}).selectOption({label:'Авто экспресс (8–13 дней)'});
      await page.getByRole('radio',{name:'Сообщение'}).check();
      await page.getByRole('button',{name:'Получить расчёт →',exact:true}).click();
      assert.equal(await page.locator('#request-dialog').isVisible(),true);
      const text = await page.locator('#request-text').inputValue();
      for (const item of ['Тест формы','+7 000 000-00-00','Тестовый товар','100 кг','0.5 м³','Авто экспресс','Сообщение']) assert.ok(text.includes(item),item);
      assert.ok((await page.locator('#telegram-request').getAttribute('href')).startsWith('https://t.me/CargoChina765?text='));
      assert.ok((await page.locator('#email-request').getAttribute('href')).startsWith('mailto:logistic-company.pro@yandex.ru?'));
      await page.getByRole('button',{name:'Закрыть окно',exact:true}).click();
      assert.equal(await page.locator('#request-dialog').isVisible(),false);
      assert.deepEqual(errors,[]);
      await page.evaluate(() => {
        document.querySelector('#leadForm').reset();
        document.documentElement.style.scrollBehavior = 'auto';
        document.activeElement.blur();
        window.scrollTo({top:0,behavior:'instant'});
      });
      await page.screenshot({path:`review/${name}-first-screen.png`,animations:'disabled'});
      await page.screenshot({path:`review/${name}.png`,fullPage:true,animations:'disabled'});
      results.push({viewport:name,width,passed:true});
      await page.close();
    }
    fs.writeFileSync('review/results.json',JSON.stringify(results,null,2));
    console.log(JSON.stringify(results));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
