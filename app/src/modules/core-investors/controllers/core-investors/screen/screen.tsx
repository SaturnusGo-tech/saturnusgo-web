"use client";

import { CoreInvestorsView } from "../../../ui";
import { useCoreInvestorsController } from "../hook/hook";

export default function CoreInvestorsScreen() {
  const controller = useCoreInvestorsController();

  return <CoreInvestorsView {...controller} />;
}
