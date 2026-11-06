import type { StartupSetup } from "../../../domain/startup-setup";
export type CompanyValues = { displayName: string; slug: string; legalName: string; countryCode: string; taxId: string; address: string };
export type CompanyStage = "name" | "address" | "legal" | "consent" | "preparing";
export function companyValues(setup: StartupSetup | null): CompanyValues {
  return { displayName: setup?.displayName ?? "", slug: setup?.slug ?? "", legalName: setup?.legalName ?? "", countryCode: setup?.countryCode ?? "", taxId: setup?.taxId ?? "", address: setup?.address ?? "" };
}
const cyrillic: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"i",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
export function companySlug(name: string) {
  return [...name.toLowerCase()].map(char => cyrillic[char] ?? char).join("").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48).replace(/-+$/g, "");
}
export function sameCompanyValues(a: CompanyValues, b: CompanyValues) { return Object.keys(a).every(key => a[key as keyof CompanyValues] === b[key as keyof CompanyValues]); }
