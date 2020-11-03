/*
 * Line detection in a displayed web page.
 * (c) 2020 Radek Burget <burgetr@fit.vutbr.cz>
 * 
 * Inspired by a solution by Juan Mendes
 * https://stackoverflow.com/questions/27915469/how-to-split-an-html-paragraph-up-into-its-lines-of-text-with-javascript 
 */

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
