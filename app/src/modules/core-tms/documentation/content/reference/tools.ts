import { note, paragraph, section, steps, type DocArticle } from "../../model/article";
export const toolsArticle: DocArticle = {
  id: "api-testing", title: "API Testing", group: "reference",
  description: "Choose projects, a connected API, and a server to execute requests through Swagger.",
  keywords: ["API Testing", "Swagger", "OpenAPI", "contract"], related: ["create-test-case", "integration-overview", "swagger"],
  sections: [
    section("setup", "Connect a project's API", steps(
      ["Check the scope", "An API connection can serve several projects. Select the relevant projects or portfolio in the scope selector."],
      ["Configure the source", "If no API is available, Connect Swagger opens the first full-page source form under Settings → Plugins → Swagger. Enter Name and Specification; expand Documentation access and Used in projects only as needed, then click Connect API."],
      ["Open the specification", "A single available API opens automatically. With several APIs, choose API service. The specification remains readable before a request server is selected."],
      ["Manage a saved source", "Open API actions → Manage Swagger → Uses → Connection setup. Select the source under API connections. Refresh API in the same actions menu reloads the specification."])),
    section("api", "Execute a request", paragraph("Click the endpoint-search magnifier to find an operation. Expand **Request settings**, choose **Request server**, and check the parameters before execution. If the API requires authorization, use **Authorize** in these settings. Specification access and request authorization are separate."),
      note("External tool", "Execute sends a real request to your API, which must allow CORS from Falcon's address. Requests and responses do not automatically become completed Falcon runs; record the outcome and evidence in the relevant scenario.")),
    section("cases", "Save the test", paragraph("For a repeatable scenario, create a standard test case describing the input, request, and expected response. Include it in a suite or run. Previously created integration cases remain available in the shared test repository.")),
  ],
};
