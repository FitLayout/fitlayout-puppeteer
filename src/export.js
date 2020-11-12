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
