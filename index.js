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
	await page.goto(targetUrl, {waitUntil: 'networkidle0', timeout: 10000});
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
﻿﻿/**
*
*  JFont Checker
*  Derek Leung
*  Original Date: 2010.8.23
*  Current: Feb 2016
*  
*  This piece of code checks for the existence of a specified font.
*  It ultilizes the font fallback mechanism in CSS for font checking.
*  
*  Compatibility:
*  Tested on Chrome, Firefox, IE9+
*  Requires CSS and JS
*  
**/
(function(){
	var containerA, containerB, html = document.getElementsByTagName("html")[0],
		filler = "random_words_#_!@#$^&*()_+mdvejreu_RANDOM_WORDS";

	function createContainers(){
		containerA = document.createElement("span");
		containerB = document.createElement("span");

		containerA.textContent = filler;
		containerB.textContent = filler;

		var styles = {
			margin: "0",
			padding: "0",
			fontSize: "32px",
			position: "absolute",
			zIndex: "-1"
		};

		for(var key in styles){
			if(styles.hasOwnProperty(key)){
				containerA.style[key] = styles[key];
				containerB.style[key] = styles[key];
			}
		}

		return function(){
			//clean up
			containerA.outerHTML = "";
			containerB.outerHTML = "";
		};
	}

	function checkDimension(){
		return containerA.offsetWidth === containerB.offsetWidth &&
			   containerA.offsetHeight === containerB.offsetHeight;
	}

	function checkfont(font, DOM){
		var rootEle = html;
		if(DOM && DOM.children && DOM.children.length) rootEle = DOM.children[0];

		var result = null,
			reg = /[\,\.\/\;\'\[\]\`\<\>\\\?\:\"\{\}\|\~\!\@\#\$\%\^\&\*\(\)\-\=\_\+]/g,
			cleanUp = createContainers();

		font = font.replace(reg, "");

		rootEle.appendChild(containerA);
		rootEle.appendChild(containerB);

		//First Check
		containerA.style.fontFamily = font + ",monospace";
		containerB.style.fontFamily = "monospace";

		if(checkDimension()){
		   	//Assume Arial exists, Second Check
			containerA.style.fontFamily = font + ",Arial";
			containerB.style.fontFamily = "Arial";
			result = !checkDimension();
		}else{
			result = true;
		}

		cleanUp();
		return result
	}

	this.checkfont = checkfont;
})();function fitlayoutExportBoxes() {

	const styleProps = [
		"display",
		"position",
		"color",
		"background-color",
		"font",
		"border-top",
		"border-right",
		"border-bottom",
		"border-left",
		"overflow",
		"transform"
	];

	const replacedElements = [
		"img",
		"svg",
		"object",
		"iframe"
	];

	const replacedImages = [
		"img",
		"svg"
	];

	let nextId = 0;


	function createBox(e, style) {
		e.fitlayoutID = nextId++;

		let ret = {};
		ret.id = e.fitlayoutID;
		ret.tagName = e.tagName;
		ret.x = e.offsetLeft;
		ret.y = e.offsetTop;
		ret.width = e.offsetWidth;
		ret.height = e.offsetHeight;

		if (isReplacedElement(e)) {
			ret.replaced = true;
		}

		//gather text decoration info for further propagation
		let decoration = {};
		decoration.underline = (style['text-decoration-line'].indexOf('underline') !== -1);
		decoration.lineThrough = (style['text-decoration-line'].indexOf('line-through') !== -1);
		e.fitlayoutDecoration = decoration;

		//mark the boxes that have some background images
		ret.hasBgImage = (style['background-image'] !== 'none');

		if (e.offsetParent === undefined) { //special elements such as <svg>
			ret.parent = e.parentElement.fitlayoutID; //use parent instead of offsetParent
		} else if (e.offsetParent !== null) {
			ret.parent = e.offsetParent.fitlayoutID;
		}
		if (e.parentElement !== null) {
			ret.domParent = e.parentElement.fitlayoutID;
			if (e.parentElement.fitlayoutDecoration !== undefined) {
				//use the propagated text decoration if any
				decoration.underline |= e.parentElement.fitlayoutDecoration.underline;
				decoration.lineThrough |= e.parentElement.fitlayoutDecoration.lineThrough;
			}
		}

		//encode the text decoration
		if (decoration.underline || decoration.lineThrough) {
			ret.decoration = '';
			if (decoration.underline) {
				ret.decoration += 'U';
			}
			if (decoration.lineThrough) {
				ret.decoration += 'T';
			}
		}

		//encode the remaining style properties
		let css = "";
		styleProps.forEach((name) => {
			css += name + ":" + style[name] + ";";
		});
		ret.css = css;

		//add attributes
		if (e.hasAttributes()) {
			let attrs = e.attributes;
			ret.attrs = [];
			for (let i = 0; i < attrs.length; i++) {
				ret.attrs.push({
					name: attrs[i].name,
					value: attrs[i].value
				});
			}
		}

		return ret;
	}

	function addFonts(style, fontSet) {
		let nameStr = style['font-family'];
		nameStr.split(',').forEach((name) => {
			fontSet.add(name.trim().replace(/['"]+/g, ''));
		});
	}

	function getExistingFonts(fontSet) {
		let ret = [];
		fontSet.forEach((name) => {
			if (checkfont(name)) {
				ret.push(name);
			}
		});
		return ret;
	}

	function isVisibleElement(e) {
		if (e.nodeType === Node.ELEMENT_NODE) {

			//special type element such as <svg> -- allow only known replaced elements
			if (e.offsetParent === undefined) {
				return isReplacedElement(e);
			}

			//elements not shown such as <noscript>
			if (e.offsetParent === null && e.offsetWidth === 0 && e.offsetHeight === 0) {
				return false;
			}

			var cs = window.getComputedStyle(e, null);
			if (cs != null && cs.display === 'none' && cs.visibility === 'visible') {
				return false;
			}
			return true;
		}
		return false;
	}

	function isReplacedElement(e) {
		const tag = e.tagName.toLowerCase();
		if (replacedElements.indexOf(tag) !== -1) {
			return true;
		}
		return false;
	}

	function isImageElement(e) {
		const tag = e.tagName.toLowerCase();
		if (replacedImages.indexOf(tag) !== -1) {
			if (tag == 'img') {
				return e.hasAttribute('src'); //images must have a src specified
			} else {
				return true;
			}
		}
		return false;
	}

	function processBoxes(root, boxList, fontSet, imageList) {

		if (isVisibleElement(root)) {
			let style = window.getComputedStyle(root, null);
			let box = createBox(root, style);
			boxList.push(box);
			addFonts(style, fontSet);
			// save image ids
			if (isImageElement(root)) { //img elements
				root.setAttribute('data-fitlayoutid', box.id);
				let img = { id: box.id, bg: false };
				imageList.push(img);
			} else if (box.hasBgImage) { //background images
				root.setAttribute('data-fitlayoutid', box.id);
				//root.setAttribute('data-fitlayoutbg', '1');
				let img = { id: box.id, bg: true };
				imageList.push(img);
			}

			if (!box.replaced) //do not process the contents of replaced boxes
			{
				var children = root.childNodes;
				for (var i = 0; i < children.length; i++) {
					processBoxes(children[i], boxList, fontSet, imageList);
				}
				for (var i = 0; i < children.length; i++) {
					if (children[i].nodeType === Node.TEXT_NODE && children[i].nodeValue.trim().length > 0) {
						box.text = children[i].nodeValue;
					}
				}
			}
		}

	}

	let boxes = [];
	let images = [];
	let fonts = new Set();
	console.log(boxes);
	console.log(images);
	processBoxes(document.body, boxes, fonts, images);

	let ret = {
		page: {
			width: document.body.scrollWidth,
			height: document.body.scrollHeight,
			title: document.title,
			url: location.href
		},
		fonts: getExistingFonts(fonts),
		boxes: boxes,
		images: images
	}

	return ret;
}
/*
 * fitlayout-puppeteer -- Puppeteer-based web page renderer for FitLayout
 * (c) Radek Burget 2020
 *
 * Font handling functions.
 */

/**
 * Tries to disable CSS-linked fonts.
 */
function disableCSSFonts() {
	
	for (i=0; i < document.styleSheets.length; i++) { 
		//console.log(document.styleSheets[i].href);
		let ss = document.styleSheets[i];
		if (typeof ss.href === 'string') {
			if (ss.href.indexOf('fonts.googleapis.com') !== -1) {
				ss.disabled = true;
			}
		} 
	}
}
/*
 * Line detection in a displayed web page.
 * (c) 2020 Radek Burget <burgetr@fit.vutbr.cz>
 * 
 * Inspired by a solution by Juan Mendes
 * https://stackoverflow.com/questions/27915469/how-to-split-an-html-paragraph-up-into-its-lines-of-text-with-javascript 
 */

function fitlayoutDetectLines() {

	var TEXT_CONT = "XX";
	var LINE_CONT = "XLINE";
	var WORD_CONT = "XW";

	/**
	 * Finds lines in a given element and marks them with separate elements.
	 * @param {Element} p 
	 */
	function createLines(p) {
		splitWords(p);
		var parent = p.parentElement;
		var lines = getLines(p);
		var ltext = lines.map(function (line) {
			return line.map(function (span) {
				return span.innerText;
			}).join(' ')
		});
		if (ltext.length == 0) {
			//may this happen? do nothing.
		} else if (ltext.length == 1) {
			p.innerText = ltext[0];
		} else {
			p.innerText = '';
			for (var i = 0; i < ltext.length; i++) {
				var lelem = document.createElement(LINE_CONT);
				lelem.innerText = ltext[i] + ' '; //to allow line brek after
				parent.insertBefore(lelem, p);
			}
			parent.removeChild(p);
		}
		return ltext.length;
	}

	/**
	 * Replaces words in a given element by XWORD elements.
	 */
	function splitWords(p) {
		p.innerHTML = p.innerText.split(/\s/).map(function (word) {
			return '<' + WORD_CONT + '>' + word + '</' + WORD_CONT + '>'
		}).join(' ');
	}

	/**
	 * Compares the positions of words in a given element and splits the words to lines.
	 * @param {Element} p the element to be processed.
	 */
	function getLines(p) {
		var lines = [];
		var line;
		var words = p.getElementsByTagName(WORD_CONT);
		var lastTop;
		for (var i = 0; i < words.length; i++) {
			var word = words[i];
			if (word.offsetTop != lastTop) {
				lastTop = word.offsetTop;
				line = [];
				lines.push(line);
			}
			line.push(word);
		}
		return lines;
	}

	function isVisibleElement(e) {
		if (e.nodeType == Node.ELEMENT_NODE) {
			var cs = window.getComputedStyle(e, null);
			if (cs != null && cs.display === 'none') {
				return false;
			}
			return true;
		}
		return false;
	}

	/**
	 * Replaces text nodes with XX elements to avoid mixed content.
	 * @param {Element} p the root element of the subtree to process.
	 */
	function unmix(p) {
		var children = p.childNodes;
		var replace = [];
		for (var i = 0; i < children.length; i++) {
			var child = children.item(i);
			if (child.nodeType == Node.TEXT_NODE && child.nodeValue.trim().length > 0) {
				var newchild = document.createElement(TEXT_CONT);
				newchild.appendChild(document.createTextNode(child.nodeValue));
				replace.push(newchild);
			} else {
				replace.push(null);
				if (isVisibleElement(child)) {
					unmix(child);
				}
			}
		}
		for (var i = 0; i < replace.length; i++) {
			if (replace[i] != null) {
				p.replaceChild(replace[i], children.item(i));
			}
		}
	}

	/**
	 * Checks if a given XX element is necessary and removes it when it is not.
	 * @param {Element} p the XX element to be considered
	 */
	function flatten(p) {
		var children = p.parentElement.childNodes;
		var cnt = 0;
		for (var i = 0; i < children.length; i++) {
			var child = children.item(i);
			if (child.nodeType == Node.ELEMENT_NODE) {
				cnt++;
			}
		}
		if (cnt == 1) {
			p.parentElement.innerText = p.innerText;
		}
	}

	unmix(document.body);
	var xxs = Array.from(document.getElementsByTagName(TEXT_CONT));
	for (var i = 0; i < xxs.length; i++) {
		var n = createLines(xxs[i]);
		if (n === 0) {
			console.log(xxs[i]);
		}
	}
	/*xxs = Array.from(document.getElementsByTagName(TEXT_CONT));
	for (var i = 0; i < xxs.length; i++) {
		flatten(xxs[i]);
	}*/
}

		fitlayoutDetectLines();
		return fitlayoutExportBoxes();

	});

	// add a screenshot if it was taken
	if (screenShot !== null) {
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
