import assert from 'node:assert/strict';
import test from 'node:test';
import { codexProfileCopy } from '../../content/codex-profile-copy';
test('Codex about copy explains QA work in readable EN/RU Markdown without invented outcomes',()=>{
 const en=codexProfileCopy(false),ru=codexProfileCopy(true);
 for(const copy of [en,ru]){
  assert.ok(copy.bio.length>700&&copy.bio.length<2000);
  assert.equal(copy.bio.split('\n').filter(line=>line.startsWith('- ')).length,3);
  assert.ok(copy.bio.split('\n\n').length>=4);
  assert.doesNotMatch(copy.bio,/\d+\s*(?:tests|checks|awards|кейсов|наград)/i);
 }
 assert.match(en.bio,/OpenAI/);assert.match(en.bio,/requirements/);assert.match(en.bio,/attachments and code/);
 assert.match(en.bio,/diagrams/);assert.match(en.bio,/execution is authorized/);assert.match(en.bio,/Preparing a run/);
 assert.match(en.bio,/validating imports and exporting/);assert.match(ru.bio,/требования/);assert.match(ru.bio,/диаграмм/);
 assert.match(ru.bio,/Подготовка прогона/);assert.match(ru.bio,/разрешённом выполнении/);assert.match(ru.bio,/импорта и экспортировать/);
});
