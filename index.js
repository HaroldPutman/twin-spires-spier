const puppeteer = require('puppeteer');

const date = '2021-05-01';

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  let race = 1;
  let races = 0;
  console.log('race,number,name');
  await page.goto(`https://www.churchilldowns.com/racing-wagering/toteboard#/${date}/${race}`)
  do {
    if (!races) {
      races = await page.$$eval('.shortcuts a', links => { return links.length });
    }
    await page.click(`.shortcuts a:nth-child(${race})`);
    const horses = await page.$$eval('table.race-table tbody tr', rows => { return rows.map(row => {
      return {
        number: row.querySelector('td:nth-child(2)').textContent,
        name: row.querySelector('td:nth-child(3)').textContent
        };
      });
    });
    horses.forEach(horse => {
      console.log(`${race},${horse.number},${horse.name}`);
    });
    race += 1;
  } while (race <= races);
  await browser.close()
})()
