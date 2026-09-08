"use client";
import dynamic from "next/dynamic";
import { TessiqLoader } from "../../presentation/common/loading/TessiqLoader";

export const DocumentationEntry = dynamic(() => import("./DocumentationView").then((module) => module.DocumentationView), {
  loading: () => <TessiqLoader pane label="Falcon documentation" />,
});
