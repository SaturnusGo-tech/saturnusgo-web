"use client";

import useReveal from "../../../../../shared/lib/useReveal";
import {
  openCoreInvestorsDeck,
  scrollToCoreInvestorsCta,
} from "../../../services";
import type { CoreInvestorsControllerModel } from "../../../types";

export function useCoreInvestorsController(): CoreInvestorsControllerModel {
  useReveal();

  return {
    onIntroCtaClick: scrollToCoreInvestorsCta,
    onOpenDeck: openCoreInvestorsDeck,
  };
}
