import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { test } from "node:test";
import ts from "typescript";

const primitives = new Set(["Select", "Autocomplete", "Dropdown", "Popover", "FreeSoloPopover"]);
const root = resolve("app/src");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return ["tests", "generated"].includes(entry.name) ? [] : sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name) ? [path] : [];
  });
}

function instant(attributes: ts.JsxAttributes): boolean {
  return attributes.properties.some(property => {
    if (!ts.isJsxAttribute(property) || property.name.getText() !== "disableAnimation") return false;
    if (!property.initializer) return true;
    return ts.isJsxExpression(property.initializer) && property.initializer.expression?.kind === ts.SyntaxKind.TrueKeyword;
  });
}

test("positioned SDK menus use the shared motion boundary unless explicitly instant", () => {
  const violations: string[] = [];
  for (const file of sourceFiles(root)) {
    if (file.includes("/shared/components/anchored-popup/")) continue;
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const aliases = new Map<string, string>();
    const namespaces = new Set<string>();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      if (!statement.moduleSpecifier.text.startsWith("@heroui/")) continue;
      const binding = statement.importClause?.namedBindings;
      if (binding && ts.isNamedImports(binding)) {
        for (const item of binding.elements) {
          const name = (item.propertyName ?? item.name).text;
          if (primitives.has(name)) aliases.set(item.name.text, name);
        }
      }
      if (binding && ts.isNamespaceImport(binding)) namespaces.add(binding.name.text);
    }
    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const tag = node.tagName;
        const primitive = ts.isIdentifier(tag) ? aliases.get(tag.text)
          : ts.isPropertyAccessExpression(tag) && namespaces.has(tag.expression.getText()) && primitives.has(tag.name.text)
            ? tag.name.text : undefined;
        if (primitive && !instant(node.attributes)) {
          const line = source.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          violations.push(`${relative(root, file)}:${line}: ${primitive}`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.deepEqual(violations, [], `Use an Anchored popup facade; direct SDK defaults change geometry:\n${violations.join("\n")}`);
});
