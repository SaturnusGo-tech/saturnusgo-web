import { note, paragraph, section, steps, type DocArticle } from "../../model/article";
export const toolsArticle: DocArticle = {
  id: "api-testing", title: "API Testing", group: "reference",
  description: "Choose projects, a connected API, and a server to execute requests through Swagger.",
  keywords: ["API Testing", "Swagger", "OpenAPI", "contract"], related: ["create-test-case", "integration-overview", "swagger"],
  sections: [
    section("setup", "Connect a project's API", steps(
      ["Check the project", "An API connection can serve several projects. Select the relevant projects or portfolio in the scope selector."],
      ["Configure the source", "Open Hooks → Swagger → Connect API. Enter a direct HTTPS OpenAPI JSON/YAML URL, document access, and the projects using this API."],
      ["Open the specification", "In API Testing, choose the API service from connections within the available scope. Select Request server to execute operations. You can view the specification before choosing a server."])),
    section("api", "Execute a request", paragraph("Find the endpoint in Swagger and check the server and request parameters. If the API requires authorization, use **Authorize**. Specification access and request authorization are separate settings."),
      note("External tool", "For Execute, your API must allow CORS from Falcon's address. Requests and responses do not automatically become completed Falcon runs; record the test and evidence in the relevant scenario.")),
    section("cases", "Save the test", paragraph("For a repeatable scenario, create a standard test case describing the input, request, and expected response. Include it in a suite or run. Previously created integration cases remain available in the shared test repository.")),
  ],
};
