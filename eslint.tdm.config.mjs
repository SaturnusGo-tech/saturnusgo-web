import js from "@eslint/js";
import tseslint from "typescript-eslint";

/** The complete TDM vertical slice, including its existing client integration seams. */
export const tdmLintFiles = [
  "app/src/core/tms/contracts/test-data/**/*.ts",
  "app/src/core/tms/contracts/execution-contract.ts",
  "app/src/modules/core-tms/test-data/**/*.{ts,tsx}",
  "app/src/modules/core-tms/auth/managed/domain/features/workspace-view-access.ts",
  "app/src/modules/core-tms/localization/catalog/shell/{en,ru}.ts",
  "app/src/modules/core-tms/presentation/cases/inspector/CaseInspectorContent.tsx",
  "app/src/modules/core-tms/presentation/cases/inspector/creation/CaseCreationSections.tsx",
  "app/src/modules/core-tms/presentation/cases/inspector/model.ts",
  "app/src/modules/core-tms/presentation/cases/inspector/steps/editor/ScenarioStepEditor.tsx",
  "app/src/modules/core-tms/presentation/cases/inspector/steps/markdown/ScenarioMarkdownInput.tsx",
  "app/src/modules/core-tms/presentation/cases/inspector/tests/scenario/attachments/saved-step-attachments.test.ts",
  "app/src/modules/core-tms/presentation/cases/inspector/tests/archive/archived-readonly.test.ts",
  "app/src/modules/core-tms/presentation/navigation/Navigation.tsx",
  "app/src/modules/core-tms/presentation/navigation/model/sidebar-navigation.ts",
  "app/src/modules/core-tms/presentation/navigation/sections-menu/SidebarSectionsMenu.tsx",
  "app/src/modules/core-tms/presentation/navigation/tests/model/sidebar-navigation.test.ts",
  "app/src/modules/core-tms/presentation/navigation/ui/sidebar-catalog.ts",
  "app/src/modules/core-tms/presentation/runs/RunsView.tsx",
  "app/src/modules/core-tms/presentation/workspace-stage/WorkspaceStage.tsx",
  "app/src/modules/core-tms/presentation/workspace/LocalizedWorkspace.tsx",
  "app/src/modules/core-tms/state/types/workspace.ts",
  "app/src/modules/core-tms/state/workspace-derived/useWorkspaceDerived.ts",
  "app/src/modules/core-tms/test-cases/data/test-case-api.ts",
  "app/src/modules/core-tms/test-cases/data/test-case-mapper.ts",
];

export default tseslint.config(
  { ignores: ["app/src/core/tms/generated/**"] },
  {
    files: tdmLintFiles,
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
  },
);
