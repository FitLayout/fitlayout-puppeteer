/*
 * fitlayout-puppeteer -- Puppeteer-based web page renderer for FitLayout
 * (c) Radek Burget 2020
 *
 * Transforms a rendered web page to its RDF description.  
 */

const puppeteer = require('puppeteer');

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		//slowMo: 250,
		args: [`--window-size=1600,1200`],
		defaultViewport: null
	});
	const page = await browser.newPage();
	//await page.goto('https://www.fit.vut.cz/study/courses/');
	await page.goto('http://cssbox.sf.net');
	//await page.goto('https://www.idnes.cz/technet/software/bezpecnostni-chyba-prohlizec-google-chrome-instalujte-aktualizaci.A201104_174236_software_nyv');
	//page.on('console', msg => console.log('PAGE LOG:', msg.text()));

	let pg = await page.evaluate(() => {

		/*=jfont-checker.js=*/
		/*=lines.js=*/
		/*=export.js=*/

		fitlayoutDetectLines();
		return fitlayoutExportBoxes();

	});

	await browser.close();

	process.stdout.write(JSON.stringify(pg));

})();
