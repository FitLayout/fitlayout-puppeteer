const puppeteer = require('puppeteer');


(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 250,
        args: [`--window-size=1600,1200`],
        defaultViewport: null
    });
    const page = await browser.newPage();
    await page.goto('https://www.fit.vut.cz/study/courses/');
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    let root = await page.evaluate(() => {

        /*
        * boxsource.js - transforms a rendered DOM tree to a BOX tree expected by FITLayout.
        * (c) 2015-2020 Radek Burget <burgetr@fit.vutbr.cz>
        */
        class BoxSource {

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

        // This code runs in the browser
        var bs = new BoxSource(document, document.documentElement);
        var ret = bs.getBoxTree();
        //window.xxx = ret;
        return ret;
        
    });

    await browser.close();
    
    console.log(root);

})();
