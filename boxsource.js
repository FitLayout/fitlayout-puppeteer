/*
 * boxsource.js - transforms a rendered DOM tree to a BOX tree expected by FITLayout.
 * (c) 2015-2020 Radek Burget <burgetr@fit.vutbr.cz>
 */
class BoxSource {

	constructor(document, domRoot) {
		this.auxElemName = 'Xspan'; //auxiliary element name
		this.document = document;
		this.domRoot = domRoot;
		this.transformTextBoxes(this.domRoot);
	}

	//=================================================================================================
	// DOM transformation
	//=================================================================================================
    /**
     * Creates the box tree and returns its root node.
     */
	getBoxTree() {
		return this.processSubtree(this.domRoot);
	}

	processSubtree(root) {
		if (root.nodeType == Node.ELEMENT_NODE) {
			var ret = new ElementBox(root);
			for (var i = 0; i < root.childNodes.length; i++) {
				var child = this.processSubtree(root.childNodes.item(i));
				if (child != null && child.displayType != 'none')
					ret.addChild(child);
			}
			return ret;
		}
		else if (root.nodeType == Node.TEXT_NODE && root.nodeValue.trim().length > 0) {
			var ret = new TextBox(root);
			return ret;
		}
		else
			return null;
	}

	//=================================================================================================
	// Preprocessing
	//=================================================================================================

    /**
     * Transforms all the boxes in a DOM subtree by splitting to auxiliary elements
     * so that each of them renders on a single line.
     */
	transformTextBoxes(elem) {
		//find all text boxes in the subtree
		var textBoxes = [];
		this.findTextNodes(elem, textBoxes);
	}

    /**
     * Divides a text node to several XSPAN elements so that each of them renders on a single line.
     */
	processTextBox(textNode) {
		//console.log('Text: ' + textNode.nodeValue);
		var parent = textNode.parentNode;
		var elem = this.document.createElement(this.auxElemName);
		//elem.className = 'wrap';
		parent.insertBefore(elem, textNode);
		parent.removeChild(textNode);
		elem.appendChild(textNode);
		this.divide(elem);
	}

    /**
     * Divides a DOM element to several XSPAN elements so that each of them renders on a single line.
     */
	divide(elem) {
		var text = elem.firstChild;
		var orig = text.nodeValue;
		if (orig.length >= 2) {
			//split in two elements
			var sibling = this.document.createElement(this.auxElemName);
			var stext = this.document.createTextNode(orig.slice(0, 1));
			sibling.appendChild(stext);
			text.nodeValue = orig.slice(1);
			elem.parentNode.insertBefore(sibling, elem);
			//find the line break
			var minh = sibling.offsetHeight;
			var start = 1;
			var end = orig.length;
			//apply recursively
			if (!this.onSameLine(sibling, elem)) {
				var split = (start + end) / 2;
				do {
					stext.nodeValue = orig.slice(0, split);
					text.nodeValue = orig.slice(split);
					if (sibling.offsetHeight > minh) //behind the line break
					{
						end = split;
					}
					else //before
					{
						start = split;
					}
					split = (start + end) / 2;
				} while (split != start && split != end);
				this.divide(elem);
			}
			else //rollback
			{
				text.nodeValue = orig;
				elem.parentElement.removeChild(sibling);
			}
		}
	}

    /**
     * Checks whether two DOM elements are rendered on the same line.
     */
	onSameLine(elem1, elem2) {
		return elem1.offsetTop == elem2.offsetTop
			&& elem1.offsetHeight == elem2.offsetHeight;
        /*return elem1.offsetTop == elem2.offsetTop &&
            (Math.abs(elem1.offsetHeight - elem2.offsetHeight) < (elem1.offsetHeight / 2));*/
	}

    /**
     * Finds all text nodes in a DOM subtree.
     */
	findTextNodes(root, ret) {
		var children = root.childNodes;
		for (var i = 0; i < children.length; i++) {
			var child = children.item(i);
			if (child.nodeType == Node.ELEMENT_NODE && window.getComputedStyle(child, null).display != 'none')
				this.findTextNodes(child, ret);
			else if (child.nodeType == Node.TEXT_NODE)
				ret[ret.length] = child;
		}
		return ret;
	}
}


//=================================================================================================
// ElementBox
//=================================================================================================

class ElementBox {

	constructor(elem) {
		this.tagName = elem.nodeName;
		this.attrs = {};
		if (elem.hasAttributes()) {
			var attmap = elem.attributes;
			for (var i = 0; i < attmap.length; i++)
				this.attrs[attmap[i].name] = attmap[i].value;
		}
		var style = window.getComputedStyle(elem, null);
		this.displayType = style.display;
		this.color = style.color;
		this.backgroundColor = style.backgroundColor;
		this.decoration = style.textDecoration;
		this.fontFamily = style.fontFamily;
		this.fontSize = style.fontSize;
		this.fontStyle = style.fontStyle;
		this.fontWeight = style.fontWeight;
		this.bounds = [elem.offsetLeft, elem.offsetTop, elem.offsetWidth, elem.offsetHeight];
		this.margin = [style.marginTop, style.marginRight, style.marginBottom, style.marginLeft];
		this.padding = [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
		this.border = [style.borderTopWidth, style.borderRightWidth, style.borderBottomWidth, style.borderLeftWidth];
		this.borderColor = [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor];
		this.children = [];
	}

	addChild(child) {
		this.children[this.children.length] = child;
	}
}


//=================================================================================================
// TextBox
//=================================================================================================

class TextBox {

	constructor(node) {
		//this.sourceNode = textNode;
		this.text = node.textContent;
	}

}
