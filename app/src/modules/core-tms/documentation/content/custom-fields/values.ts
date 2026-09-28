import { articles, bullets, note, paragraph, section, steps, table, warning, type DocArticle } from "../../model/article";
import { customFieldValuesWalkthrough } from "../walkthroughs/fields/catalog";

export const customFieldValuesArticle: DocArticle = {
  id: "custom-field-values", title: "Field values and case selection", group: "cases",
  description: "Add values without duplicates, link products to groups, and use fields to filter test cases.",
  keywords: ["field values", "duplicate", "similar values", "catalog", "product", "product", "regression", "regression", "multiple selection", "archived values"],
  related: ["custom-fields", "create-test-case", "edit-test-case", "organize-cases", "create-run"],
  sections: [
    section("walkthrough", "Value selection walkthrough", customFieldValuesWalkthrough),
    section("catalog", "Add a catalog value", steps(
      ["Open the field", "In the selected project's Custom fields section, click a field name. Field values appears below its settings."],
      ["Click Add", "Enter a value of the selected type. For a product, choose a product group first. For a Boolean field, choose Yes or No."],
      ["Review and save", "Click Add. If Falcon finds an exact match or similar entries, resolve the warning first. After a successful save, the value appears in the list."]),
      paragraph("**Find value** filters the catalog; use **Show more** to continue a long list. The table shows the value, modification time, and who changed it. **⋯** offers editing and archiving according to your permissions.")),
    section("choose", "Select a value in a case", steps(
      ["Open Custom fields", "When creating a case, Custom fields is on the right. For an existing case, click the pencil next to that section."],
      ["Find the value", "Click the field and start typing in Find value. The list opens beside the field and scrolls within the popup; click Show more to continue it."],
      ["Make your selection", "For a single-value field, selecting a value closes the list. For a multiple-value field, click each option you need: checkmarks show selected values; clicking again deselects them. Clear removes the entire selection."],
      ["Save the case", "Apply the section change if that button is shown. For a new case, click Create at the bottom right of the form; for an existing case, click Save. Selecting an option alone does not save the test case."]),
      paragraph("Use the up and down arrows to move through options. Enter selects the focused option; Escape closes the popup and returns focus to the field. Required fields have an asterisk; after clearing one, choose a value before saving.")),
    section("inline-create", "Create a value directly from a case", paragraph("Type the value you need into the field search. If there is no exact match and you have test case management permission, **Create “…”** appears. Click it, review any warnings, and wait for the result. A successfully created value is immediately selected in the current draft."),
      note("The catalog and draft are saved separately", "Creating a value immediately saves it to the project's catalog. If you then cancel editing the case, the new catalog value remains, while the case itself stays unchanged."),
      paragraph("For a product, choose a group first. Until a group is selected, you cannot create a new product or select grouped products; legacy ungrouped products remain available. Falcon prevents creation of values that do not match the field's type.")),
    section("duplicates", "Exact matches and similar values", table(["Situation", "What Falcon does", "Your action"],
      ["Exact match", "Does not create a duplicate and shows the existing value.", "Select the existing option. If it is archived, open the catalog and restore it."],
      ["Similar text", "Shows matching candidates and waits for separate confirmation.", "Select a suitable option or click Create separate value if it really is a different value."],
      ["Wrong type", "Does not save the value.", "Correct the input: for Integer, use a whole number; for Number, use a period rather than a comma as the decimal separator."]),
      paragraph("Exact duplicate detection normalizes strings to a common Unicode representation; case, leading or trailing spaces, and repeated spaces do not produce a new value. For example, Checkout and checkout match. The numbers 1 and 1.0 also do not create separate values in the same numeric field."),
      paragraph("Checks apply within one field and one parent group. Products in different groups can therefore have the same name. Archived values also participate in exact duplicate detection. Similarity checks consider small differences and some separators: for example, Check-out may trigger a warning when Checkout exists."),
      paragraph("In a case, clicking a suggested value selects it. In the catalog editor, clicking a suggested value opens its settings. When editing an existing entry, confirming a similar value updates that entry instead of creating a copy. The server checks matches again; values added in the meantime may require another decision.")),
    section("product-group", "Product group and product", steps(
      ["Create a group", "Add a value to Product group, such as Mobile apps. You can do this in the catalog or from the field selector."],
      ["Add a product to the group", "In the Product catalog, select the group and add a value, such as Android. Follow the same order in a case: first the group, then the product."],
      ["Check the pair in the case", "With a group selected, the product list shows that group's values. Changing or clearing the group removes an incompatible product; select a suitable one again."]),
      paragraph("Values from the former Component field are labeled **No group** in the catalog. Leave the case's group empty to select them. They are not assigned a group automatically. If an older product is already referenced by case revisions, you cannot change its group; create a new product in the correct group and use it in new revisions."),
      warning("This is a relationship, not just a text label", "You cannot pair a product from one group with another group: the server will reject the save. Adding a slash to a product name also does not create a group or hierarchy.")),
    section("edit-archive", "Edit, archive, or restore", bullets(
      "Open a value by clicking its name or choosing ⋯ → Edit, make your change, and click Save value. The new name goes through the same duplicate and similarity checks.",
      "Archiving and changing the parent group are blocked if at least one case revision references the value. For a product group, active child products also block the action.",
      "Enable Show archived to view archived options. Restore them through the entry menu; an archived entry must be restored before it can be edited.",
      "The built-in Regression field's true and false values cannot be archived. A Boolean value cannot be changed from true to false or vice versa.",
      "If you see a concurrent change message, refresh the page and check the latest data before saving again."),
      note("History stays unchanged", "Case revisions store snapshots of field names and values. Renaming a catalog entry does not rewrite older revisions or the contents of an existing run.")),
    section("filters", "Filter by fields", paragraph("Repository filters include **Product groups**, **Products**, and **Regression**. You can select several groups or products. Regression offers **All**, **true**, and **false**: All removes the restriction; false selects cases not marked for regression."),
      paragraph("Within the group or product list, matching any selected option is enough. Different filters apply together: for example, a selected product and Regression = true. A folder and product classification are separate properties, so moving a case to another folder does not change its field values."),
      articles("organize-cases", "create-run")),
  ],
};
