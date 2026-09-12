import { tokenizeCaseQuery, type QueryToken } from "./lexer/tokens";
import { fieldAliases, normalizeQueryText, type CaseQlField } from "./vocabulary/fields";
export type CaseQlTerm = { field: CaseQlField; value: string; exclude: boolean; exact?: boolean };
export type CaseQueryNode = { kind: "term"; term: CaseQlTerm } | { kind: "and"; left: CaseQueryNode; right: CaseQueryNode } | { kind: "or"; left: CaseQueryNode; right: CaseQueryNode } | { kind: "not"; child: CaseQueryNode };
export type CaseQueryResult = { root: CaseQueryNode | null; terms: CaseQlTerm[]; error?: string };
const word = (token?: QueryToken) => token?.quoted ? "" : normalizeQueryText(token?.value);
const and = (token?: QueryToken) => ["and", "и", "&&"].includes(word(token));
const or = (token?: QueryToken) => ["or", "или", "||"].includes(word(token));
const not = (token?: QueryToken) => ["not", "не", "!", "-"].includes(word(token));
export function parseCaseQuery(source: string): CaseQueryResult {
 if (source.length > 4000) return { root: null, terms: [], error: "length" };
 const scanned = tokenizeCaseQuery(source); const tokens = scanned.tokens;
 if (scanned.error) return { root: null, terms: [], error: scanned.error };
 let index = 0; let depth = 0; const terms: CaseQlTerm[] = [];
 const atom = (): CaseQueryNode => {
  if (++depth > 30) throw new Error("depth");
  let result: CaseQueryNode;
  if (not(tokens[index])) { index++; result = { kind: "not", child: atom() }; }
  else if (tokens[index]?.value === "(") {
   index++; result = expression(); if (tokens[index++]?.value !== ")") throw new Error("parenthesis");
  } else {
   const first = tokens[index++];
   if (!first || [")", ",", ":", "=", "~"].includes(word(first)) || and(first) || or(first)) throw new Error("value");
   const field = !first.quoted ? fieldAliases[normalizeQueryText(first.value)] : undefined;
   const op = word(tokens[index]); const qualified = [":", "=", "==", "!=", "~"].includes(op) || Boolean(field && ["in", "в"].includes(op));
   if (!qualified) {
    let phrase = first.value;
    while (!first.quoted && tokens[index] && !tokens[index].quoted && !and(tokens[index]) && !or(tokens[index]) && !not(tokens[index])
      && !["(", ")", ",", ":", "=", "==", "!=", "~"].includes(word(tokens[index]))
      && ![":", "=", "==", "!=", "~"].includes(word(tokens[index + 1]))
      && !(fieldAliases[word(tokens[index])] && ["in", "в"].includes(word(tokens[index + 1])))) phrase += ` ${tokens[index++].value}`;
    result = term("text", phrase);
   }
   else if (!field) throw new Error("field");
   else {
    index++; const exact = ["=", "==", "!=", "in", "в"].includes(op);
    if (["in", "в"].includes(op) || tokens[index]?.value === "(") {
     if (tokens[index++]?.value !== "(") throw new Error("parenthesis");
     result = term(field, value(), exact);
     while (tokens[index]?.value === "," || or(tokens[index])) { index++; result = { kind: "or", left: result, right: term(field, value(), exact) }; }
     if (tokens[index++]?.value !== ")") throw new Error("parenthesis");
    } else result = term(field, value(), exact);
    if (op === "!=") result = { kind: "not", child: result };
   }
  }
  depth--; return result;
 };
 const value = () => {
  const token = tokens[index++];
  if (!token || !token.value.trim() || (!token.quoted && (["(", ")", ",", ":", "=", "!=", "~"].includes(token.value) || and(token) || or(token)))) throw new Error("value");
  return token.value;
 };
 const term = (field: CaseQlField, value: string, exact = false): CaseQueryNode => {
  const entry: CaseQlTerm = { field, value, exclude: false, ...(exact ? { exact: true } : {}) };
  terms.push(entry); return { kind: "term", term: entry };
 };
 const conjunction = (): CaseQueryNode => {
  let left = atom();
  while (index < tokens.length && tokens[index].value !== ")" && !or(tokens[index])) {
   if (and(tokens[index])) index++;
   left = { kind: "and", left, right: atom() };
  }
  return left;
 };
 const expression = (): CaseQueryNode => {
  let left = conjunction();
  while (or(tokens[index])) { index++; left = { kind: "or", left, right: conjunction() }; }
  return left;
 };
 try {
  if (!tokens.length) return { root: null, terms: [] };
  const root = expression(); if (index !== tokens.length) throw new Error("parenthesis");
  return { root, terms };
 } catch (error) { return { root: null, terms, error: error instanceof Error ? error.message : "syntax" }; }
}
export function parseCaseQlQuery(query: string): CaseQlTerm[] {
 const parsed = parseCaseQuery(query); if (parsed.error) return [];
 const flatten = (node: CaseQueryNode | null, exclude = false): CaseQlTerm[] => !node ? [] : node.kind === "term"
  ? [{ ...node.term, exclude }] : node.kind === "not" ? flatten(node.child, !exclude) : [...flatten(node.left, exclude), ...flatten(node.right, exclude)];
 return flatten(parsed.root);
}
