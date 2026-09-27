import { useEffect } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { DashboardDrillFilter, DashboardProductFilters } from "../../../../dashboards/model/dashboard-analytics";
import { useCustomFieldCatalog } from "../../../../custom-fields/state/catalog/useCustomFieldCatalog";
import { useParentValue } from "../../../../custom-fields/state/parent/useParentValue";
import { CustomFieldPicker } from "../../../../custom-fields/presentation/picker/CustomFieldPicker";
import styles from "./productRail.module.css";
export function ComponentRail({ workspaceId, projectId, filter, onSelect }: {
  workspaceId: string; projectId: string; filter: DashboardDrillFilter;
  onSelect(value: DashboardProductFilters, label?: string): void;
}) {
  const { locale } = useTmsLocale(); const ru = locale === "ru";
  const catalog = useCustomFieldCatalog(workspaceId, projectId);
  const group = catalog.items.find(field => field.systemKey === "product_group");
  const product = catalog.items.find(field => field.systemKey === "product");
  useEffect(() => { if ((!group || !product) && catalog.cursor && !catalog.pending && !catalog.loading && !catalog.failure) void catalog.more(); },
    [group, product, catalog.cursor, catalog.pending, catalog.loading, catalog.failure, catalog.more]);
  const scope = { workspaceId, projectId };
  const groupValue = useParentValue(scope, group?.id ?? null, filter.productGroupId ?? null);
  const productValue = useParentValue(scope, product?.id ?? null, filter.productId ?? null);
  const selected = { productGroupId: filter.productGroupId, productId: filter.productId, regression: filter.regression };
  const active = Boolean(filter.productGroupId || filter.productId || filter.regression !== undefined || filter.component !== undefined || filter.componentIsEmpty);
  return <aside className={styles.rail} aria-label={ru ? "Поля тест-кейсов" : "Test case fields"}>
    <h2>{ru ? "Поля тест-кейсов" : "Test case fields"}</h2>
    {catalog.loading && <p role="status">{ru ? "Загрузка…" : "Loading…"}</p>}
    {!!catalog.failure && <p role="alert">{ru ? "Не удалось загрузить поля." : "Could not load fields."} <button type="button" onClick={catalog.refresh}>{ru ? "Повторить" : "Retry"}</button></p>}
    {group && <div className={styles.field}><span>{ru ? "Группа продуктов" : "Product group"}</span>
      <CustomFieldPicker {...scope} field={group} selected={groupValue.value ? [groupValue.value] : []}
        disabled={groupValue.loading} placeholder={ru ? "Все группы" : "All groups"}
        onChange={values => onSelect({ productGroupId: values[0]?.id, regression: selected.regression }, values[0]?.label)} /></div>}
    {product && <div className={styles.field}><span>{ru ? "Продукт" : "Product"}</span>
      <CustomFieldPicker {...scope} field={product} selected={productValue.value ? [productValue.value] : []}
        disabled={productValue.loading} parentValueId={filter.productGroupId} placeholder={ru ? "Все продукты" : "All products"}
        onChange={values => onSelect({ ...selected, productId: values[0]?.id,
          productGroupId: values[0] ? values[0].parentValueId ?? undefined : selected.productGroupId }, values[0]?.label)} /></div>}
    <label className={styles.field}><span>{ru ? "Регресс" : "Regression"}</span>
      <select value={filter.regression === undefined ? "all" : String(filter.regression)}
        onChange={event => onSelect({ ...selected, regression: event.target.value === "all" ? undefined : event.target.value === "true" })}>
        <option value="all">{ru ? "Все" : "All"}</option><option value="true">{ru ? "Да" : "Yes"}</option><option value="false">{ru ? "Нет" : "No"}</option>
      </select></label>
    {(filter.component !== undefined || filter.componentIsEmpty) && <p>{ru ? "Сохранённый фильтр продукта:" : "Saved product filter:"} {filter.component || (ru ? "Без продукта" : "No product")}</p>}
    {(groupValue.failure || productValue.failure) ? <p role="alert">{ru ? "Не удалось загрузить выбранное значение." : "Could not load the selected value."}</p> : null}
    {active && <button className={styles.reset} type="button" onClick={() => onSelect({})}>{ru ? "Сбросить" : "Reset"}</button>}
  </aside>;
}
