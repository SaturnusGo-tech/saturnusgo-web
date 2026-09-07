import { buildWorkspaceDeepLink } from "../navigation/workspace-deep-link";

export function openRunNavigation(input: {
  workspaceId: string;
  projectId: string;
  runId: string;
  runItemId: string | null;
}, navigation: {
  href: string;
  replace: (href: string) => void;
  clearDefect: () => void;
  selectRun: (id: string) => void;
  selectItem: (id: string | null) => void;
  showRuns: () => void;
}) {
  navigation.replace(buildWorkspaceDeepLink(navigation.href, { ...input, view: "runs" }));
  navigation.clearDefect();
  navigation.selectRun(input.runId);
  navigation.selectItem(input.runItemId);
  navigation.showRuns();
}
