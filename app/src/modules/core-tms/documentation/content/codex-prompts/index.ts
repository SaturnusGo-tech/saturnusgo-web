import { articles, code, paragraph, section, type DocArticle } from "../../model/article";
import { configurationPrompts } from "./configuration/configuration";
import { defectPrompts } from "./defects/defects";
import { reportingPrompts } from "./reporting/reporting";
import { productDocPrompts } from "./product-docs/product-docs";
import { repositoryPrompts } from "./repository/repository";
import { runPrompts } from "./runs/runs";
import { webQaPrompts } from "./web-qa/web-qa";

const topics = [repositoryPrompts, productDocPrompts, runPrompts, webQaPrompts, defectPrompts, reportingPrompts, configurationPrompts];
const overview: DocArticle = {
  id: "codex-prompts",
  title: "Codex playbook",
  description: "Copy a practical request for Codex and adapt it to your Falcon workspace.",
  group: "codex-prompts",
  keywords: ["Codex", "playbook", "prompt", "examples", "templates", "QA", "Falcon"],
  related: ["codex-web-qa", ...topics.map(topic => topic.id)],
  sections: [
    section("start", "Run a prompt in Codex",
      paragraph("Connect Falcon in Codex, open the topic that matches your task, and copy a prompt. Replace the details in square brackets with your project, link or expected outcome. Paste the completed request into a Codex chat."),
      paragraph("A specific request gives Codex a project, a task and a result you can check. For changes, name what Codex may change and what you want to review first. Use the sign-in flow if the connection needs access and keep credentials out of the prompt."),
      code("prompt", "Check what your connection can do",
        `Use Falcon in [workspace] for [project]. Check which actions are available on this connection and give me three practical next steps for [QA goal]. For each step, say what you would read, what would require review and what output I would get. Keep this read-only.`)),
    section("topics", "Find an example for your task",
      paragraph("Each example explains when to use it and what Codex can return. Availability depends on the projects and permissions of your connection."),
      articles(...topics.map(topic => topic.id))),
  ],
};

export const codexPromptArticles: readonly DocArticle[] = [overview, ...topics];
