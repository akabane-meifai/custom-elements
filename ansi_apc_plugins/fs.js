(function(){
if(typeof HTMLAnsiElement != "function"){
	return;
}
const plugin = {
	apc(ctx, data, proxy){
		if(data == "fs"){
			return null;
		}
		if(data.startsWith("fs-")){
			return data.slice(3);
		}
		return ctx;
	},
	render(ctx, span, proxy){
		if(ctx != null){
			span.setAttribute("data-fs", ctx);
		}
		return (ctx != null);
	},
	dispose(ctx, proxy){
		return;
	},
	styleSheet: new CSSStyleSheet()
};
HTMLAnsiElement.install("fs", plugin);
plugin.styleSheet.replaceSync(`
[data-fs="sm"]{ font-size: .75rem; }
[data-fs="md"]{ font-size: 1rem; }
[data-fs="lg"]{ font-size: 1.25rem; }
[data-fs="xl"]{ font-size: 1.5rem; }
`);
})();