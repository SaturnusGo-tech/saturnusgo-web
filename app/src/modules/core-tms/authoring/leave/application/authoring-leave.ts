import { AuthoringLeaveCoordinator } from "./leave-coordinator";

export const authoringLeave = new AuthoringLeaveCoordinator();
export const requestAuthoringLeave = (action: Parameters<AuthoringLeaveCoordinator["request"]>[0]) => authoringLeave.request(action);
