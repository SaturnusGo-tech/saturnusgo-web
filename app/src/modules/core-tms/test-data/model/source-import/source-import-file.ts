export type SourceImportFile = { readonly name: string; readonly format: "CSV" | "JSON"; readonly sheets: readonly { readonly name: string; readonly content: string }[] };
