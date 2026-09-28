import { workspaceWalkthrough } from "../walkthroughs/start/context";
import { articles, bullets, note, paragraph, section, steps, success, table, type DocArticle } from "../../model/article";

export const gettingStarted: DocArticle[] = [
  { id: "introduction", title: "Falcon guide", group: "start",
    description: "From your first test case to release verification. A practical guide for testers, QA leads, and development teams.",
    keywords: ["help", "documentation", "getting started", "instructions", "TMS", "navigation", "navigation"], related: ["quick-start", "workspace", "integration-overview"],
    sections: [
      section("start", "Start here", paragraph("Falcon connects your **test repository**, **test execution**, and **defect management**. Cases describe what to test. A run records what happened in a specific environment and build. Integrations share that context with the team."),
        articles("quick-start", "create-test-case", "create-run", "create-defect")),
      section("workflow", "One complete workflow", steps(
        ["Prepare a test", "Choose a project and environment. Create cases with actions and expected results; move reusable procedures into shared steps."],
        ["Record the result", "Assemble a run, specify the build, and execute the steps. Record the actual result, attach evidence, and create a defect at the point of failure."],
        ["Verify the fix", "When the tracker reports that a fix is ready, start a new attempt and retest it. Use the dashboard to monitor the queue, blocked work, and coverage."])),
      section("map", "Find the right section", table(["Task", "Where to work"],
        ["Group products and assign owners", "Portfolios and projects"],
        ["Configure product groups, products, and other fields", "Custom fields"],
        ["Prepare and maintain the repository", "Test cases · Shared steps · Test suites"],
        ["Execute tests", "Test runs"], ["Investigate problems", "Reports · defect details"],
        ["Review ongoing work", "Dashboard"], ["Connect your team's services", "Hooks"],
        ["Change project details, environments, or appearance", "Settings"])),
      section("reading", "How to use this guide", bullets(
        "Help opens Falcon AI chat. Ask a question there or open an article in the tree. The Falcon AI chat item is immediately below guide search.",
        "Find an article in the tree on the left or search its title and contents. Search recognizes English terms and service names.",
        "In walkthroughs, read the action above each screenshot and the expected outcome below it. Click an image to enlarge it; use the arrow keys to browse and Escape to close.",
        "Screenshots use the training projects Falcon Guide, Payments, and Umbrella-Host; the instructions and screenshot header identify the project. Replace example addresses, names, and builds with your own. Screenshots contain no credentials.",
        "Use the table of contents to jump to a particular step. The link icon next to a heading points directly to that section.",
        "Copy article link copies the address. A colleague opening it will need access to Falcon and the relevant project.",
        "The theme switch changes Falcon's overall appearance. The guide and chat follow the interface language, with separate Russian and English editions."),
        note("Documentation for the current version", "These articles describe available features. GitLab, Jenkins, and TeamCity cards are still marked Coming soon; their automation is not yet enabled in Falcon.")),
      section("guide-chat", "Ask Falcon AI about a procedure", steps(
        ["Describe your task", "Open Falcon AI chat and ask, for example: “How do I replace an Android build in an existing run?” Use Send message to submit your question."],
        ["Review the answer and its sources", "Read the explanation and open the links under In the guide for the relevant articles and sections. You can return to the chat and ask a follow-up question without repeating the whole conversation."],
        ["Dictate if convenient", "Click Dictate a question and allow microphone access. Finish recording, review the transcribed text, correct it if needed, then use Send message. Recording a question does not send it automatically."],
        ["Start another conversation", "New chat clears the current conversation. Opening an article or searching within the guide keeps it. Leaving Help, changing the language or workspace, or changing accounts starts a new conversation; the chat is not saved as a history."]),
        note("What the chat can explain", "Falcon AI answers from the current guide and provides source links. If the guide does not cover a detail, it should say so. The chat does not inspect your test results or change cases, runs, builds, or settings. Follow the instructions in Falcon yourself; the text assistant in case editors is a separate tool.")),
    ] },
  { id: "quick-start", title: "Your first run", group: "start", description: "Follow the full workflow: project → case → run → result. One scenario to help you get started with Falcon.",
    keywords: ["quick start", "first", "launch", "onboarding"], related: ["create-test-case", "execute-run", "dashboard"],
    sections: [
      section("prepare", "Before you begin", paragraph("Sign in to Falcon and check that the correct project is selected. If the project has an active default environment, it will be saved in the run. You can also include a project without an environment; agree with the team which environment to test before execution.")),
      section("walkthrough", "Execute your first test", steps(
        ["Choose a project", "Click the project name in the top bar and select your work project. Check its name before creating data."],
        ["Create a case", "Open Test cases → New case. Name it Sign in with valid credentials. Add the precondition: an active test user exists."],
        ["Add the scenario", "Step 1: open the sign-in page; expect the form to appear. Step 2: enter valid credentials and submit; expect the workspace to open. Save the case."],
        ["Run the case", "Click Run in the case details. Review the selection, enter the actual build if needed, and create the run. In the resulting draft, click Start."],
        ["Execute the steps", "Work in the application under test. In Falcon, record each required step's result and your observations. Once the steps pass, mark the entire case as passed."],
        ["Complete the run", "After you save final results for every case, the run completes automatically. Find it under Archived runs in the current run menu or open its result from the dashboard."])),
      section("result", "Expected outcome", success("Your test is recorded", "The run stores the case scenario, environment, builds, and step results. The revision number is not shown in the status line. This is a record of actual execution that the team can revisit."),
        paragraph("If the actual result differs from the expected result, mark the failure and create a defect from the run. Do not change the expected result just to make the test pass.")),
    ] },
  { id: "workspace", title: "Projects and environments", group: "start", description: "Choose the right working context and distinguish the test repository from the environment where you execute tests.",
    keywords: ["select project", "switch", "create project", "build", "build", "environment", "settings"], related: ["portfolios", "create-run", "dashboard", "permissions"],
    sections: [
      section("walkthrough", "Walkthrough: choose your test context", workspaceWalkthrough),
      section("context", "What defines the context", table(["Concept", "Purpose"],
        ["Workspace", "Brings together the work and members available to you."], ["Portfolio", "Groups related projects; a project can also exist without a portfolio."], ["Project", "Contains a product's cases, shared steps, suites, runs, and defects."],
        ["Environment", "Identifies a test environment and its base URL, such as Staging."], ["Build", "The application version under test: a release number, CI build, or commit SHA."])),
      section("choose", "Select or create a project", steps(
        ["Open the selector", "In the repository, click the current project name in the top bar. Select one project, multiple projects, or a portfolio with its projects."],
        ["Check the contents", "The repository preserves separate project trees and their folders. Selecting a portfolio brings cases into one view without moving them between projects. If the list is empty, check the selection and filters."],
        ["Create a project if needed", "If there are no projects yet, click Add project on the start screen. Later, use Portfolios and projects → Create project. Project management permission is required. Enter a name and permanent key; portfolio, description, and assignee are optional. You can configure environments and integrations later. Edit an existing project on its page or in Settings."])),
      section("environment", "Prepare an environment", steps(
        ["Open project settings", "Open Settings → Environments and use the action to add an environment."],
        ["Enter the details", "Provide a clear environment name and base URL. The Default badge identifies the environment already assigned as default; this form has no separate default switch."],
        ["Check it in the run", "When a run is created, it records each included project's active default environment if configured. Check the saved context and build before execution: the project name alone does not identify the test environment."])),
      section("archive", "Archive and history", paragraph("Archiving a project or environment removes it from active selection. Existing results retain their test context. Make sure your team has finished ongoing work before archiving."),
        note("Dashboard filters are separate", "The dashboard's Current work block has its own environment and build filters. The historical chart has a separate label; do not assume the current-work filter applies to it.")),
    ] },
];
