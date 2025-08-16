(function(){
if(typeof HTMLAnsiElement != "function"){
	return;
}
const plugin = {
	apc(ctx, data, proxy){
		if(data == "block"){
			const res = Array.isArray(ctx) ? ctx : [];
			const block = (document.contentType == "text/html") ? document.createElement("div") : document.createElementNS("http://www.w3.org/1999/xhtml", "div");
			const {caret, backgroundColor} = proxy;
			if(backgroundColor != null){
				block.setAttribute("data-b" + backgroundColor.attr, backgroundColor.value);
			}
			caret.insertNode(block);
			caret.selectNodeContents(block);
			res.push(block);
			return res;
		}
		if(data == "endblock"){
			if(Array.isArray(ctx) && (ctx.length > 0)){
				const block = ctx.pop();
				const caret = proxy.caret;
				caret.selectNode(block);
				caret.collapse(false);
			}
			return ctx;
		}
		return ctx;
	},
	dispose(ctx, proxy){
		if(Array.isArray(ctx) && (ctx.length > 0)){
			const block = ctx.at(0);
			const caret = proxy.caret;
			caret.selectNode(block);
			caret.collapse(false);
		}
		return;
	}
};
HTMLAnsiElement.install("block", plugin);
})();