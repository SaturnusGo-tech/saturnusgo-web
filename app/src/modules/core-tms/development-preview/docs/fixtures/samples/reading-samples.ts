import type { ProductDocDetail } from "../../../../product-docs/domain/product-docs";

const readingHref = (id: string) => `/work/?workspaceId=preview&projectId=host&view=product-docs&docId=${id}`;
const caseHref = (id: number) => `/work/?workspaceId=preview&projectId=host&caseId=case_${id}`;

export function createReadingSamples(ru: boolean) {
  const t = (en: string, ruText: string) => ru ? ruText : en;
  const cases = [
    t("Retry calendar loading after a network error", "Повтор загрузки календаря после ошибки сети"),
    t("Retain the selected date after reopening", "Сохранение выбранной даты при повторном открытии"),
    t("Restore the calendar after unlocking the device", "Возврат к календарю после разблокировки устройства"),
  ].map((title, i) => ({ caseId: `case_${i + 1}`, title, sectionId: null }));
  const docs: Omit<ProductDocDetail, "lifecycleVersion" | "canArchive" | "canDelete">[] = [{ id: "calendar", parentId: null, kind: "page",
    title: t("Host calendar", "Календарь хоста"), draftVersion: 3, publishedVersion: 2, version: 2,
    canEdit: true, canPublish: true, properties: { priority: "high", labels: ["calendar", "mobile"],
      assignee: { identityId: "qa", displayName: "Alex Morgan" } },
    sections: [{ id: "intro", title: "", markdown: t(
      "The calendar keeps bookings, service visits and automation runs in one place. Start here to understand the expected behavior and choose a regression check.",
      "Календарь объединяет бронирования, визиты и запуски автоматизации. Здесь описано ожидаемое поведение и собраны проверки для регрессии.") },
    { id: "behavior", title: t("What must remain stable", "Что должно сохраняться"), markdown: [
      t("- **Date and scale** stay unchanged after a background refresh.\n- **Service focus** moves only after an explicit selection.\n- **Recovery** retains the last successful view.",
        "- **Дата и масштаб** сохраняются после фонового обновления.\n- **Фокус услуги** меняется только при явном выборе.\n- **Восстановление** возвращает последний доступный экран."),
      `:::note\n${t("A short network failure must :highlight[not reset the user's place]{color=\"yellow\"} in the calendar.",
        "Краткий сбой сети :highlight[не должен сбрасывать положение пользователя]{color=\"yellow\"} в календаре.")}\n:::`,
      `${t("See", "Подробнее")}: [${t("Errors and recovery", "Ошибки и восстановление")}](${readingHref("recovery")}).`,
    ].join("\n\n") },
    { id: "coverage", title: t("Regression coverage", "Проверки регрессии"), markdown: [
      t("Use the group column to keep your context while scrolling across the evidence and expected outcomes.", "Первый столбец сохраняет контекст группы при прокрутке результатов и источников."),
      `| ${t("Group", "Группа")} | ${t("Key checks", "Ключевые проверки")} | ${t("Related cases", "Связанные кейсы")} | ${t("Expected result", "Ожидаемый результат")} | ${t("Evidence", "Артефакты")} |`,
      "| --- | --- | --- | --- | --- |",
      ...[t("Network recovery", "Сеть"), t("Background", "Фоновый режим"), t("Device lock", "Блокировка")].map((group, i) =>
        `| ${group} | ${t("Preserve the active calendar context and restore events after the connection returns.", "Сохранить контекст календаря и обновить события после восстановления соединения.")} | [${cases[i].title}](${caseHref(i + 1)}) | ${t("Date, focus and scale are preserved; only event data is refreshed.", "Дата, фокус и масштаб сохраняются; обновляются только события.")} | ${t("Compare the selected date and service before and after recovery.", "Сравнить выбранную дату и услугу до и после восстановления.")} |`),
    ].join("\n\n").replace(/\|\n\n\|/g, "|\n|") },
    { id: "next", title: t("Next steps", "Дальнейшие действия"), markdown: `- [ ] ${t("Choose the cases for the target build.", "Выбрать кейсы для целевой сборки.")}\n- [ ] ${t("Attach observed results to the run.", "Прикрепить фактические результаты к прогону.")}\n\n---\n\n[${t("Errors, retained state and recovery", "Ошибки, сохранение состояния и восстановление")}](${readingHref("recovery")})` }],
    activity: { created: { identityId: "qa", displayName: "Alex Morgan", at: "2026-11-12T03:00:00Z" } } },
    { id: "recovery", parentId: "calendar", kind: "page", title: t("Errors and recovery", "Ошибки и восстановление"),
      draftVersion: 1, publishedVersion: null, version: null, canEdit: true, canPublish: true,
      sections: [{ id: "retry", title: t("Network failure", "Сбой сети"), markdown: `:::caution\n${t("Keep the last successful calendar visible while the network is unavailable.", "Пока сеть недоступна, сохраняйте последний загруженный календарь на экране.")}\n:::\n\n${t("The selected date and service stay unchanged. After reconnection, update events without resetting the view.", "Выбранная дата и услуга остаются прежними. После восстановления связи обновляются события без сброса экрана.")}` }] }];
  return { docs, cases };
}
