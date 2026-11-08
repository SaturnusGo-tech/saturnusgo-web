import type { DocBlock } from "../../../model/article";

export function releaseSmokeFigure(locale: "en" | "ru"): DocBlock {
  const ru = locale === "ru";
  return {
    kind: "bar-chart",
    title: ru ? "Дымовая проверка релиза" : "Release smoke check",
    summary: ru ? "Пример · 12 проверок" : "Example · 12 checks",
    maximum: 12,
    bars: [
      { label: ru ? "Пройдены" : "Passed", value: 8, tone: "pass" },
      { label: ru ? "С ошибкой" : "Failed", value: 2, tone: "fail" },
      { label: ru ? "Ожидают" : "Pending", value: 2, tone: "pending" },
    ],
  };
}
