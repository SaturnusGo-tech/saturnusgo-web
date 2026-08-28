import { useState } from "react";
import type {
  Environment,
  Project,
} from "../../../../core/tms/contracts/legacy-contract";
import { useTmsHttpClient } from "../../auth/http/TmsHttpClientContext";
import {
  getEnvironment,
  transitionEnvironmentResource,
} from "../../environments/data/environment-api";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
import {
  getProject,
  transitionProjectResource,
} from "../../projects/data/project-api";
import type { useWorkspaceDerived } from "../workspace-derived/useWorkspaceDerived";
import type { useWorkspaceState } from "../workspace/useWorkspaceState";

type Resource<T> = { data: T; etag: string | null };

export function useWorkspaceResourceActions(
  state: ReturnType<typeof useWorkspaceState>,
  derived: ReturnType<typeof useWorkspaceDerived>,
  notify: (message: string) => void,
) {
  const http = useTmsHttpClient();
  const { t } = useTmsLocale();
  const [projectEditor, setProjectEditor] = useState<Resource<Project> | null>(null);
  const [environmentEditor, setEnvironmentEditor] = useState<Resource<Environment> | null>(null);
  const offline = state.connection === "demo";

  function replaceProject(project: Project) {
    state.setData((current) => ({
      ...current,
      projects: current.projects.map((item) => item.id === project.id ? project : item),
    }));
  }

  function replaceEnvironment(environment: Environment) {
    state.setData((current) => ({
      ...current,
      environments: current.environments.map((item) =>
        item.id === environment.id ? environment : item,
      ),
    }));
  }

  function closeResourceEditors() {
    setProjectEditor(null);
    setEnvironmentEditor(null);
  }

  function openNewProject() {
    closeResourceEditors();
    state.setDialog("project");
  }

  function openNewEnvironment() {
    closeResourceEditors();
    state.setDialog("environment");
  }

  async function openEditProject() {
    if (!derived.project) return;
    try {
      const resource = offline
        ? { data: derived.project, etag: null }
        : await getProject(http, derived.project.id);
      setProjectEditor(resource);
      state.setDialog("project");
    } catch {
      notify(t("actions.projectUpdateError"));
    }
  }

  async function openEditEnvironment(environmentId: string) {
    const current = state.data.environments.find((item) => item.id === environmentId);
    if (!current) return;
    try {
      const resource = offline
        ? { data: current, etag: null }
        : await getEnvironment(http, environmentId);
      setEnvironmentEditor(resource);
      state.setDialog("environment");
    } catch {
      notify(t("actions.environmentUpdateError"));
    }
  }

  async function toggleProject() {
    if (!derived.project) return;
    try {
      const current = offline
        ? { data: derived.project, etag: null }
        : await getProject(http, derived.project.id);
      const operation = current.data.status === "archived" ? "restore" : "archive";
      const resource = offline
        ? { data: { ...current.data, status: operation === "archive" ? "archived" : "active" } as Project, etag: null }
        : await transitionProjectResource(
            http, current.data.id, operation, current.etag!, crypto.randomUUID(),
          );
      replaceProject(resource.data);
      notify(t(operation === "archive" ? "actions.projectArchived" : "actions.projectRestored"));
    } catch {
      notify(t("actions.projectTransitionError"));
    }
  }

  async function toggleEnvironment(environmentId: string) {
    const selected = state.data.environments.find((item) => item.id === environmentId);
    if (!selected) return;
    try {
      const current = offline
        ? { data: selected, etag: null }
        : await getEnvironment(http, environmentId);
      const operation = current.data.status === "archived" ? "restore" : "archive";
      const resource = offline
        ? { data: { ...current.data, status: operation === "archive" ? "archived" : "active" } as Environment, etag: null }
        : await transitionEnvironmentResource(
            http, current.data.id, operation, current.etag!, crypto.randomUUID(),
          );
      replaceEnvironment(resource.data);
      notify(t(operation === "archive" ? "actions.environmentArchived" : "actions.environmentRestored"));
    } catch {
      notify(t("actions.environmentTransitionError"));
    }
  }

  function acceptProjectUpdate(project: Project, etag: string | null) {
    replaceProject(project);
    setProjectEditor({ data: project, etag });
    notify(t("actions.projectUpdated"));
  }

  function acceptEnvironmentUpdate(environment: Environment, etag: string | null) {
    replaceEnvironment(environment);
    setEnvironmentEditor({ data: environment, etag });
    notify(t("actions.environmentUpdated"));
  }

  return {
    projectEditor, environmentEditor, closeResourceEditors,
    openNewProject, openNewEnvironment, openEditProject, openEditEnvironment,
    toggleProject, toggleEnvironment, acceptProjectUpdate, acceptEnvironmentUpdate,
  };
}
