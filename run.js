/*
 * fitlayout-puppeteer -- Puppeteer-based web page renderer for FitLayout
 * (c) Radek Burget 2020
 *
 * Transforms a rendered web page to its RDF description.  
 */

const puppeteer = require('puppeteer');

function outputBox(out, box) {
	let css = box.css + ' ';
	css = css.replace(/\"/g,'\'');
	let text = box.text || '&nbsp;';
	out.write(`<div data-tag="${box.tagName}" style="${css}">${text}</div>\n`);
}

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		//slowMo: 250,
		args: [`--window-size=1600,1200`],
		defaultViewport: null
	});
	const page = await browser.newPage();
	//await page.goto('https://www.fit.vut.cz/study/courses/');
	await page.goto('https://www.idnes.cz/technet/software/bezpecnostni-chyba-prohlizec-google-chrome-instalujte-aktualizaci.A201104_174236_software_nyv');
	page.on('console', msg => console.log('PAGE LOG:', msg.text()));

	let pg = await page.evaluate(() => {

		/*=lines.js=*/
		/*=export.js=*/

		fitlayoutDetectLines();
		return fitlayoutExportBoxes();

	});

	await browser.close();

	let head = `
		<!DOCTYPE html>
		<head>
			<title>${pg.page.title}</title>
		</head>
		<style>
			* { box-sizing: border-box; white-space: nowrap; }
		</style>
		<body>
		<div style="position:absolute;top:0;left:0;width:${pg.page.width}px;height:${pg.page.height}px;">
	`;
	let tail = `
		</div>
		</body>
		</html>
	`

	process.stdout.write(head);
	for (let i = 0; i < pg.boxes.length; i++) {
		outputBox(process.stdout, pg.boxes[i]);
	}	
	process.stdout.write(tail);

})();
