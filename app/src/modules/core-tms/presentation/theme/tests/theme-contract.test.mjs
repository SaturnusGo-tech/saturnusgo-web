import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import postcss from 'postcss';

const reference = JSON.parse(await readFile(new URL('../reference/chatgpt-colors.json', import.meta.url)));
const css = await readFile(new URL('../falcon-theme.css', import.meta.url), 'utf8');
const rules = postcss.parse(css);

test('both Falcon themes retain every captured role and are scoped to Falcon routes and body portals', () => {
  for (const mode of ['light', 'dark']) {
    const selector = mode === 'dark' ? 'html.dark:has([data-falcon-shell])' : 'html:has([data-falcon-shell])';
    const rule = rules.nodes.find(node => node.selector === selector);
    assert.ok(rule, `${mode} must be scoped at the document for body portals`);
    const values = Object.fromEntries(rule.nodes.filter(node => node.type === 'decl').map(node => [node.prop, node.value]));
    for (const [name, value] of Object.entries(reference.themes[mode])) assert.equal(values[name], value, `${mode}: ${name}`);
    assert.equal(values['color-scheme'], mode);
  }
  assert.ok(!rules.nodes.some(node => node.selector === ':root' || node.selector === '.dark'));
});

function luminance(hex) {
  const n = hex.slice(1); const text = n.length === 3 ? [...n].map(c => c + c).join('') : n;
  const rgb = text.slice(0, 6).match(/../g).map(c => parseInt(c, 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
  return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
}
function contrast(a, b) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }

test('neutral controls and readable body text keep AA contrast in both themes', () => {
  for (const values of Object.values(reference.themes)) {
    for (const role of ['text', 'text-secondary', 'text-muted']) for (const surface of ['surface', 'elevated', 'control']) {
      assert.ok(contrast(values[`--falcon-${role}`], values[`--falcon-${surface}`]) >= 4.5, `${role} on ${surface}`);
    }
    for (const role of ['action', 'action-hover', 'action-active']) assert.ok(contrast(values[`--falcon-${role}`], values['--falcon-on-action']) >= 4.5, role);
    for (const role of ['success', 'danger', 'warning', 'caution', 'info', 'discovery']) {
      const ink = values[`--falcon-${role}-on-solid`], solid = values[`--falcon-${role}-solid`];
      if (/^#/.test(ink) && /^#/.test(solid)) assert.ok(contrast(ink, solid) >= 4.5, `${role} solid`);
    }
  }
});

test('legacy aliases reference semantic roles instead of creating another palette', async () => {
  const aliases = await readFile(new URL('../compatibility.css', import.meta.url), 'utf8');
  assert.ok(aliases.includes('--tms-bg-canvas: var(--falcon-surface)'));
  assert.ok(aliases.includes('--action-foreground: var(--falcon-on-action)'));
  assert.ok(!/#[\da-f]{3,8}\b|(?:rgb|hsl|oklch)\(/i.test(aliases));
});
