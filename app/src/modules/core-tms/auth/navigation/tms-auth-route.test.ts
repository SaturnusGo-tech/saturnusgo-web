import assert from "node:assert/strict";
import test from "node:test";
import {
  claimTmsInteractiveLogin,
  consumeTmsLogoutIntent,
  rememberTmsLogoutIntent,
  resolveTmsAuthEntryStage,
  restoredDuringTmsLogin,
  safeTmsReturnPath,
  shouldUseAdminAuth,
  tmsAdminLogoutReturnTo,
  tmsReturnPathFromLocation,
  tmsSignedOutDestination,
  TMS_AUTH_ROUTE_PATH,
} from "./tms-auth-route";

const snapshot = (patch: Partial<Parameters<typeof resolveTmsAuthEntryStage>[0]> = {}) => ({
  isLoading: false,
  isAuthenticated: false,
  hasError: false,
  redirectFailed: false,
  logoutIntent: "absent" as const,
  ...patch,
});

test("waits for the background Auth0 session check before deciding how to enter", () => {
  assert.equal(
    resolveTmsAuthEntryStage(snapshot({ isLoading: true })),
    "checking",
  );
});

test("opens the workspace immediately when the background check restores a session", () => {
  assert.equal(
    resolveTmsAuthEntryStage(snapshot({ isAuthenticated: true })),
    "authenticated",
  );
});

test("requests an interactive redirect only after Auth0 confirms there is no session", () => {
  assert.equal(resolveTmsAuthEntryStage(snapshot()), "redirect");
});

test("keeps authentication failures on the recoverable error path", () => {
  assert.equal(
    resolveTmsAuthEntryStage(snapshot({ hasError: true })),
    "error",
  );
  assert.equal(
    resolveTmsAuthEntryStage(snapshot({ redirectFailed: true })),
    "error",
  );
});

test("claims an interactive redirect only once when effects repeat", () => {
  const attempt = { current: false };
  assert.equal(claimTmsInteractiveLogin(attempt), true);
  assert.equal(claimTmsInteractiveLogin(attempt), false);
});

test("turns a back-forward restore during login into a recoverable state", () => {
  assert.equal(
    restoredDuringTmsLogin({ persisted: true }, { current: true }),
    true,
  );
  assert.equal(
    restoredDuringTmsLogin({ persisted: false }, { current: true }),
    false,
  );
});

test("preserves the current TMS deep link through Auth0", () => {
  assert.equal(
    tmsReturnPathFromLocation({
      pathname: TMS_AUTH_ROUTE_PATH,
      search: "?projectId=project-1&caseId=case-2",
      hash: "#overview",
    }),
    `${TMS_AUTH_ROUTE_PATH}?projectId=project-1&caseId=case-2#overview`,
  );
});

test("removes stale OAuth callback parameters without losing the TMS deep link", () => {
  assert.equal(
    tmsReturnPathFromLocation({
      pathname: TMS_AUTH_ROUTE_PATH,
      search: "?projectId=project-1&error=access_denied&state=opaque&view=runs",
      hash: "",
    }),
    `${TMS_AUTH_ROUTE_PATH}?projectId=project-1&view=runs`,
  );
});

test("consumes an explicit logout intent and exits instead of auto-login", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => { values.delete(key); },
  };
  rememberTmsLogoutIntent(storage);
  assert.equal(consumeTmsLogoutIntent(storage), true);
  assert.equal(consumeTmsLogoutIntent(storage), false);
  assert.equal(
    resolveTmsAuthEntryStage(snapshot({
      logoutIntent: "present",
      hasError: true,
      isLoading: true,
    })),
    "exit",
  );
});

test("leaves the protected production host after an explicit logout", () => {
  assert.equal(
    tmsSignedOutDestination({
      hostname: "tms.saturnusgo.com",
      origin: "https://tms.saturnusgo.com",
    }),
    "https://tms.saturnusgo.com/",
  );
  assert.equal(
    tmsSignedOutDestination({
      hostname: "localhost",
      origin: "http://localhost:3000",
    }),
    "http://localhost:3000/",
  );
});

test("keeps a dual-session Auth0 logout on the admin gate until its intent is consumed", () => {
  const returnTo = tmsAdminLogoutReturnTo("https://tms.saturnusgo.com");
  assert.equal(
    returnTo,
    "https://tms.saturnusgo.com/testcases/umbrella-home/work/?auth=admin",
  );
  assert.equal(shouldUseAdminAuth(new URL(returnTo).search), true);
});

test("keeps Auth0 redirects inside the stable lowercase TMS route", () => {
  assert.equal(safeTmsReturnPath(TMS_AUTH_ROUTE_PATH), TMS_AUTH_ROUTE_PATH);
  assert.equal(
    safeTmsReturnPath(`${TMS_AUTH_ROUTE_PATH}?view=runs`),
    `${TMS_AUTH_ROUTE_PATH}?view=runs`,
  );
});

test("forces the admin provider for explicit entry and every Auth0 callback shape", () => {
  assert.equal(shouldUseAdminAuth("?auth=admin"), true);
  assert.equal(shouldUseAdminAuth("?code=authorization-code&state=opaque"), true);
  assert.equal(shouldUseAdminAuth("?error=access_denied&error_description=cancelled"), true);
  assert.equal(shouldUseAdminAuth("?workspaceId=workspace-1&projectId=project-1"), false);
});

test("allows only the two public Falcon auth return routes", () => {
  assert.equal(safeTmsReturnPath("/signup/"), "/signup/");
  assert.equal(safeTmsReturnPath("/cloud-login/"), "/cloud-login/");
  assert.equal(safeTmsReturnPath("/pricing/"), TMS_AUTH_ROUTE_PATH);
});

test("rejects external, mixed-case, and malformed return targets", () => {
  for (const candidate of [
    "https://attacker.example/testcases/umbrella-home/work/",
    "//attacker.example/testcases/umbrella-home/work/",
    "/testcases/UmbrellaHome/Work/",
    "/testcases/umbrella-home/work/unapproved-child",
    "/testcases/umbrella-home/work/\\attacker.example",
    null,
  ]) {
    assert.equal(safeTmsReturnPath(candidate), TMS_AUTH_ROUTE_PATH);
  }
});
