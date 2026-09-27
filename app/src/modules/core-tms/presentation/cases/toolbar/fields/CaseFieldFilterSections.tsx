import { Box, Layers, RotateCcw } from "lucide-react";
import type { CaseFacetFilters, CaseFacetOptions } from "../../model/caseListModel";
import type { ExtraFilterSection } from "../CasesToolbarPopovers";
import { RunFilterOptions } from "../../../runs/filters/options/RunFilterOptions";
export function caseFieldFilterSections(facets: CaseFacetFilters, options: CaseFacetOptions, onChange:(value:CaseFacetFilters)=>void, ru:boolean):ExtraFilterSection[] {
  const all=ru?"Все":"All";
  const definitions=[{id:"productGroups" as const,label:ru?"Группы продуктов":"Product groups",icon:<Layers size={16}/>},
    {id:"products" as const,label:ru?"Продукты":"Products",icon:<Box size={16}/>}];
  return [...definitions.map(({id,label,icon})=>({id,label,icon,active:Boolean(facets[id]?.length),summary:String(facets[id]?.length ?? 0),
    render:()=> <RunFilterOptions label={label} multiple selected={facets[id]?.length?facets[id]!: ["all"]}
      options={[{value:"all",label:all},...(options[id]??[]).map(value=>({value:value.id,label:value.label}))]}
      placeholder={ru?"Поиск":"Search"} onChange={value=>onChange({...facets,[id]:value==="all"?[]:facets[id]?.includes(value)?facets[id]!.filter(item=>item!==value):[...(facets[id]??[]),value]})}/>})),
    {id:"regression",label:ru?"Регресс":"Regression",icon:<RotateCcw size={16}/>,active:facets.regression!==undefined,summary:facets.regression===undefined?all:String(facets.regression),
      render:()=> <RunFilterOptions label={ru?"Регресс":"Regression"} selected={[facets.regression===undefined?"all":String(facets.regression)]}
        options={[{value:"all",label:all},{value:"true",label:"true"},{value:"false",label:"false"}]} placeholder={ru?"Поиск":"Search"}
        onChange={value=>onChange({...facets,regression:value==="all"?undefined:value==="true"})}/>}];
}
