import { articles, note, paragraph, section, steps, type DocArticle } from "../../../model/article";

export const plannedIntegrations: DocArticle[] = [
  { id: "gitlab", title: "GitLab", group: "integrations", status: "planned",
    description: "The current GitLab integration status and how to retain merge request or pipeline context in a test.",
    keywords: ["GitLab", "gitlab", "merge request", "pipeline", "CI"], related: ["github", "create-run"],
    sections: [
      section("status", "Status: coming soon", note("Connection is not yet available", "GitLab is marked Coming soon in the Falcon catalog. There is currently no connection form, GitLab webhook handler, or automatic run creation from merge requests or pipelines.")),
      section("today", "How to work today", steps(
        ["Create a run manually", "Choose cases or a suite in Falcon and specify the target environment."],
        ["Record the build", "Use the exact commit SHA or pipeline identifier you are testing."],
        ["Keep the context", "Add the merge request or pipeline link to a related defect's description or test evidence when needed for reproduction."],
        ["Share the result with the team", "After execution, use the run link. A return status is not published to GitLab automatically."])),
      section("next", "Available automation", paragraph("GitHub repositories already support runs from code changes and Actions failures. This is a separate connector; do not send GitLab webhooks to its endpoint."), articles("github", "test-suites")),
    ] },
  { id: "teamcity", title: "TeamCity", group: "integrations", status: "planned",
    description: "What is available for testing TeamCity builds before a built-in connector arrives.",
    keywords: ["TeamCity", "teamcity", "build configuration", "CI", "builds"], related: ["create-run", "slack"],
    sections: [
      section("status", "Status: coming soon", note("Automatic exchange is not connected", "The Falcon catalog includes a TeamCity card marked Coming soon. It does not currently configure automatic Falcon runs by build configuration, result imports, or return publishing to TeamCity.")),
      section("today", "Test a build manually", steps(
        ["Choose the build under test", "In TeamCity, record the build number, revision, and target test environment."],
        ["Run the relevant suite in Falcon", "Specify the same build and environment. Choose tests based on the changed area."],
        ["Record the result", "Document actual behavior and log links in defect evidence. Do not call a failed CI build successful based solely on one Falcon status."])),
      section("notifications", "Manual test notifications", paragraph("Connected Slack can report creation and completion of this run. Receiving TeamCity failure events is not implemented yet."), articles("slack", "execute-run")),
    ] },
  { id: "jenkins", title: "Jenkins", group: "integrations", status: "planned",
    description: "How to track Jenkins builds in Falcon and which features are not yet implemented.",
    keywords: ["Jenkins", "jenkins", "job", "pipeline", "automated tests", "JUnit"], related: ["create-run", "test-suites"],
    sections: [
      section("status", "Status: coming soon", note("The connector is not yet available", "Jenkins is marked Coming soon in the Falcon catalog. Its card cannot start a job, receive a pipeline webhook, or import a JUnit report.")),
      section("today", "Record manual testing", steps(
        ["Choose the job and build", "Confirm the version deployed to the environment and record the build number."],
        ["Create a Falcon run", "Choose the relevant suite and environment. Use the tested artifact's identifier in the build field."],
        ["Execute the test", "If a failure occurs, attach the job/build link and relevant log excerpt to the defect. The link provides context; it does not enable automatic synchronization."])),
      section("scope", "Automated tests and manual results", paragraph("Falcon stores results of testing performed within it. A case type or Jenkins link does not mean an automated test runner has started. Available event-driven automation is described in the GitHub article."), articles("github", "execute-run")),
    ] },
];
