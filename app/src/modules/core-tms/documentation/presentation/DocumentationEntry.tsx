"use client";
import dynamic from "next/dynamic";

export const DocumentationEntry = dynamic(() => import("./DocumentationView").then((module) => module.DocumentationView), {
  loading: () => <div role="status" style={{ padding: 32 }}>Загружаем руководство Falcon…</div>,
});
