import type { Bootstrap } from "../contracts/legacy-contract";

function workspaceShell(apiVersion: string): Bootstrap {
  return {
    workspace: {
      id: "workspace_umbrella_home",
      key: "UH",
      slug: "umbrella-home",
      name: "Umbrella Home",
    },
    projects: [],
    environments: [],
    testCases: [],
    suites: [],
    runs: [],
    defects: [],
    externalLinks: [],
    dashboards: [
      {
        id: "dashboard_umbrella_work",
        name: "Work",
        description: "Quality workspace",
        isDefault: true,
        widgets: [],
      },
    ],
    activity: [],
    meta: { generatedAt: new Date().toISOString(), apiVersion },
  };
}

export function createWorkspaceShell(): Bootstrap {
  return workspaceShell("pending");
}

export function fallbackBootstrap(): Bootstrap {
  return workspaceShell("development-demo");
}
