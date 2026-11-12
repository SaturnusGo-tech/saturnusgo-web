import { walkthrough } from "../../../model/visual/walkthrough";
import { screenshotStep as shot } from "../../walkthroughs/media/screenshot-step";

export const swaggerWalkthrough = walkthrough("Connect a specification and inspect an API operation", [
  shot("swagger-00-manage", "Open Swagger management",
    "From **API Testing**, select **Manage Swagger**, or open **Settings → Plugins → Swagger**. **Connection setup** opens saved sources and their project assignments. **Guide** opens this documentation; **View details** returns to the plugin card.",
    "The manager provides navigation to the workspace’s connections. Opening it does not connect a source, download a specification or grant new project access.",
    "Swagger plugin manager with Connection setup, Guide, About and View details."),
  shot("swagger-01-catalog-20260914-en-20260928", "Find an API source or add a connection",
    "Open **Settings → Plugins → Swagger → Connection setup**. Select an existing source or **Connect API**. When none exists, **API Testing → Connect Swagger** opens the first setup form directly.",
    "The actual company catalog contains three saved enabled API sources, including the Umbrella backend specification. Project assignments determine where each specification is available. Existing canonical project names **API заказов** and **Кабинет хоста** remain in their saved Russian language; the interface and API source metadata are English.",
    "English Falcon API connections catalog with three saved enabled sources and actual project assignments, including canonical Russian project names."),
  shot("swagger-01-connection-20260914-en-20260928", "Assign the API to the intended projects",
    "Enter a direct JSON or YAML specification URL and a name. Expand **Specification access** for **Username and password** or **Bearer token** if the document is protected; public documents can use no authentication. Expand **Available in projects** to select projects or the entire workspace.",
    "The existing public **Petstore** source is assigned to **Falcon Guide**, uses **No authentication** for documentation access and is enabled. **Documentation access** and **Used in projects** are collapsed in this earlier capture. **Save changes** would update this saved source; no changes were saved for this view.",
    "English saved Petstore API source with its OpenAPI URL, no authentication, Falcon Guide assignment and enabled state; access and project sections collapsed."),
  shot("swagger-03-operations-20260914", "Find the intended operation",
    "Open **API Testing** and check the selected source. Use the search icon to find part of a path or operation name: the screenshot searches for **health**. Expand the intended method, then choose **Request server** in the toolbar and use **Authorize** if the operation requires authentication.",
    "The actual Umbrella backend specification returns GET /v1/health in the App group. Search narrows the visible contract and does not send a request.",
    "API Testing with the health endpoint search open and GET /v1/health in the App group."),
  shot("swagger-04-request-20260914", "Keep contract examples separate from server results",
    "Read the expanded operation’s parameters and **Responses**. Choose the intended **Request server**, configure **Authorize** if needed and verify the environment before using **Try it out → Execute**, where available. Documentation-access credentials are separate from operation authorization.",
    "The expanded **GET /v1/health** contract has no parameters and shows specification examples, including **200** with **status: ok** and **400** validation errors. These are contract examples, not a server response. **Request settings** remains collapsed and no request was sent.",
    "Expanded English GET /v1/health contract with no parameters and 200 and 400 response examples; Request settings is collapsed."),
]);
