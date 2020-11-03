
const puppeteer = require('puppeteer');


(async () => {
	const browser = await puppeteer.launch({
		headless: true,
		//slowMo: 250,
		args: [`--window-size=1600,1200`],
		defaultViewport: null
	});
	const page = await browser.newPage();
	//await page.goto('https://www.fit.vut.cz/study/courses/');
	await page.goto('https://www.idnes.cz');
	page.on('console', msg => console.log('PAGE LOG:', msg.text()));

	await page.emulateMediaType('screen');
	await page.pdf({
		path: '/tmp/test.pdf',
		format: 'A0',
		scale: 1,
		printBackground: true,

	});

	await browser.close();


})();
