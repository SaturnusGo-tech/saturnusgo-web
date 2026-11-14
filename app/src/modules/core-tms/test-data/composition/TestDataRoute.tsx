import { useTdmAvailability } from "../application/availability/TdmAvailability";
import { useTestData } from "../application/context/TestDataContext";
import { TestDataLibrary } from "../presentation/library/TestDataLibrary";
import { DataFeedback } from "../presentation/shared/DataFeedback";
import { useTmsLocale } from "../../localization/context/useTmsLocale";
export function TestDataRoute({ onOpenCase }: { onOpenCase(id: string): void }) {
  const availability = useTdmAvailability(), feature = useTestData(), { locale } = useTmsLocale();
  if (availability.pending || availability.error) return <DataFeedback loading={availability.pending} error={availability.error} ru={locale === "ru"} retry={availability.retry} />;
  if (!feature) return <DataFeedback denied ru={locale === "ru"} />;
  return <TestDataLibrary onOpenCase={onOpenCase} />;
}
