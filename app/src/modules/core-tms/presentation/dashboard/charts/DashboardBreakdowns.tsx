"use client";

import { useReducedMotion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DashboardDrill, DashboardSnapshot } from "../../../dashboards/model/dashboard-analytics";
import { useTmsLocale } from "../../../localization/context/useTmsLocale";
import { localizedLabel } from "../../../localization/format/labels";
import surface from "../dashboard.module.css";

const TYPE_COLORS = ["var(--dash-sand)", "var(--dash-olive)", "var(--dash-plum)"];
const DIMENSION_COLORS = [
  "var(--dash-teal)", "var(--dash-plum)", "var(--dash-sand)",
  "var(--dash-olive)", "var(--dash-coral)", "var(--dash-slate)",
];

export function DashboardBreakdowns({
  snapshot,
  onOpenDrill,
}: {
  snapshot: DashboardSnapshot;
  onOpenDrill: (drill: DashboardDrill) => void;
}) {
  const { locale, t } = useTmsLocale();
  const reduceMotion = useReducedMotion();
  const types = snapshot.caseTypes.map((item, index) => ({
    ...item, label: localizedLabel(locale, item.key), color: TYPE_COLORS[index],
    drill: { ...item.drill, label: localizedLabel(locale, item.key) },
  }));
  const tags = snapshot.tags.slice(0, 6);
  const tagMax = Math.max(...tags.map((item) => item.value), 1);
  const coverage = snapshot.hotspots.filter((item) => item.coverageRate !== null &&
    item.coveredCases !== null && item.drills.covered && item.drills.uncovered)
    .slice(0, 6).map((item) => ({
      key: item.id, label: item.label, value: item.coverageRate!,
      count: item.coveredCases!, total: item.caseCount,
      covered: item.drills.covered!, uncovered: item.drills.uncovered!,
    }));

  return (
    <div className={surface.breakdownGrid}>
      <section className={surface.chartPanel}>
        <header className={surface.panelHeading}><div><h2>{t("dashboard.byType")}</h2><p>{t("dashboard.byTypeHint")}</p></div></header>
        <div className={surface.donutWrap}>
          <div className={surface.donutChart} role="img" aria-label={t("dashboard.byType")}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip contentStyle={{ color: "var(--ink)", background: "var(--control)", border: "1px solid var(--line-strong)", borderRadius: 3, fontSize: 11 }} />
                <Pie data={types} dataKey="value" nameKey="label" innerRadius="60%" outerRadius="86%" paddingAngle={2} stroke="var(--paper)" strokeWidth={2} onClick={(_, index) => onOpenDrill(types[index].drill)} isAnimationActive={!reduceMotion}>
                  {types.map((item) => <Cell key={item.key} fill={item.color} cursor="pointer" />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className={surface.donutTotal}><strong>{snapshot.metrics.currentCases}</strong><span>{t("dashboard.testCases")}</span></div>
          </div>
          <div className={surface.dimensionList}>
            {types.map((item) => (
              <button type="button" key={item.key} onClick={() => onOpenDrill(item.drill)}>
                <i style={{ background: item.color }} aria-hidden="true" /><span>{item.label}</span><strong>{item.value}</strong>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={surface.chartPanel}>
        <header className={surface.panelHeading}><div><h2>{t("dashboard.byTag")}</h2><p>{t("dashboard.byTagHint")}</p></div></header>
        {tags.length ? <>
          <div className={surface.tagChart} role="img" aria-label={t("dashboard.byTag")}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tags} layout="vertical" margin={{ top: 8, right: 24, bottom: 2, left: 5 }}>
                <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
                <XAxis type="number" domain={[0, tagMax]} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
                <YAxis type="category" dataKey="label" width={82} axisLine={false} tickLine={false} tick={{ fill: "var(--ink)", fontSize: 10 }} />
                <Tooltip cursor={{ fill: "var(--control-hover)" }} contentStyle={{ color: "var(--ink)", background: "var(--control)", border: "1px solid var(--line-strong)", borderRadius: 3, fontSize: 11 }} />
                <Bar dataKey="value" name={t("dashboard.testCases")} radius={[0, 2, 2, 0]} maxBarSize={11} cursor="pointer" onClick={(_, index) => onOpenDrill(tags[index].drill)} isAnimationActive={!reduceMotion}>
                  {tags.map((item, index) => <Cell key={item.key} fill={DIMENSION_COLORS[index % DIMENSION_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={`${surface.chartControls} ${surface.compactControls}`}>
            {tags.map((item) => <button type="button" key={item.key} onClick={() => onOpenDrill(item.drill)}>#{item.label}<strong>{item.value}</strong></button>)}
          </div>
        </> : <p className={surface.chartEmpty}>{t("dashboard.noTags")}</p>}
      </section>

      <section className={surface.chartPanel}>
        <header className={surface.panelHeading}><div><h2>{t("dashboard.coverage")}</h2><p>{t("dashboard.coverageHint")}</p></div></header>
        {coverage.length ? <><div className={surface.coverageChart} role="img" aria-label={t("dashboard.coverage")}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={coverage} layout="vertical" margin={{ top: 8, right: 26, bottom: 2, left: 5 }}>
              <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} axisLine={false} tickLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
              <YAxis type="category" dataKey="label" width={110} axisLine={false} tickLine={false} tick={{ fill: "var(--ink)", fontSize: 10 }} />
              <Tooltip formatter={(value) => [`${value}%`, t("dashboard.coverage")]} contentStyle={{ color: "var(--ink)", background: "var(--control)", border: "1px solid var(--line-strong)", borderRadius: 3, fontSize: 11 }} />
              <Bar dataKey="value" radius={[0, 2, 2, 0]} maxBarSize={14} cursor="pointer" onClick={(_, index) => onOpenDrill(coverage[index].covered)} isAnimationActive={!reduceMotion}>
                {coverage.map((item, index) => <Cell key={item.key} fill={DIMENSION_COLORS[index % DIMENSION_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={surface.coverageList}>
          {coverage.map((item, index) => (
            <div className={surface.coverageActions} key={item.key}>
              <button type="button" onClick={() => onOpenDrill(item.covered)}>
                <i aria-hidden="true" style={{ background: DIMENSION_COLORS[index % DIMENSION_COLORS.length] }} />
                <span>{item.label}<small>{t("dashboard.coveredOfTotal", { covered: item.count, total: item.total })}</small></span>
                <strong>{item.value}%</strong>
              </button>
              <button type="button" className={surface.coverageGap} onClick={() => onOpenDrill(item.uncovered)}
                aria-label={`${t("dashboard.uncovered")}: ${item.total - item.count}`}>
                {t("dashboard.uncoveredShort")} {item.total - item.count}
              </button>
            </div>
          ))}
        </div>
        </> : <p className={surface.chartEmpty}>{t("dashboard.noCoverage")}</p>}
      </section>
    </div>
  );
}
