import assert from "node:assert/strict";
import {test} from "node:test";
import {componentHarness,nodes,invoke} from "../../../portfolios/tests/support/component-harness";
import type {LegalFields} from "../../presentation/fields/LegalFields";
import type {CompanyDetailsForm} from "../../presentation/company-edit/CompanyDetailsForm";
import {administrationCopy} from "../../presentation/copy/administration-copy";
const legal={legalName:null,countryCode:null,legalForm:"",taxId:"",registrationId:"",taxBranchId:"",legalAddress:""};
test("optional legal inputs render absent values empty and do not claim a required legal name or country",()=>{
 const h=componentHarness();let changed:unknown;
 const {LegalFields:View}=h.load<{LegalFields:typeof LegalFields}>(new URL("../../presentation/fields/LegalFields.tsx",import.meta.url));
 const all=nodes(h.render(()=>View({legal,optional:true,copy:administrationCopy("en"),disabled:false,onChange:value=>{changed=value;}} as Parameters<typeof LegalFields>[0])));
 const fields=all.filter(node=>node.type==="AccessField");assert.equal(fields[0].props.value,"");assert.equal(fields[0].props.required,false);assert.equal(fields[1].props.required,false);
 invoke(fields[0],"onChange",{target:{value:""}});assert.equal((changed as typeof legal).legalName,null);
});
test("renaming a new Startup preserves missing legal facts instead of inventing a company legal name",()=>{
 const h=componentHarness();let submitted:unknown;
 const {CompanyDetailsForm:View}=h.load<{CompanyDetailsForm:typeof CompanyDetailsForm}>(new URL("../../presentation/company-edit/CompanyDetailsForm.tsx",import.meta.url),name=>{
  if(name.endsWith("useTmsLocale"))return{useTmsLocale:()=>({locale:"en"})};if(name.endsWith("administration-copy"))return{administrationCopy};
 });
 const all=nodes(h.render(()=>View({company:{name:"Team",legal,accessContactEmail:"owner@example.test"} as Parameters<typeof CompanyDetailsForm>[0]["company"],pending:false,onChange:async value=>{submitted=value;}})));
 assert.equal(all.find(node=>node.type==="LegalFields")!.props.optional,true);
 invoke(all.find(node=>node.type==="form")!,"onSubmit",{preventDefault(){}});assert.equal((submitted as {legal:typeof legal}).legal.legalName,null);
});
