import type { CompanyMember } from "../../domain/administration";

export function memberRoleLabel(role: CompanyMember["role"], locale: "ru" | "en") {
  const labels = {
    workspace_admin: { ru: "Администратор", en: "Administrator" }, qa_manager: { ru: "QA-менеджер", en: "QA manager" },
    tester: { ru: "Тестировщик", en: "Tester" }, reporter: { ru: "Репортёр", en: "Reporter" }, viewer: { ru: "Наблюдатель", en: "Viewer" },
  };
  return labels[role][locale];
}
