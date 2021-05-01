const puppeteer = require('puppeteer');

const churchillDownsURL = 'https://www.churchilldowns.com/racing-wagering/toteboard';
const horseRacingNationURL = 'https://entries.horseracingnation.com/entries-results/churchill-downs';

const date = '2021-05-06';

async function churchilldowns(page, date) {
  let race = 1;
  let races = 0;
  const results = [];
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
    results.push(horses);
    race += 1;
  } while (race <= races);
  return results;
}

async function horseracingnation(page, date) {
  const results = [];
  await page.goto(`${horseRacingNationURL}/${date}`);
  const raceData = await page.$$('.my-5');
  for (let i = 0; i < raceData.length; i++) {
    const horses = await raceData[i].$$eval('.table-entries tbody tr', (rows) => {
      return rows.map((row) => {
        return {
          number: row.querySelector('td:nth-child(2)').textContent.trim(),
          name: row.querySelector('h4').textContent
        }
      });
    });
    results.push(horses);
  }
  return results;
}

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const results = await horseracingnation(page, date);
  // const results = await churchilldowns(page, date);
  console.log('race,number,name');
  results.forEach((horses, racenum) => {
    horses.forEach(horse => {
      console.log(`${racenum + 1},${horse.number},${horse.name}`);
    })
  });
  await browser.close()
})()
