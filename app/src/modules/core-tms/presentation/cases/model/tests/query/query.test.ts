import assert from "node:assert/strict";
import test from "node:test";
import type { TestCaseSummary } from "../../../../../../../core/tms/contracts/legacy-contract";
import { filterCaseRows } from "../../caseListModel";
import { parseCaseQuery } from "../../query/parse";
import { insertQuerySuggestion, querySuggestions } from "../../../toolbar/ql/suggestions/query-suggestions";
const people = [{ id: "u1", name: "Анна Берёзова", email: "anna@example.test" }, { id: "u2", name: "John Smith", email: "john@example.test" }];
const context = { members: new Map(people.map(person => [person.id, person])) };
const rows = [
 { id: "a", title: "Вход через почту", priority: "high", component: "Web client", ownerIdentityId: "u1", tags: ["smoke"], lifecycle: "ready" },
 { id: "b", title: "Sign in via phone", priority: "low", component: "Mobile", ownerIdentityId: "u2", tags: ["regression"], lifecycle: "draft" },
 { id: "c", title: "Возврат платежа", priority: "critical", component: "API", ownerIdentityId: null, tags: ["smoke", "billing"], lifecycle: "ready" },
].map(item => ({ folderPath: item.id === "c" ? "/Payments" : "/Auth", testCase: { key: `TC-${item.id}`, type: "manual", archivedAt: null, ...item } as TestCaseSummary }));
const ids = (qlQuery: string) => filterCaseRows(rows, { qlQuery, context }).map(row => row.testCase.id);

test("QL handles RU/EN values, whitespace, precedence, parentheses, exclusions and sets", () => {
 for (const query of ['ответственный: "Анна Березова"', 'owner: anna@example.test', 'assignee = "u1"', 'priority: высокий статус : готов', 'component: "Web client" -tag:regression']) assert.deepEqual(ids(query), ["a"], query);
 assert.deepEqual(ids('приоритет: (высокий, критический) И НЕ папка: /Payments'), ["a"]);
 assert.deepEqual(ids('priority IN ("high", "critical") AND status = ready'), ["a", "c"]);
 assert.deepEqual(ids('owner: "не назначен"'), ["c"]);
 assert.deepEqual(ids('owner != u1'), ["b", "c"]);
 assert.deepEqual(ids('tag:smoke OR tag:regression AND priority:low'), ["a", "b", "c"]);
 assert.deepEqual(ids('(tag:smoke OR tag:regression) AND priority:low'), ["b"]);
 assert.deepEqual(ids('НЕ (owner:u1 ИЛИ owner:u2)'), ["c"]);
 assert.deepEqual(ids('sign in'), ["b"]);
 assert.deepEqual(ids('тип: ручной теги: billing'), ["c"]);
});

test("normal search resolves names and emails; owner facets permit multiple people and unassigned", () => {
 assert.deepEqual(filterCaseRows(rows, { titleQuery: "березова", context }).map(row => row.testCase.id), ["a"]);
 assert.deepEqual(filterCaseRows(rows, { titleQuery: "JOHN@", context }).map(row => row.testCase.id), ["b"]);
 assert.deepEqual(filterCaseRows(rows, { facets: { folders: [], components: [], owners: ["u1", "unassigned"] }, context }).map(row => row.testCase.id), ["a", "c"]);
 assert.deepEqual(filterCaseRows(rows, { qlQuery: "owner:anna", context: { members: new Map() } }), []);
});

test("malformed queries fail closed with a specific hint instead of silently ignoring a condition", () => {
 for (const query of ['owner:', 'priority: "high', 'unknown:high', 'status:ready OR', '(tag:smoke', 'priority IN ()', 'priority: (high,,low)', 'x'.repeat(4001)]) {
  assert.ok(parseCaseQuery(query).error, query); assert.deepEqual(ids(query), [], query);
 }
});

test("autocomplete edits at the caret without deleting following predicates and accepts RU field names", () => {
 const options = { ru: true, folders: ["/Auth"], components: ["Web client"], members: people, tags: ["smoke"] };
 const query = 'ответственный: анна AND priority:high';
 const result = querySuggestions(query, query.indexOf(' AND'), options);
 assert.equal(result.suggestions[0].label, "Анна Берёзова");
 const next = insertQuerySuggestion(query, result, result.suggestions[0]);
 assert.equal(next.query, 'ответственный: "anna@example.test" AND priority:high');
 assert.deepEqual(ids(next.query), ["a"]);
 const empty = querySuggestions('статус: ', 8, options); assert.equal(empty.suggestions.length, 4);
 const quoted = querySuggestions('component: "Web', 15, options); assert.equal(quoted.suggestions[0].value, "Web client");
 const field = querySuggestions('испол', 5, options); assert.equal(field.suggestions[0].value, "owner");
});

test("large repository queries keep every match and do not use dynamic regular expressions", () => {
 const large = Array.from({ length: 10000 }, (_, i) => rows[i % rows.length]);
 const start = performance.now();
 const matches = filterCaseRows(large, { qlQuery: 'owner: "Анна Берёзова" OR (status:ready AND tag:billing)', context });
 assert.equal(matches.length, 6667);
 assert.ok(performance.now() - start < 2000, "10k cases must filter within a bounded local CPU budget");
 assert.deepEqual(ids('title:"(a+)+$"'), []);
});
