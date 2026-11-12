import { ImportSourceError } from "../import-source-error";
import { TEST_CASE_IMPORT_LIMIT } from "../../../model/test-case-exchange";
type SourceObject = Record<string, unknown>;
function invalid(): never { throw new ImportSourceError("IMPORT_INVALID_PROVIDER"); }
const object = (value: unknown): SourceObject => value && typeof value === "object" && !Array.isArray(value) ? value as SourceObject : invalid();
const text = (value: unknown): string => typeof value === "string" && value.trim() ? value : invalid();
const objects = (value: unknown): SourceObject[] => Array.isArray(value) ? value.map(object) : invalid();
function index(values: SourceObject[]): Map<string, SourceObject> {
  const result = new Map<string, SourceObject>();
  for (const item of values) { const id = text(item.id); if (result.has(id)) invalid(); result.set(id, item); }
  return result;
}
function ordered(values: SourceObject[]): SourceObject[] {
  for (const item of values) if (item.pos !== undefined && (typeof item.pos !== "number" || !Number.isFinite(item.pos))) invalid();
  const positioned = values.filter(item => item.pos !== undefined).length;
  if (positioned && positioned !== values.length) invalid();
  if (!positioned) return [...values];
  return values.map((value, i) => ({ value, i })).sort((a, b) =>
    (a.value.pos as number) - (b.value.pos as number) || a.i - b.i).map(item => item.value);
}
function component(value: unknown): string {
  const source = text(value); const name = source.trim().replace(/\//g, "／").replace(/\\/g, "＼");
  if (name.length > 120 || /\p{Cc}/u.test(name)) invalid();
  return name === "." || name === ".." ? name.replace(/\./g, "．") : name;
}

export function adaptTrelloBoard(board: SourceObject): unknown {
  const cards = objects(board.cards); const lists = index(objects(board.lists)); const checklists = index(objects(board.checklists));
  const cardIndex = index(cards); const boardName = component(board.name); const boardId = text(board.id);
  if (!cards.length) throw new ImportSourceError("IMPORT_NO_RECORDS");
  if (cards.length > TEST_CASE_IMPORT_LIMIT) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
  const folderNames = new Set<string>();
  for (const list of lists.values()) { const name = component(list.name); if (folderNames.has(name)) invalid(); folderNames.add(name); }
  for (const checklist of checklists.values()) {
    if (!cardIndex.has(text(checklist.idCard))) invalid();
    if (checklist.idBoard !== undefined && checklist.idBoard !== boardId) invalid();
  }
  const cases = cards.map(card => {
    const id = text(card.id); const title = text(card.name); const list = lists.get(text(card.idList));
    if (!list || (card.idBoard !== undefined && card.idBoard !== boardId)) invalid();
    if (card.desc !== undefined && typeof card.desc !== "string") invalid();
    const linked = [...checklists.values()].filter(checklist => checklist.idCard === id);
    if (card.idChecklists !== undefined) {
      if (!Array.isArray(card.idChecklists)) invalid();
      const referenced = new Set<string>();
      for (const ref of card.idChecklists) {
        const refId = text(ref); const checklist = checklists.get(refId);
        if (referenced.has(refId) || !checklist || checklist.idCard !== id) invalid(); referenced.add(refId);
      }
    }
    const items = ordered(linked).flatMap(checklist => ordered(objects(checklist.checkItems)));
    if (items.length > 500) throw new ImportSourceError("IMPORT_LIMIT_EXCEEDED");
    const checklist = items.map((item, i) => ({ order: i + 1, text: text(item.name), required: true }));
    const folderPath = `/${boardName}/${component(list.name)}`;
    return { sourceKey: id, title, description: card.desc ?? "", folderPath,
      type: checklist.length ? "checklist" : "manual", checklist,
      testData: JSON.stringify({ provider: "trello", board: { id: board.id, name: board.name, desc: board.desc, closed: board.closed, url: board.url }, list, card, checklists: linked }) };
  });
  return { provider: "trello", cases };
}
