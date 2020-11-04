function fitlayoutExportBoxes() {

	let styleProps = [
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

	function getPositionString(e) {
		let ret = "position:absolute;";
		let r = e.getBoundingClientRect();
		const sx = window.scrollX;
		const sy = window.scrollY;
		ret += "top:" + (r.top + sy) + "px;";
		ret += "left:" + (r.left + sx) + "px;";
		ret += "width:" + r.width + "px;";
		ret += "height:" + r.height + "px;";
		return ret;
	}

	function createBox(e) {
		let ret = {};
		ret.tagName = e.tagName;

		let style = window.getComputedStyle(e, null);
		let css = "";
		styleProps.forEach((name) => {
			css += name + ":" + style[name] + ";";
		});

		css += getPositionString(e);

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
