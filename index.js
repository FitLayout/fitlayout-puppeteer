/*
 * fitlayout-puppeteer -- Puppeteer-based web page renderer for FitLayout
 * (c) Radek Burget 2020
 *
 * Transforms a rendered web page to its JSON description that can be later
 * parsed by fitlayout-render-puppeteer.
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
	await page.goto('https://lupa.cz');
	//await page.goto('https://www.idnes.cz/technet/software/bezpecnostni-chyba-prohlizec-google-chrome-instalujte-aktualizaci.A201104_174236_software_nyv');
	//page.on('console', msg => console.log('PAGE LOG:', msg.text()));

	let pg = await page.evaluate(() => {

		/*=jfont-checker.js=*/
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
})();		/*=lines.js=*/
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
		/*=export.js=*/
function fitlayoutExportBoxes() {

	let styleProps = [
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

		//gather text decoration info for further propagation
		let decoration = {};
		decoration.underline = (style['text-decoration-line'].indexOf('underline') !== -1);
		decoration.lineThrough = (style['text-decoration-line'].indexOf('line-through') !== -1);
		e.fitlayoutDecoration = decoration;

		if (e.offsetParent !== null) {
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

			if (e.offsetParent === null && e.offsetWidth === 0 && e.offsetHeight === 0) {
				return false; //noscript etc.
			}

			var cs = window.getComputedStyle(e, null);
			if (cs != null && cs.display === 'none' && cs.visibility === 'visible') {
				return false;
			}
			return true;
		}
		return false;
	}

	function processBoxes(root, boxList, fontSet) {

		if (isVisibleElement(root)) {
			let style = window.getComputedStyle(root, null);
			let box = createBox(root, style);
			boxList.push(box);
			addFonts(style, fontSet);

			var children = root.childNodes;
			for (var i = 0; i < children.length; i++) {
				processBoxes(children[i], boxList, fontSet);
			}
			for (var i = 0; i < children.length; i++) {
				if (children[i].nodeType === Node.TEXT_NODE && children[i].nodeValue.trim().length > 0) {
					box.text = children[i].nodeValue;
				}
			}
		}

	}

	let boxes = [];
	let fonts = new Set();
	processBoxes(document.body, boxes, fonts);

	let ret = {
		page: {
			width: document.body.scrollWidth,
			height: document.body.scrollHeight,
			title: document.title
		},
		fonts: getExistingFonts(fonts),
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
