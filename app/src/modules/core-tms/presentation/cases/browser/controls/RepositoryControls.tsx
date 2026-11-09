import { useMemo } from "react";
import type { CasesViewProps } from "../../types";
import type { useCasesViewController } from "../../view/useCasesViewController";
import type { TmsLocale } from "../../../../localization/model/locale";
import { RepositoryQueryControls } from "./RepositoryQueryControls";

export function RepositoryControls({ props, view, locale }: {
  props: CasesViewProps; view: ReturnType<typeof useCasesViewController>; locale: TmsLocale;
}) {
  const tags = useMemo(() => [...new Set(props.testCases.flatMap(item => item.tags))].sort(), [props.testCases]);
  return <RepositoryQueryControls locale={locale} query={props.query} onQuery={props.onQuery} qlQuery={view.qlQuery} onQlQuery={view.setQlQuery}
    filters={props.filters} onFilters={props.onFilters} facets={view.facetFilters} onFacets={view.setFacetFilters}
    options={view.facetOptions} tags={tags} directory={view.directory} filterOpen={view.filterOpen} onFilterOpen={view.setFilterOpen} />;
}
