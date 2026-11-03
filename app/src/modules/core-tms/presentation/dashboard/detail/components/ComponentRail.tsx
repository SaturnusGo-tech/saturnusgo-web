import { useEffect } from "react";
import { useTmsLocale } from "../../../../localization/context/useTmsLocale";
import type { DashboardDrillFilter, DashboardProductFilters } from "../../../../dashboards/model/dashboard-analytics";
import { useCustomFieldCatalog } from "../../../../custom-fields/state/catalog/useCustomFieldCatalog";
import { useParentValue } from "../../../../custom-fields/state/parent/useParentValue";
import { CustomFieldPicker } from "../../../../custom-fields/presentation/picker/CustomFieldPicker";
import { AnimatedSelect } from "../../../common/select/AnimatedSelect";
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
  const active = Boolean(filter.productGroupId || filter.productId || filter.regression !== undefined);
  return <section className={styles.fields} aria-label={ru ? "Поля тест-кейсов" : "Test case fields"}>
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
    <div className={styles.field}><span>{ru ? "Регресс" : "Regression"}</span>
      <AnimatedSelect compact label={ru ? "Регресс" : "Regression"} value={filter.regression === undefined ? "all" : String(filter.regression)}
        onChange={value => onSelect({ ...selected, regression: value === "all" ? undefined : value === "true" })}
        options={[{ value: "all", label: ru ? "Все" : "All" }, { value: "true", label: ru ? "Да" : "Yes" }, { value: "false", label: ru ? "Нет" : "No" }]} /></div>
    {(filter.component !== undefined || filter.componentIsEmpty) && <p>{ru ? "Сохранённый фильтр продукта:" : "Saved product filter:"} {filter.component || (ru ? "Без продукта" : "No product")}</p>}
    {(groupValue.failure || productValue.failure) ? <p role="alert">{ru ? "Не удалось загрузить выбранное значение." : "Could not load the selected value."}</p> : null}
    {active && <button className={styles.reset} type="button" onClick={() => onSelect({})}>{ru ? "Сбросить поля продукта" : "Reset product scope"}</button>}
  </section>;
}
