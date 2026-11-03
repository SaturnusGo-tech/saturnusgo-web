import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const customFieldsWalkthrough = walkthrough("Review the field catalog and its definitions", [
  shot("fields-01-catalog-20260928-en-20260928", "Find the project's fields",
    "Select a project and open **More sections → Custom fields**. Review the field names, identifiers and types. Search narrows the list when needed; the columns distinguish multiple values from required fields.",
    "The real project catalog contains Product group, Product and Regression. Viewing it does not create a field or change which values a case requires.",
    "Umbrella-Host custom field catalog with Product group, Product and Regression."),
  shot("fields-02-definition-20260928-en-20260928", "Understand a field before changing it",
    "Open an existing field to review its definition and values. For a new definition, use **Create field** in the catalog, enter a name and unique identifier, choose a type and single or multiple values, then save when ready.",
    "The screenshot shows the existing Product definition with identifier product, its String and Single settings, requirement control and current value rows. It is not a newly created example field; no definition was changed for this capture.",
    "Existing Product custom field definition and its current value list."),
]);

export const customFieldValuesWalkthrough = walkthrough("Use catalog values in a case", [
  shot("fields-02-definition-20260928-en-20260928", "Review existing values first",
    "Open **Product** and inspect **Field values** before editing a case. Use the value search when needed. **Add** prepares a new value; provide its product group when that field requires one, and save only when you intend to extend the catalog.",
    "The current Product values are shown. No product was added for the image. Reuse a suitable existing value instead of creating a duplicate entry.",
    "Product field definition with its existing values and Add action."),
  shot("fields-04-case-picker-20260928-en-20260928", "Inspect the case's product selector",
    "In an existing case, select its custom-field value to open the picker. Choose the product group first when applicable, then find the intended product. Apply the field edit and save the case only when the new value is intended.",
    "The real HOST-TC-11 case has the Custom fields editor open, with Host Dashboard selected in the closed Product control. No alternative was selected and no new case revision was saved for this screenshot.",
    "Custom fields editor in HOST-TC-11 with Product set to Host Dashboard, Product group not specified, and Cancel and Apply actions."),
]);
