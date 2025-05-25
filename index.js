const puppeteer = require('puppeteer');

/**
 * Scrape horse information for a particular race
 * @param {Page} page The puppeteer page.
 * @param {number} raceNumber The race number
 * @returns An array of data about each horse.
 *   * pole - The pole position
 *   * horse - The horse name
 *   * origin - The origin of the horse like KY or IRE
 *   * jockey - Name of the Jockey
 *   * trainer - Name of the trainer
 */
async function equibaseRace(page, raceNumber) {
  const data = await page.$eval(`#RACE${raceNumber} ~ .c-entries-data table tbody`, (el) => {
    return Array.from(el.querySelectorAll('tr')).map(row => {
      const cols = row.querySelectorAll('td'); 
      if (row.classList.contains('scratch')) {
        // Scratched horse don't have enough information..
        return null;
      }
      if (cols.length > 10) {
        const jockeyColumn = cols.length == 12 ? 7 : 6;
        const matches = /([^(]+)(?: \((.*)\))/.exec(cols[2].innerText);
        const horse = matches[1];
        const origin =  matches[2];
        return {
          pole: cols[0].innerText,
          horse,
          origin,
          jockey: cols[jockeyColumn].innerText,
          trainer: cols[jockeyColumn + 2].innerText
        };
      } else {
        return null;
      }
    }).filter(row => !!row);
  });
  return data;
}

/**
 * Scrape the "equibase" format page on website. This is
 * like a text-only race program.
 * @param {Page} page The puppeteer page.
 * @param {String} date The race date in mm/dd/yyyy format
 * @returns {Array} Data for each race
 */
async function equibase(page, date) {
  const data = [];
  try {
    await page.goto(`http://equibase.churchilldowns.com/eqbRaceEntriesDisplay.cfm?TRK=CD&CY=USA&DATE=${date}&STYLE=CD`);
    const links = await page.$eval('.race-nav', (el) => {
      return Array.from(el.querySelectorAll('a')).map((e) => e.getAttribute('href'));
    });
    const raceCount = links.length - 1;
    for (let i = 1; i <= raceCount; i++) {
      const race = await equibaseRace(page, i);
      data.push(race);
    }
  } catch(e) {
    console.error(e);
  }
  return data;
}

/**
 * Generates a CSV listing horses by pole position. Each
 * row has an array of horse names, one for each race.
 * 1: ["horse1.1", "horse2.1", "horse3.1"]
 * @param {Array} raceData Data about all the races.
 */
function generateCSV(raceData) {
  const poles = {};
  const headers = ['number'];
  headers.push( ...[...Array(raceData.length).keys()].map(val => `race${val + 1}`));
  console.log(headers.join(','));
  raceData.forEach((data, index) => {
    data.forEach(pos => {
      if (typeof poles[pos.pole] === 'undefined') {
        poles[pos.pole] = Array(raceData.length);
      } 
      poles[pos.pole][index] = pos.horse;
    });
  });
  Object.keys(poles).forEach(pole => {
    console.log(`${pole},` + poles[pole].join(','));
  });
}

/**
 * Returns the first Saturday in May of the current year.
 * @returns {String} The first Saturday in May of the current year in mm/dd/yyyy format.
 */
function firstSaturdayInMay() {
  // Start with May 1st of this year
  const date = new Date();
  date.setMonth(4); // May
  date.setDate(1);

  // figure out how many days to get to a Satuyrday
  const dayOfWeek = date.getDay();
  const daysToSaturday = 6 - dayOfWeek;
  date.setDate(date.getDate() + daysToSaturday);
  return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

(async () => {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  const date = firstSaturdayInMay();
  const results = await equibase(page, date);
  generateCSV(results);
  await browser.close()
})();
