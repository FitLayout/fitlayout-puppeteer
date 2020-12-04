/*
 * fitlayout-puppeteer -- Puppeteer-based web page renderer for FitLayout
 * (c) Radek Burget 2020
 *
 * Transforms a rendered web page to its JSON description that can be later
 * parsed by fitlayout-render-puppeteer.
 */

const argv = require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 [options] <url>')
	//.example('$0 -w 1200 -h 800 http://cssbox.sf.net', '')
	.strictOptions(true)
    .alias('W', 'width')
    .nargs('W', 1)
	.default('W', 1200)
	.describe('W', 'Target page width')
    .alias('H', 'height')
    .nargs('H', 1)
	.default('H', 800)
	.describe('H', 'Target page height')
	.alias('s', 'screenshot')
	.boolean('s')
	.default('s', false)
	.describe('s', 'Include a screenshot in the result')
	.alias('I', 'download-images')
	.boolean('I')
	.default('I', false)
	.describe('I', 'Download all contained images referenced in <img> elements')
    .help('h')
    .alias('h', 'help')
    .argv;

if (argv._.length !== 1) {
	process.stderr.write('<url> is required. Use -h for help.\n');
	process.exit(1);
}

const targetUrl = argv._[0];
const wwidth = argv.width;
const wheight = argv.height;

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
	//page.on('console', msg => console.log('PAGE LOG:', msg.text() + '\n'));

	//take a screenshot when required
	let screenShot = null;
	if (argv.s) {
		screenShot = await page.screenshot({
			type: "png",
			fullPage: true,
			encoding: "base64"
		});
	}

	//produce the box tree
	let pg = await page.evaluate(() => {

		/*=client.js=*/

		fitlayoutDetectLines();
		return fitlayoutExportBoxes();

	});

	if (screenShot !== null) {
		pg.screenshot = screenShot;
	}

	// download the images if required
	if (argv.I && pg.images) {
		for (let i = 0; i < pg.images.length; i++) {
			let img = pg.images[i];
			try {
				let resp = await page.goto(img.url);
				let buffer = await resp.buffer();
				img.data = buffer.toString('base64');
				img.type = resp.headers()['content-type'];
			} catch (e) {
				console.error(e);
			}
		}
	}

	await browser.close();

	process.stdout.write(JSON.stringify(pg));

})();
