import type { MemberDraft } from "../../domain/administration";
import { AnimatedSelect } from "../../../presentation/common/select/AnimatedSelect";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";

export function RoleField({ role, disabled, allowAdmin, onChange }: {
  readonly role: MemberDraft["role"]; readonly disabled: boolean; readonly allowAdmin: boolean; readonly onChange: (role: MemberDraft["role"]) => void;
}) {
  const { locale } = useTmsLocale();
  const roles = [{ value: "workspace_admin", ru: "Администратор", en: "Administrator" }, { value: "qa_manager", ru: "QA-менеджер", en: "QA manager" },
    { value: "tester", ru: "Тестировщик", en: "Tester" }, { value: "reporter", ru: "Репортёр", en: "Reporter" }, { value: "viewer", ru: "Наблюдатель", en: "Viewer" }] as const;
  const options = roles.filter((item) => allowAdmin || item.value !== "workspace_admin").map((item) => ({ value: item.value, label: item[locale] }));
  return <AnimatedSelect label={locale === "ru" ? "Роль" : "Role"} value={role} options={options} disabled={disabled}
    onChange={(value) => { const match = roles.find((item) => item.value === value); if (match) onChange(match.value); }} />;
}
