import { createElement } from "react";
import {
  ArchiveRestore, ArrowRightLeft, Bell, Blocks, BookA, BookMarked, BookOpen, BookOpenText, Braces,
  Bug, CirclePlay, CirclePlus, Copy, FileCheck2, FilePenLine, FilePlus2, FileText,
  Folders, Highlighter, Layers3, LayoutDashboard, LifeBuoy, Link2,
  ListChecks, ListFilter, MessagesSquare, MonitorCheck, PanelLeft,
  PanelsTopLeft, Rocket, RotateCcw, ScrollText, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, UserRound, UsersRound,
  ChartNoAxesCombined, ClipboardCheck, FolderSearch, Globe, ListTodo, Wrench,
} from "lucide-react";
import { FaConfluence, FaGithub, FaGitlab, FaJenkins, FaJira, FaSlack, FaTrello } from "react-icons/fa6";
import { SiLinear, SiSwagger, SiTeamcity, SiTelegram } from "react-icons/si";

// Keep this lookup independent of article content so public documentation can
// share the same visual language without importing the authenticated catalog.
const articleIcons = {
  introduction: BookOpen,
  "quick-start": Rocket,
  workspace: PanelsTopLeft,
  navigation: PanelLeft,
  settings: Settings2,
  "company-access": UserRound,
  "company-administration": UsersRound,
  portfolios: Layers3,
  dashboard: LayoutDashboard,
  "create-test-case": FilePlus2,
  "edit-test-case": FilePenLine,
  "archive-test-case": ArchiveRestore,
  "custom-fields": SlidersHorizontal,
  "custom-field-values": ListFilter,
  "falcon-ai-writing": Sparkles,
  "colored-marker": Highlighter,
  "case-comments": MessagesSquare,
  "product-docs-authoring": BookMarked,
  "shared-steps": Copy,
  "organize-cases": Folders,
  "import-export": ArrowRightLeft,
  "test-suites": ListChecks,
  "create-run": CirclePlus,
  "execute-run": CirclePlay,
  retest: RotateCcw,
  "create-defect": Bug,
  "link-defect": Link2,
  notifications: Bell,
  "telegram-notifications": SiTelegram,
  "browser-notifications": MonitorCheck,
  "integration-overview": Blocks,
  "codex-prompts": BookOpenText,
  "codex-prompts-repository": FolderSearch,
  "codex-prompts-product-docs": FileCheck2,
  "codex-prompts-runs": ClipboardCheck,
  "codex-prompts-web-qa": Globe,
  "codex-prompts-defects": ListTodo,
  "codex-prompts-reporting": ChartNoAxesCombined,
  "codex-prompts-configuration": Wrench,
  jira: FaJira,
  linear: SiLinear,
  trello: FaTrello,
  github: FaGithub,
  slack: FaSlack,
  confluence: FaConfluence,
  swagger: SiSwagger,
  gitlab: FaGitlab,
  teamcity: SiTeamcity,
  jenkins: FaJenkins,
  "integration-troubleshooting": ScrollText,
  "api-testing": Braces,
  permissions: ShieldCheck,
  glossary: BookA,
  "contact-support": LifeBuoy,
} as const;

const imageMarks: Readonly<Record<string, string>> = {
  youtrack: "/falcon/integrations/youtrack.svg",
  "codex-web-qa": "/assets/integrations/codex/codex-dark.png",
};

export function DocumentationIcon({ articleId, size = 18, className }: {
  articleId: string;
  size?: number;
  className?: string;
}) {
  const source = Object.prototype.hasOwnProperty.call(imageMarks, articleId) ? imageMarks[articleId] : undefined;
  if (source) return createElement("img", {
    src: source, alt: "", "aria-hidden": true, width: size, height: size, className,
    style: { display: "block", flexShrink: 0, objectFit: "contain", ...(articleId === "youtrack" ? { filter: "grayscale(1)" } : {}) },
  });
  const Icon = Object.prototype.hasOwnProperty.call(articleIcons, articleId)
    ? articleIcons[articleId as keyof typeof articleIcons] : FileText;
  return createElement(Icon, { size, className, "aria-hidden": true, focusable: false, strokeWidth: 1.65, style: { flexShrink: 0 } });
}

export function DocumentationDisclosureIcon({ expanded = false }: { expanded?: boolean }) {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
    strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" focusable="false">
    <path d="M4 8h8" />
    {!expanded && <path d="M8 4v8" data-disclosure-stem />}
  </svg>;
}
