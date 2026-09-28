import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../media/screenshot-step";

export const customFieldsWalkthrough = walkthrough("Field catalog and settings", [
  shot("fields-01-catalog-20260928-en-20260928", "Review the project's fields",
    "Select a project and open **Custom fields**. The example uses Payments. Check names, identifiers and types; use search to find a specific field.",
    "The catalog contains three built-in fields and the additional Release channel QA field. Separate columns show multiple-value support and whether a field is required.",
    "Payments field catalog showing Product group, Product, Regression and the additional Release channel QA field."),
  shot("fields-02-definition-20260928-en-20260928", "Define a new field",
    "Select **Create field**. Enter a name and unique identifier, choose a type, and select one or multiple values. The example uses **Platform**, **platform**, **String** and **Single**, with Required off. Select **Save** to create it.",
    "The screenshot shows an unsaved form. Platform was not created in this example. You can add values after saving the field definition.",
    "Unsaved Platform field with identifier platform, String type, a single value and Required switched off."),
  shot("fields-03-product-20260928-en-20260928", "Open an existing field's values",
    "Return to the catalog and open **Product**. Review **Field values** and use **Find a value** to locate an existing product. **Add** opens the form for a new value when one is needed.",
    "The screenshot shows the existing Product catalog with Release QA, Security, Transfers, Payments and Transfers QA. No value-creation form is open and no product has been added in this step.",
    "Product field settings in Payments with existing values, Find a value, Include archived and the Add control."),
]);

export const customFieldValuesWalkthrough = walkthrough("From the catalog to case field values", [
  shot("fields-03-product-20260928-en-20260928", "Review the product catalog",
    "Open the existing **Product** field and check its values before editing a case. Use **Find a value** to locate the product. When adding a new product through **Add**, select its product group as well as its name.",
    "The screenshot shows existing values; entries without a group are marked Unclassified. The next step uses the existing Transfers QA product in the Mobile banking group.",
    "Payments Product field catalog with existing products and Unclassified labels beneath values that have no group."),
  shot("fields-04-case-picker-20260928-en-20260928", "Choose a product in an existing case",
    "Open PAY-TC-34 and select the pencil beside **Custom fields**. Choose **Mobile banking**, then open **Product**. Search with **Find a value** if needed and select **Transfers QA**.",
    "The screenshot edits the saved Open Falcon help case with Transfers QA selected. **Apply** updates the field editor; the main **Save** button saves the case revision.",
    "Existing PAY-TC-34 in editing mode with Mobile banking, the open Transfers QA picker and Apply and Save controls."),
  shot("case-05-saved-20260928-en-20260928", "Check the saved values",
    "Apply the custom-field changes and select the main **Save** button. In the saved case, review the selected product group, product and regression flag under **Custom fields**.",
    "PAY-TC-34 has Draft status, Mobile banking, Transfers QA and regression false. Saving the case does not create duplicate entries in the field catalog.",
    "Saved PAY-TC-34 with Mobile banking as the product group, Transfers QA as the product and regression false."),
]);
