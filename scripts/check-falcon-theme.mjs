import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
import values from 'postcss-value-parser';

const roots = ['app/src/modules/core-tms', 'app/src/modules/core-falcon-public'];
const foundation = 'app/src/modules/core-tms/presentation/theme/falcon-theme.css';
const exceptions = JSON.parse(await readFile('scripts/falcon-theme-exceptions.json', 'utf8'));
const failures = [], usedExceptions = new Set(), definitions = new Set(), references = [];
async function files(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat();
}
const candidates = (await Promise.all(roots.map(files))).flat().filter(file => /\.(css|tsx?)$/.test(file) && !/\/tests?\//.test(file));
for (const file of candidates) {
  const text = await readFile(file, 'utf8');
  for (const match of text.matchAll(/(--falcon-[\w-]+)\s*:/g)) definitions.add(match[1]);
  for (const match of text.matchAll(/var\((--falcon-[\w-]+)/g)) references.push({ file, token: match[1] });
  if (!file.endsWith('.css') || file === foundation) continue;
  const ast = postcss.parse(text, { from: file });
  ast.walkRules(rule => {
    const declarations = Object.fromEntries((rule.nodes ?? []).filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
    const background = declarations.background ?? declarations['background-color'] ?? '';
    const foreground = declarations.color ?? '';
    if (/^var\(--(?:falcon-action(?:-hover|-active)?|action|teal(?:-dark)?|yt-primary(?:-hover)?|plugin-action|catalog-action)\)$/.test(background)
      && /^var\(--(?:falcon-text(?:-secondary|-muted)?|ink|plugin-text|catalog-text)\)$/.test(foreground)) failures.push(`${file}:${rule.source.start.line} ${rule.selector}: primary action needs inverse foreground`);
  });
  ast.walkDecls(decl => {
    if (/\b\d+(?:px|rem|em)\s+var\(--falcon-shadow(?:-popover)?\)/.test(decl.value)) failures.push(`${file}:${decl.source.start.line} full shadow token used as a paint`);
    const paints = [];
    values(decl.value).walk(node => {
      if (node.type === 'function' && node.value === 'url') return false;
      if (node.type === 'word' && (/^#[\da-f]{3,8}$/i.test(node.value) || /^(white|black|blue|green|red|purple|orange|yellow|gray|grey)$/i.test(node.value))) paints.push(node.value);
      if (node.type === 'function' && /^(?:rgba?|hsla?|oklch|oklab|lab|lch|color)$/i.test(node.value) && !values.stringify(node.nodes).includes('var(')) { paints.push(values.stringify(node)); return false; }
    });
    if (!paints.length) return;
    const key = `${file}::${decl.parent.selector}::${decl.prop}`;
    const allowed = exceptions[key];
    if (allowed && paints.every(paint => allowed.values.includes(paint))) usedExceptions.add(key);
    else failures.push(`${file}:${decl.source.start.line} ${decl.parent.selector} ${decl.prop}: ${paints.join(', ')}`);
  });
}
for (const { file, token } of references) if (!definitions.has(token)) failures.push(`${file}: undefined ${token}`);
for (const key of Object.keys(exceptions)) if (!usedExceptions.has(key)) failures.push(`Unused color exception: ${key}`);
if (failures.length) {
  console.error(failures.join('\n'));
  console.error(`Falcon theme check failed: ${failures.length} issue(s).`);
  process.exitCode = 1;
} else console.log(`Falcon theme check passed: ${candidates.filter(file => file.endsWith('.css')).length} stylesheets, ${definitions.size} defined roles, ${usedExceptions.size} documented content exceptions.`);
