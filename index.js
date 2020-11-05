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
	await page.goto('https://www.idnes.cz/technet/software/bezpecnostni-chyba-prohlizec-google-chrome-instalujte-aktualizaci.A201104_174236_software_nyv');
	page.on('console', msg => console.log('PAGE LOG:', msg.text()));

	let pg = await page.evaluate(() => {

		/*=lines.js=*/
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
	xxs = Array.from(document.getElementsByTagName(TEXT_CONT));
	for (var i = 0; i < xxs.length; i++) {
		flatten(xxs[i]);
	}
}
		/*=export.js=*/
function fitlayoutExportBoxes() {

	let styleProps = [
		"display",
		"color",
		"background",
		"font",
		"text-decoration-line",
		"border",
		"margin",
		"padding",
		"overflow",
		"transform"
	];

	let nextId = 0;


	function createBox(e) {
		e.fitlayoutID = nextId++;

		let ret = {};
		ret.id = e.fitlayoutID;
		ret.tagName = e.tagName;
		ret.x = e.offsetTop;
		ret.y = e.offsetLeft;
		ret.width = e.offsetWidth;
		ret.height = e.offsetHeight;
		if (e.offsetParent !== null) {
			ret.parent = e.offsetParent.fitlayoutID;
		}

		let style = window.getComputedStyle(e, null);
		let css = "";
		styleProps.forEach((name) => {
			css += name + ":" + style[name] + ";";
		});

		ret.css = css;

		return ret;
	}

	function isVisibleElement(e) {
		if (e.nodeType === Node.ELEMENT_NODE) {
			var cs = window.getComputedStyle(e, null);
			if (cs != null && cs.display === 'none' && cs.visibility === 'visible') {
				return false;
			}
			return true;
		}
		return false;
	}

	function processBoxes(root, ret) {

		if (isVisibleElement(root)) {
			let box = createBox(root);
			ret.push(box);

			var children = root.childNodes;
			for (var i = 0; i < children.length; i++) {
				processBoxes(children[i], ret);
			}
			for (var i = 0; i < children.length; i++) {
				if (children[i].nodeType === Node.TEXT_NODE && children[i].nodeValue.trim().length > 0) {
					box.text = children[i].nodeValue;
				}
			}
		}

	}

	let boxes = [];
	processBoxes(document.body, boxes);

	let ret = {
		page: {
			width: document.body.scrollWidth,
			height: document.body.scrollHeight,
			title: document.title
		},
		boxes: boxes
	}

	return ret;
}

		fitlayoutDetectLines();
		return fitlayoutExportBoxes();

	});

	await browser.close();

	process.stdout.write(JSON.stringify(pg));

})();
