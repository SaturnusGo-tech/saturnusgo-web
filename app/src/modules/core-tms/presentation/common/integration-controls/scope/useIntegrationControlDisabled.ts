"use client";
import { useContext } from "react";
import { IntegrationControlContext } from "./IntegrationControlScope";

export function useIntegrationControlDisabled(isDisabled = false): boolean {
  return useContext(IntegrationControlContext) || isDisabled;
}
