class HTMLAnsiElement extends HTMLElement{
	constructor() {
		super();
	}
	connectedCallback(){
		const shadow = this.shadow = this.attachShadow({mode: "closed"});
		const ansi = this.ansi = (document.contentType == "text/html") ? document.createElement("span") : document.createElementNS("http://www.w3.org/1999/xhtml", "span");
		ansi.classList.add("ansi");
		shadow.adoptedStyleSheets.push(this.constructor.styleSheet);
		shadow.appendChild(this.ansi = ansi);
		this.constructor.observer.observe(this, {
			characterData: true,
			childList: true,
			subtree: true
		});
		this.addEventListener("copy", e => {
			e.clipboardData.setData("text/plain", this.selectionText);
			e.preventDefault();
		});
	}
	static srg = {
		["0"](ctx){ Object.assign(ctx, {textColor: null, backgroundColor: null, bold: false, italic: false, underline: false, strike: false}); },
		["7"](ctx){
			const {textColor, backgroundColor} = ctx;
			ctx.textColor = backgroundColor;
			ctx.backgroundColor = textColor;
		},
		["1"](ctx){ ctx.bold = true; },
		["3"](ctx){ ctx.italic = true; },
		["4"](ctx){ ctx.underline = true; },
		["9"](ctx){ ctx.strike = true; },
		["22"](ctx){ ctx.bold = false; },
		["23"](ctx){ ctx.italic = false; },
		["24"](ctx){ ctx.underline = false; },
		["29"](ctx){ ctx.strike = false; },
		["30"](ctx){ ctx.textColor = {attr: "c", value: "0"}; },
		["31"](ctx){ ctx.textColor = {attr: "c", value: "1"}; },
		["32"](ctx){ ctx.textColor = {attr: "c", value: "2"}; },
		["33"](ctx){ ctx.textColor = {attr: "c", value: "3"}; },
		["34"](ctx){ ctx.textColor = {attr: "c", value: "4"}; },
		["35"](ctx){ ctx.textColor = {attr: "c", value: "5"}; },
		["36"](ctx){ ctx.textColor = {attr: "c", value: "6"}; },
		["37"](ctx){ ctx.textColor = {attr: "c", value: "7"}; },
		["90"](ctx){ ctx.textColor = {attr: "c", value: "8"}; },
		["91"](ctx){ ctx.textColor = {attr: "c", value: "9"}; },
		["92"](ctx){ ctx.textColor = {attr: "c", value: "10"}; },
		["93"](ctx){ ctx.textColor = {attr: "c", value: "11"}; },
		["94"](ctx){ ctx.textColor = {attr: "c", value: "12"}; },
		["95"](ctx){ ctx.textColor = {attr: "c", value: "13"}; },
		["96"](ctx){ ctx.textColor = {attr: "c", value: "14"}; },
		["97"](ctx){ ctx.textColor = {attr: "c", value: "15"}; },
		["38"]: {
			["2"](ctx, values){ ctx.textColor = {attr: "rgb", value: "#" + values.map(v => Number(v).toString(16).padStart(2, "0")).join("")}; },
			["5"](ctx, values){ ctx.textColor = {attr: "c", value: values.at(0)}; }
		},
		["39"](ctx){ ctx.textColor = null; },
		["40"](ctx){ ctx.backgroundColor = {attr: "c", value: "0"}; },
		["41"](ctx){ ctx.backgroundColor = {attr: "c", value: "1"}; },
		["42"](ctx){ ctx.backgroundColor = {attr: "c", value: "2"}; },
		["43"](ctx){ ctx.backgroundColor = {attr: "c", value: "3"}; },
		["44"](ctx){ ctx.backgroundColor = {attr: "c", value: "4"}; },
		["45"](ctx){ ctx.backgroundColor = {attr: "c", value: "5"}; },
		["46"](ctx){ ctx.backgroundColor = {attr: "c", value: "6"}; },
		["47"](ctx){ ctx.backgroundColor = {attr: "c", value: "7"}; },
		["100"](ctx){ ctx.backgroundColor = {attr: "c", value: "8"}; },
		["101"](ctx){ ctx.backgroundColor = {attr: "c", value: "9"}; },
		["102"](ctx){ ctx.backgroundColor = {attr: "c", value: "10"}; },
		["103"](ctx){ ctx.backgroundColor = {attr: "c", value: "11"}; },
		["104"](ctx){ ctx.backgroundColor = {attr: "c", value: "12"}; },
		["105"](ctx){ ctx.backgroundColor = {attr: "c", value: "13"}; },
		["106"](ctx){ ctx.backgroundColor = {attr: "c", value: "14"}; },
		["107"](ctx){ ctx.backgroundColor = {attr: "c", value: "15"}; },
		["48"]: {
			["2"](ctx, values){ ctx.backgroundColor = {attr: "rgb", value: "#" + values.map(v => Number(v).toString(16).padStart(2, "0")).join("")}; },
			["5"](ctx, values){ ctx.backgroundColor = {attr: "c", value: values.at(0)}; }
		},
		["49"](ctx){ ctx.backgroundColor = null; }
	};
	render(){
		this.ansi.innerHTML = "";
		const ctx = {
			echo: true,
			textColor: null,
			backgroundColor: null,
			bold: false,
			italic: false,
			underline: false,
			strike: false
		};
		const srg = this.constructor.srg;
		const it = {
			*[Symbol.iterator](){
				const matches = this.str.matchAll(/(?:(?:\x9B|\x1B\[)[0-9;?]*[ -\/]*[@-~]|\x1B[\]PX^_].*?(?:\x07|\x1B\\))+/g);
				let current = 0;
				for(let match of matches){
					const escData = {
						index: match.index,
						length: match.at(0).length,
						items: match.at(0).split(/(?=(?:\x9B|\x1B\[)[0-9;?]*[ -\/]*[@-~]|\x1B[\]PX^_].*?(?:\x07|\x1B\\))/)
					};
					if(current < escData.index){
						yield this.str.slice(current, escData.index);
					}
					current = escData.index + escData.length
					if(escData.items.length > 0){
						yield escData.items.map(item => {
							if(item.startsWith("\x9B")){
								return {
									type: "CSI",
									opcode: item.slice(-1),
									params: item.slice(1, -1).split(";")
								};
							}
							const ch = item.charAt(1);
							if(ch == "["){
								return {
									type: "CSI",
									opcode: item.slice(-1),
									params: item.slice(2, -1).split(";")
								};
							}
							const ei = item.endsWith("\x07") ? -1 : -2;
							if(ch == "]"){
								return {
									type: "OCS",
									data: item.slice(2, ei)
								};
							}
							if(ch == "P"){
								return {
									type: "DCS",
									data: item.slice(2, ei)
								};
							}
							if(ch == "^"){
								return {
									type: "PM",
									data: item.slice(2, ei)
								};
							}
							if(ch == "_"){
								return {
									type: "APC",
									data: item.slice(2, ei)
								};
							}
							return {type: "UNKNOWN"};
						});
					}
				}
				const str = this.str.slice(current);
				if(str != ""){
					yield str;
				}
			},
			str: this.textContent
		}
		const opr = esc => {
			if(esc.type == "CSI"){
				if(esc.opcode == "J"){
					if(esc.opcode.at(0) == "2"){
						ansi.innerHTML = "";
					}
					return;
				}
				if(esc.opcode == "m"){
					const param1 = esc.params.shift();
					const csi = srg[param1];
					if(csi == null){
						return;
					}
					if(typeof csi == "function"){
						csi(ctx);
						return;
					}
					const param2 = esc.params.shift();
					csi[param2](ctx, esc.params);
					return;
				}
			}
		};
		for(let token of it){
			if(Array.isArray(token)){
				token.forEach(opr);
				continue;
			}
			const str = token;
			const span = (document.contentType == "text/html") ? document.createElement("span") : document.createElementNS("http://www.w3.org/1999/xhtml", "span");
			let plain = true;
			span.textContent = str;
			if(ctx.textColor != null){
				plain = false;
				span.setAttribute("data-t" + ctx.textColor.attr, ctx.textColor.value);
			}
			if(ctx.backgroundColor != null){
				plain = false;
				span.setAttribute("data-b" + ctx.backgroundColor.attr, ctx.backgroundColor.value);
			}
			if(ctx.bold){
				plain = false;
				span.classList.add("bold");
			}
			if(ctx.italic){
				plain = false;
				span.classList.add("italic");
			}
			if(ctx.underline){
				plain = false;
				span.classList.add("underline");
			}
			if(ctx.strike){
				plain = false;
				span.classList.add("strike");
			}
			this.ansi.append(plain ? span.textContent : span);
		}
	}
	disconnectedCallback() {
		this.constructor.observer.disconnect(this);
	}
	get textIndex(){
		const res = [];
		const text = this.textContent;
		const matches = text.matchAll(/(?:(?:\x9B|\x1B\[)[0-9;?]*[ -\/]*[@-~]|\x1B[\]PX^_].*?(?:\x07|\x1B\\))+/g);
		let pos = 0;
		for(let match of matches){
			for(let i = pos; i <= match.index; i++){
				res.push(i);
			}
			pos = match.index + match.at(0).length + 1;
		}
		for(let i = pos; i < text.length; i++){
			res.push(i);
		}
		return res;
	}
	get selectionIndex(){
		const selection = this.shadow.getSelection();
		if(selection.rangeCount != 1){
			return null;
		}
		const range = selection.getRangeAt(0);
		const preRange = new Range();
		preRange.setStart(this.ansi, 0);
		preRange.setEnd(range.startContainer, range.startOffset);
		if(preRange.startContainer != this.ansi){
			return null;
		}
		const start = preRange.toString().length;
		const end = start + range.toString().length;
		return {start, end};
	}
	get selectionText(){
		const idx = this.selectionIndex;
		if(idx == null){
			return "";
		}
		return this.sliceText(idx.start, idx.end);
	}
	sliceText(...args){
		return this.textContent.slice(...args.map(function(i){return this.at(i);}, this.textIndex));
	}
	static observer = new MutationObserver(function(mutationList, observer){
		const elements = new Set(Array.from(
			mutationList,
			record => {
				if(record.type == "characterData"){
					return record.target.parentNode;
				}
				if(record.type == "childList"){
					return record.target;
				}
				return null;
			}
		).filter(item => (item != null) && ("render" in item)));
		for(let element of elements){
			element.render();
		}
	});
	static styleSheet = new CSSStyleSheet();
}
(function(){
customElements.define("ansi-span", class extends HTMLAnsiElement{});
customElements.define("ansi-div", class extends HTMLAnsiElement{});

const customStyleSheet = new CSSStyleSheet();
const it = {length: 256};
const levels = ["00", "5f", "87", "af", "d7", "ff"];
const cssVars = Array.from(it, (_, i) => `--selection-color${i}: rgb(from var(--basic-color${i}) calc(255 - r) calc(255 - g) calc(255 - b));`).join("\n");
const rgbVars = levels.flatMap((r, i) => levels.flatMap((g, j) => levels.map((b, k) => `--basic-color${i * 36 + j * 6 + k + 16}: #${r}${g}${b};`))).join("\n");
const grayVars = Array.from({length: 24}, (_, i) => {
	const gray = (8 + i * 10).toString(16).padStart(2, "0");
	return `--basic-color${i + 232}: #${gray}${gray}${gray};`;
}).join("\n");
const cssColors = Array.from(it, (_, i) => `
.ansi [data-tc="${i}"]{ color: var(--basic-color${i}); }
.ansi [data-tc="${i}"]::selection{ color: var(--selection-color${i}); }
.ansi [data-bc="${i}"]{ background: var(--basic-color${i}); }
.ansi [data-bc="${i}"]::selection{ background: var(--selection-color${i}); }
`).join("\n");
document.adoptedStyleSheets.push(customStyleSheet);
customStyleSheet.replaceSync(`ansi-span{display: inline;}
ansi-div{display: block;}`);
HTMLAnsiElement.styleSheet.replaceSync(`.ansi{
	display: contents;
	white-space: pre-wrap;
	--basic-color0: #0c0c0c;
	--basic-color1: #c50f1f;
	--basic-color2: #13a10e;
	--basic-color3: #c19c00;
	--basic-color4: #0037da;
	--basic-color5: #881798;
	--basic-color6: #3a96dd;
	--basic-color7: #cccccc;
	--basic-color8: #767676;
	--basic-color9: #e74856;
	--basic-color10: #16c60c;
	--basic-color11: #f9f1a5;
	--basic-color12: #3b78ff;
	--basic-color13: #b4009e;
	--basic-color14: #61d6d6;
	--basic-color15: #f1f1f1;
	${rgbVars}
	${grayVars}
	${cssVars}
}
.ansi .bold{font-weight: bold;}
.ansi .italic{font-style: italic;}
.ansi .underline{text-decoration: underline;}
.ansi .strike{text-decoration: line-through;}
.ansi .underline.strike{text-decoration: underline line-through;}
.ansi [data-trgb]{ color: attr(data-trgb type(<color>)); }
.ansi [data-brgb]{ background: attr(data-brgb type(<color>)); }
${cssColors}
`);
})();