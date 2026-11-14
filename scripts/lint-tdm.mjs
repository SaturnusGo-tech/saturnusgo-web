import { ESLint } from "eslint";
import { tdmLintFiles } from "../eslint.tdm.config.mjs";

const eslint = new ESLint({ overrideConfigFile: "eslint.tdm.config.mjs" });
const results = await eslint.lintFiles(tdmLintFiles);
const formatter = await eslint.loadFormatter("stylish");
const output = formatter.format(results);
if (output) process.stdout.write(output);
const errors = results.reduce((total, result) => total + result.errorCount, 0);
const warnings = results.reduce((total, result) => total + result.warningCount, 0);
console.log(`TDM lint checked ${results.length} files: ${errors} errors, ${warnings} warnings.`);
process.exitCode = errors || warnings ? 1 : 0;
