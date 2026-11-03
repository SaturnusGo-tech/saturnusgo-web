import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../../walkthroughs/media/screenshot-step";

export const swaggerWalkthrough = walkthrough("Connect a specification and inspect an API operation", [
  shot("swagger-00-manage", "Open Swagger management",
    "From **API Testing**, select **Manage Swagger**, or open **Settings → Plugins → Swagger**. **Connection setup** opens saved sources and their project assignments. **Guide** opens this documentation; **View details** returns to the plugin card.",
    "The manager provides navigation to the workspace’s connections. Opening it does not connect a source, download a specification or grant new project access.",
    "Swagger plugin manager with Connection setup, Guide, About and View details."),
  shot("swagger-01-catalog-20260914-en-20260928", "Find an API source or add a connection",
    "Open **Settings → Plugins → Swagger → Connection setup**. Select an existing source or **Connect API**. When none exists, **API Testing → Connect Swagger** opens the first setup form directly.",
    "The actual company catalog contains saved API sources, including the Umbrella backend specification. Project assignments determine where each specification is available. One source can serve several projects.",
    "Falcon API source catalog with OpenAPI URLs, enabled states and assigned projects."),
  shot("swagger-01-connection-20260914-en-20260928", "Assign the API to the intended projects",
    "Enter a direct JSON or YAML specification URL and a name. Expand **Documentation access** for **Username and password** or **Bearer token** if the document is protected; public documents can use no authentication. Expand **Used in projects** to select projects or the entire workspace.",
    "The screenshot opens the existing source API · sieger-assistente-production.up.railway.app, assigned to Umbrella-Host. **Connect API** creates a new source; **Save changes** updates an existing one. Stored Basic credentials are not exposed; leave replacement fields blank to preserve them. No settings were saved. URL changes and disabling affect all assigned projects.",
    "Existing Umbrella backend API settings with the docs-json URL, saved access method and Umbrella-Host project assignment."),
  shot("swagger-03-operations-20260914", "Find the intended operation",
    "Open **API Testing** and check the selected source. Use the search icon to find part of a path or operation name: the screenshot searches for **health**. Expand the intended method, then open **Request settings** if you need a request server or authorization.",
    "The actual Umbrella backend specification returns GET /v1/health in the App group. Search narrows the visible contract and does not send a request.",
    "API Testing with the health endpoint search open and GET /v1/health in the App group."),
  shot("swagger-04-request-20260914", "Keep contract examples separate from server results",
    "Read the expanded operation’s parameters and **Responses**. Choose the intended **Request server**, configure **Authorize** if needed and verify the environment before using **Try it out → Execute**, where available. Documentation-access credentials are separate from operation authorization.",
    "GET /v1/health has no parameters. The displayed 200, 400, 429 and 500 examples come from the specification, not a server response. The request server remains unselected and no request was sent for this capture; status: ok is a contract example only.",
    "Expanded GET /v1/health with no parameters, contract response examples and Request settings requiring a server selection."),
]);
