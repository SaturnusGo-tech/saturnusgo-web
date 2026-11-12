const modules='/Users/mercuryrucks/.codex/worktrees/falcon-oauth-reconnect-gateway/falcon-reactflow-docs/node_modules';
const esbuild=require(modules+'/esbuild');
const postcss=require(modules+'/postcss');
const tailwind=require(modules+'/@tailwindcss/postcss/dist/index.js');
const fs=require('node:fs');
async function build(){
  const source=`@layer theme, utilities;
@import "${modules}/tailwindcss/theme.css" layer(theme);
@import "${modules}/tailwindcss/utilities.css" layer(utilities);
@source "./vendor";
@theme inline {
 --color-background: var(--film-panel);
 --color-foreground: var(--film-text);
 --color-primary: var(--film-secondary);
 --color-primary-foreground: var(--film-on-action);
 --color-border: var(--film-border);
 --color-accent: var(--film-elevated);
}`;
  const css=await postcss([tailwind({base:__dirname})]).process(source,{from:__dirname+'/vendor-input.css'});
  fs.writeFileSync(__dirname+'/vendor-utilities.css',css.css);
  esbuild.buildSync({entryPoints:[__dirname+'/main.jsx'],bundle:true,outfile:__dirname+'/app.js',loader:{'.woff2':'file'},nodePaths:[modules],external:["/Geist.woff2","/reference-grid.png"],sourcemap:true,minify:false});
}
build().catch(error=>{console.error(error);process.exitCode=1});
