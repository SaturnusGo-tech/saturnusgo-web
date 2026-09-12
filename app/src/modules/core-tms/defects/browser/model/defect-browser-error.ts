export class DefectBrowserAccessError extends Error {
  constructor() { super("Defect access is unavailable"); this.name = "DefectBrowserAccessError"; }
}
