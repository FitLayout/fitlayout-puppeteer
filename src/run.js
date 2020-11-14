/*
 * fitlayout-puppeteer -- Puppeteer-based web page renderer for FitLayout
 * (c) Radek Burget 2020
 *
 * Transforms a rendered web page to its JSON description that can be later
 * parsed by fitlayout-render-puppeteer.
 */

const err = process.stderr;
if (process.argv.length !== 5) {
	err.write('Usage: node run.js <url> <width> <height>\n');
	err.write('Where:\n')
	err.write('    <url> is the URL of the page to render\n');
	err.write('    <width> is the browser window width\n')
	err.write('    <height> is the browser window width\n')
	process.exit(1);
}

const targetUrl = process.argv[2];
const wwidth = process.argv[3];
const wheight = process.argv[4];

const puppeteer = require('puppeteer');

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		//slowMo: 250,
		args: [`--window-size=${wwidth},${wheight}`],
		defaultViewport: null
	});
	const page = await browser.newPage();
	await page.goto(targetUrl);
	//page.on('console', msg => err.write('PAGE LOG:', msg.text() + '\n'));

	let pg = await page.evaluate(() => {

		/*=client.js=*/

		fitlayoutDetectLines();
		return fitlayoutExportBoxes();

	});

	await browser.close();

	process.stdout.write(JSON.stringify(pg));

})();
