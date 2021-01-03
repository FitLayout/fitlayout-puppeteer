/*
 * Line detection in a displayed web page.
 * (c) 2020 Radek Burget <burgetr@fit.vutbr.cz>
 * 
 */

function fitlayoutDetectLines() {

	var TEXT_CONT = "XX"; // element name to be used for wrapping the text nodes
	var LINE_CONT = "XLINE"; // element name to be used for wrapping the detected lines

	/**
	 * Finds lines in a given XX element and marks them with separate elements.
	 * @param {Element} xx the XX element to be processed.
	 */
	function createLines(xx) {
		var text = xx.textContent;
		var rects = xx.getClientRects();
		if (rects.length > 1) {
			lines = splitTextByLines(xx, text, rects);
			xx.innerText = '';
			for (var line of lines) {
				xx.appendChild(line);
			}
			return lines.length;
		} else {
			return rects.length;
		}
	}

	/**
	 * Splits the text content of a given element based on the client rectangles.
	 * 
	 * @param {Element} parent the parent element of the text node 
	 * @param {string} text the text content to be split 
	 * @param {*} rects element client rectangles to be used for splitting 
	 */
	function splitTextByLines(parent, text, rects) {
		var breaks = [];
		var lastY = 0;
		for (var i = 0; i < rects.length; i++) {
			var rect = rects[i];
			// TODO this is Chrome-specific; use caretPositionFromPoint in other browsers
			var range = document.caretRangeFromPoint(rect.x + 1, rect.y + rect.height / 2); //use +1 to be sure to hit some position
			if (range) {
				var ofs = range.startOffset;
				// detect line breaks
				if (i == 0 || rect.y != lastY) {
					breaks.push(ofs);
					lastY = rect.y;
				}
			}
		}
		breaks.push(text.length);
		//split to elements
		var lines = [];
		for (var i = 0; i < breaks.length - 1; i++) {
			var subtext = text.substring(breaks[i], breaks[i + 1]);
			var line = document.createElement(LINE_CONT);
			line.appendChild(document.createTextNode(subtext));
			lines.push(line);
		}
		return lines;
	}

	function isVisibleElement(e) {
		if (e.nodeType == Node.ELEMENT_NODE) {
			return (e.getClientRects().length > 0);
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

	unmix(document.body);
	var xxs = Array.from(document.getElementsByTagName(TEXT_CONT));
	for (var i = 0; i < xxs.length; i++) {
		var n = createLines(xxs[i]);
		if (n === 0) {
			console.log(xxs[i]);
		}
	}
}
