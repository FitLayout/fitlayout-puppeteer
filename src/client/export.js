function fitlayoutExportBoxes() {

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

		if (e.fitlayoutLines !== undefined) {
			ret.lines = e.fitlayoutLines; //elements split to multiple lines by detectLines()
		}

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
