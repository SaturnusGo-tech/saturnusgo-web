import { Button } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { IntegrationInput } from "../../../presentation/common/integration-controls/input/IntegrationInput";
import type { DataTable } from "../../model/workspace/data-table";
import css from "./data-table.module.css";

export function DataResultTable({ table, ru, label, pagination }: { table: DataTable; ru: boolean; label: string; pagination?: { index: number; hasNext: boolean; busy?: boolean; onChange(index: number): void } }) {
  const [search, setSearch] = useState(""), [page, setPage] = useState(0), size = 50;
  const rows = table.rows.filter(row => Object.values(row).some(value => String(value ?? "").toLocaleLowerCase().includes(search.toLocaleLowerCase())));
  const current = Math.min(pagination ? 0 : page, Math.max(0, Math.ceil(rows.length / size) - 1)), start = current * size, visible = rows.slice(start, start + size);
  const first = pagination ? pagination.index * size : start;
  return <section className={css.section} aria-label={label}>
    <div className={css.toolbar}><div className={css.search}><IntegrationInput aria-label={ru ? "Поиск на странице" : "Search this page"} placeholder={ru ? "Поиск на странице" : "Search this page"}
      value={search} onValueChange={value => { setSearch(value); setPage(0); }} /></div>
      <span className={css.metadata}>{rows.length} {ru ? "строк" : "rows"}{table.durationMs != null ? ` · ${table.durationMs} ms` : ""}</span></div>
    <div className={css.scroll} tabIndex={0} aria-label={label}><table className={css.table}><thead><tr>{table.columns.map(column => <th key={column.name} title={column.type}>{column.name}</th>)}</tr></thead>
      <tbody>{visible.map((row, index) => <tr key={start + index}>{table.columns.map(column => <td key={column.name}><span className={row[column.name] == null ? css.null : undefined}>
        {row[column.name] == null ? "null" : String(row[column.name])}</span></td>)}</tr>)}</tbody></table>
      {!visible.length && <p className={css.empty}>{ru ? "Нет подходящих строк" : "No matching rows"}</p>}</div>
    <footer className={css.footer}><span>{rows.length ? `${first + 1}–${first + visible.length}` : "0"}{!pagination && ` ${ru ? "из" : "of"} ${rows.length}`}
      {table.truncated ? (ru ? " · показано ограниченное число строк" : " · row limit reached") : ""}</span>
      <div className={css.pagination}><Button type="button" isIconOnly disableRipple aria-label={ru ? "Предыдущая страница" : "Previous page"} isDisabled={pagination ? pagination.busy || pagination.index === 0 : current === 0} className={css.page} onPress={() => pagination ? pagination.onChange(pagination.index - 1) : setPage(current - 1)}><ChevronLeft size={16} /></Button>
        <span>{(pagination?.index ?? current) + 1}</span><Button type="button" isIconOnly disableRipple aria-label={ru ? "Следующая страница" : "Next page"} isDisabled={pagination ? pagination.busy || !pagination.hasNext : start + size >= rows.length} className={css.page} onPress={() => pagination ? pagination.onChange(pagination.index + 1) : setPage(current + 1)}><ChevronRight size={16} /></Button></div></footer>
  </section>;
}
