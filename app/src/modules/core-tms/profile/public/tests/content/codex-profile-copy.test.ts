import assert from 'node:assert/strict';
import test from 'node:test';
import { codexProfileCopy } from '../../content/codex-profile-copy';
test('Codex introduces itself and explains QA work in structured EN/RU Markdown without invented outcomes',()=>{
 const en=codexProfileCopy(false),ru=codexProfileCopy(true);
 for(const copy of [en,ru]){
  assert.ok(copy.bio.length>700&&copy.bio.length<2000);
  assert.equal(copy.bio.split('\n').filter(line=>line.startsWith('- **')).length,6);
  assert.equal(copy.bio.split('\n').filter(line=>line.startsWith('### ')).length,3);
  assert.ok(copy.bio.split('\n\n').length>=4);
  assert.doesNotMatch(copy.bio,/\d+\s*(?:tests|checks|awards|кейсов|наград)/i);
 }
 assert.match(en.bio,/^Hi, I’m \*\*Codex\*\*/);assert.match(ru.bio,/^Привет, я \*\*Codex\*\*/);
 assert.doesNotMatch(en.bio,/Codex is OpenAI/);assert.doesNotMatch(ru.bio,/Codex — AI-агент OpenAI/);
 assert.match(en.bio,/requirements/);assert.match(en.bio,/attachments and code/);
 assert.match(en.bio,/diagrams/);assert.match(en.bio,/execution is authorized/);assert.match(en.bio,/Preparing a run/);
 assert.match(en.bio,/validate imports and export/);assert.match(ru.bio,/требования/);assert.match(ru.bio,/диаграмм/);
 assert.match(ru.bio,/Подготовка прогона/);assert.match(ru.bio,/выполнение разрешено/);assert.match(ru.bio,/импорта и экспортирую/);
});
