/** Reproducible static packaging for the landing, separate from review tooling. */
const path=require('node:path');
const fs=require('node:fs');
const productRoot='/Users/mercuryrucks/.codex/worktrees/falcon-oauth-reconnect-gateway/falcon-reactflow-docs';
const modules=path.join(productRoot,'node_modules');
const esbuild=require(path.join(modules,'esbuild'));
const destination=path.join(productRoot,'public/falcon/landing/command-center-film');
fs.mkdirSync(destination,{recursive:true});
const assets=['Geist.woff2','reference-grid.png','falcon.svg','codex.png'];
const assetPattern=/(["'])\/(Geist\.woff2|reference-grid\.png|falcon\.svg|codex\.png)\1/g;
esbuild.buildSync({
 entryPoints:[path.join(__dirname,'main.jsx')],bundle:true,
 outfile:path.join(destination,'app.js'),nodePaths:[modules],
 external:['/Geist.woff2','/reference-grid.png'],
 minify:true,sourcemap:false,legalComments:'eof',define:{'process.env.NODE_ENV':'"production"'},
 plugins:[],
});
// Absolute asset URLs are retained in the standalone review build. Only the
// distributable is rewritten to local assets so it also works under a path.
for(const name of ['app.js','app.css']) {
 const target=path.join(destination,name);
 fs.writeFileSync(target,fs.readFileSync(target,'utf8').replace(assetPattern,(_all,quote,name)=>`${quote}./${name}${quote}`).replace(/url\(\/(Geist\.woff2|reference-grid\.png)\)/g,'url(./$1)'));
}
for(const name of assets)fs.copyFileSync(path.join(__dirname,name),path.join(destination,name));
fs.writeFileSync(path.join(destination,'bootstrap.js'),`const q=new URLSearchParams(location.search);document.documentElement.dataset.theme=q.get('theme')==='light'?'light':'dark';document.documentElement.lang=q.get('lang')==='ru'?'ru':'en';`);
fs.writeFileSync(path.join(destination,'index.html'),`<!doctype html>
<html lang="en" data-embedded="true"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Codex × Falcon</title>
<script src="./bootstrap.js"></script>
<link rel="stylesheet" href="./app.css"></head><body><div id="root"></div><script src="./app.js"></script></body></html>\n`);
fs.writeFileSync(path.join(destination,'THIRD_PARTY_NOTICES.txt'),[
 'Falcon × Codex landing film. UI runtime dependencies retain their original licenses.',
 ...['ReactBits-LICENSE.md','MagicUI-LICENSE.md','motion-primitives-LICENSE.txt'].map(name=>`\n--- ${name} ---\n${fs.readFileSync(path.join(__dirname,'vendor',name),'utf8')}`)
].join('\n'));
console.log(`Packaged ${destination}`);
console.log(fs.readdirSync(destination).map(name=>`${name}: ${fs.statSync(path.join(destination,name)).size} bytes`).join('\n'));
