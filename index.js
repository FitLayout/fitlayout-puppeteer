/*
 * fitlayout-puppeteer -- Puppeteer-based web page renderer for FitLayout
 * (c) Radek Burget 2020
 *
 * Transforms a rendered web page to its RDF description.  
 */

const puppeteer = require('puppeteer');

const elemSimpleProperties = {
	htmlTagName: { type: null },
	backgroundColor: { type: null },
	color: { type: null },
	fontFamily: { type: null },
	fontSize: { type: 'float' },
	fontStyle: { type: 'float' },
	fontWeight: { type: 'float' },
	lineThrough: { type: 'float' },
	underline: { type: 'float' },
	positionX: { type: 'float' },
	positionY: { type: 'float' },
	width: { type: 'float' },
	height: { type: 'float' },
	visualX: { type: 'float' },
	visualY: { type: 'float' },
	visualWidth: { type: 'float' },
	visualHeight: { type: 'float' }
};

function outputProperty(namespace, name, value, type) {
	let ret = '    ';
	ret += namespace + ':' + name;
	ret += ' "' + value + '"';
	if (type !== null)
		ret += '^^xsd:type';
	console.log(ret)
}

function formatElement(elem) {

	console.log(elem);
	
	Object.getOwnPropertyNames(elem).forEach((name) => {
		if (elemSimpleProperties.hasOwnProperty(name)) {
			outputProperty('box', name, elem[name], null);
		}
	});


}


(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		//slowMo: 250,
		args: [`--window-size=1600,1200`],
		defaultViewport: null
	});
	const page = await browser.newPage();
	await page.goto('https://www.fit.vut.cz/study/courses/');
	page.on('console', msg => console.log('PAGE LOG:', msg.text()));

	let root = await page.evaluate(() => {

		function pixels(value)
		{
			return (value.endsWith('px')) ? value.substr(0, value.length-2) : value;
		}

		function fontWeight(value)
		{
			if (value !== null ) {
				switch (value)
				{
					case "bold":
						return 1.0;
					case "normal":
						return 0.0;
					default:
						let num = parseInt(value);
						return value > 400 ? 1.0 : 0.0;
				}
			} else {
				return 0.0;
			}
		}

		function fontStyle(value)
		{
			if (value !== null ) {
				switch (value)
				{
					case "italic":
					case "oblique":
						return 1.0;
					default:
						return 0.0;
				}
			} else {
				return 0.0;
			}
		}

		class BoxSource {

			idcnt = 0;

			constructor(document, domRoot) {
				this.document = document;
				this.domRoot = domRoot;
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
					let ret = new ElementBox(root);
					for (var i = 0; i < root.childNodes.length; i++) {
						var child = this.processSubtree(root.childNodes.item(i));
						if (child != null && child.displayType != 'none')
							ret.addChild(child);
					}
					ret.id = this.idcnt++;
					return ret;
				}
				else if (root.nodeType == Node.TEXT_NODE && root.nodeValue.trim().length > 0) {
					let ret = new TextBox(root);
					ret.id = this.idcnt++;
					return ret;
				}
				else
					return null;
			}
		}

		//=================================================================================================
		// ElementBox
		//=================================================================================================

		class ElementBox {

			constructor(elem) {
				this.htmlTagName = elem.nodeName;
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
				this.fontSize = pixels(style.fontSize);
				this.fontStyle = fontStyle(style.fontStyle);
				this.fontWeight = fontWeight(style.fontWeight);
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

		// This code runs in the browser
		var bs = new BoxSource(document, document.documentElement);
		var ret = bs.getBoxTree();
		return ret;

	});

	await browser.close();

	formatElement(root);

})();
