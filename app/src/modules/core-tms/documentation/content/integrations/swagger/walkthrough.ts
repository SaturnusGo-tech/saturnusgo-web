import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../../walkthroughs/media/screenshot-step";

export const swaggerWalkthrough = walkthrough("Prepare an API connection", [
  shot("swagger-01-catalog-20260914-en-20260928", "Open connected APIs",
    "In **Hooks → Swagger**, open the connection list and click **Connect API** to prepare a new specification. This example starts with an empty catalog.",
    "No API has been connected in this screenshot. A shared API can serve several projects; you do not need a separate connection for each one.",
    "Empty connected API catalog in Falcon with the Connect API action."),
  shot("swagger-01-connection-20260914-en-20260928", "Assign the API to projects",
    "Enter **Petstore** and **https://petstore3.swagger.io/api/v3/openapi.json**. Under **Used in projects**, search for **Payments** in **Find project** and select it. For your own connection, use your specification and project.",
    "The screenshot is an unsaved settings preview with Payments selected and No authentication chosen. After entering valid details, use the blue **Save API** checkmark at the top right; this example does not show a created connection.",
    "Unsaved Petstore API settings with the direct OpenAPI URL and Payments selected in the filtered project list."),
  shot("swagger-02-auth-20260914-en-20260928", "Configure access to a protected document",
    "Under **Documentation access**, choose **Username and password** or **Bearer token**. Enter credentials for the specification itself. Public Petstore needs no authorization.",
    "This optional settings preview has empty credential fields and was canceled without saving. These credentials do not replace authorization for API operations; follow the request instructions below after connecting a valid specification.",
    "API settings with Username and password selected and empty fields containing no secrets."),
]);
