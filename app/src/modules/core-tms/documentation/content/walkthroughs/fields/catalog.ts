import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const customFieldsWalkthrough = walkthrough("Review the field catalog and its definitions", [
  shot("fields-01-catalog-20260928-en-20260928", "Find the project's fields",
    "Select a project and open **More sections → Custom fields**. Review the field names, identifiers and types. Search narrows the list when needed; the columns distinguish multiple values from required fields.",
    "The real project catalog contains Product group, Product and Regression. Viewing it does not create a field or change which values a case requires.",
    "Falcon Guide custom field catalog with Product group, Product and Regression."),
  shot("fields-02-definition-20260928-en-20260928", "Understand a field before changing it",
    "Open an existing field to review its definition and values. For a new definition, use **Create field** in the catalog, enter a name and unique identifier, choose a type and single or multiple values, then save when ready.",
    "The existing **Product** definition has identifier **product**, **String** and **Single** settings, and Required switched off. The value search is filtered to **Documentation** and shows the saved **Documentation examples** value as **Unclassified**. No definition or new value was saved from this view.",
    "Existing Product String/Single definition filtered to the saved Documentation examples value."),
]);

export const customFieldValuesWalkthrough = walkthrough("Use catalog values in a case", [
  shot("fields-02-definition-20260928-en-20260928", "Review existing values first",
    "Open **Product** and inspect **Field values** before editing a case. Use the value search when needed. **Add** prepares a new value; provide its product group when that field requires one, and save only when you intend to extend the catalog.",
    "The Product value search is filtered to **Documentation** and shows the saved English **Documentation examples** value, marked **Unclassified**. **Add** is available; no additional value was created or definition saved from this view.",
    "Product field definition filtered to the existing Documentation examples value and Add action."),
  shot("fields-04-case-picker-20260928-en-20260928", "Inspect the case's product selector",
    "In an existing case, select its custom-field value to open the picker. Choose the product group first when applicable, then find the intended product. Apply the field edit and save the case only when the new value is intended.",
    "The saved **GUIDE-TC-3** case has an unsaved **Custom fields** edit open. The **Product** picker is filtered by **Documentation** and the existing **Documentation examples** value is selected; **Product group** is **Not specified**. No alternative was selected and no case revision was saved.",
    "Open Product picker in English GUIDE-TC-3 with Documentation examples selected, Documentation search and product-group guidance."),
]);
