/*
 * fitlayout-puppeteer -- Puppeteer-based web page renderer for FitLayout
 * (c) Radek Burget 2020-2021
 *
 * Transforms a rendered web page to its JSON description that can be later
 * parsed by fitlayout-render-puppeteer.
 */

const argv = require('yargs/yargs')(process.argv.slice(2))
    .usage('Usage: $0 [options] <url>')
	//.example('$0 -W 1200 -H 800 http://cssbox.sf.net', '')
	.strictOptions(true)
    .alias('W', 'width')
    .nargs('W', 1)
	.default('W', 1200)
	.describe('W', 'Target page width')
    .alias('H', 'height')
    .nargs('H', 1)
	.default('H', 800)
	.describe('H', 'Target page height')
	.alias('P', 'persistence')
	.nargs('P', 1)
	.default('P', 1)
	.describe('P', 'Content downloading persistence: 0 (quick), 1 (standard), 2 (wait longer), 3 (get as much as possible)')
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

let downloadOptions = {};
switch (argv.P) {
	case 0:
		downloadOptions = {waitUntil: 'domcontentloaded', timeout: 10000};
		break;
	case 1:
		downloadOptions = {waitUntil: 'load', timeout: 15000};
		break;
	case 2:
		downloadOptions = {waitUntil: 'networkidle2', timeout: 15000};
		break;
	default:
		downloadOptions = {waitUntil: 'networkidle0', timeout: 50000};
		break;
}

const puppeteer = require('puppeteer');

(async () => {
	const browser = await puppeteer.launch({
		headless: true,
		//slowMo: 250,
		args: [`--window-size=${wwidth},${wheight}`],
		defaultViewport: null
	});
	const page = await browser.newPage();
	try {
		await page.goto(targetUrl, downloadOptions);
	} catch (e) {
		console.error(e);
	}
	//page.on('console', msg => console.log('PAGE LOG:', msg.text() + '\n'));

	//always take a screenshot in order to get the whole page into the viewport
	let screenShot = await page.screenshot({
		type: "png",
		fullPage: true,
		encoding: "base64"
	});

	//produce the box tree
	let pg = await page.evaluate(() => {

		/*=client.js=*/

		fitlayoutDetectLines();
		return fitlayoutExportBoxes();

	});

	// add a screenshot if it was required
	if (argv.s && screenShot !== null) {
		pg.screenshot = screenShot;
	}

	// capture the images if required
	if (argv.I && pg.images) {
		// hide the contents of the marked elemens
		await page.addStyleTag({content: '[data-fitlayoutbg="1"] * { display: none }'});
		// take the screenshots
		for (let i = 0; i < pg.images.length; i++) {
			let img = pg.images[i];
			let selector = '*[data-fitlayoutid="' + img.id + '"]';

			try {
				if (img.bg) {
					// for background images switch off the contents
					await page.$eval(selector, e => {
						e.setAttribute('data-fitlayoutbg', '1');
					});
				}

				let elem = await page.$(selector);
				if (elem !== null) {
					img.data = await elem.screenshot({
						type: "png",
						encoding: "base64"
					});
				}

				if (img.bg) {
					//for background images switch the contents on again
					await page.$eval(selector, e => {
						e.setAttribute('data-fitlayoutbg', '0');
					});
				}
			} catch (e) {
				//console.error('Couldn\'t capture image ' + i);
				//console.error(e);
			}
		}
	}

	await browser.close();

	process.stdout.write(JSON.stringify(pg));

})();
