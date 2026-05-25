"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"            // <html class="light|dark">
      defaultTheme="dark"          // дефолт — как было
      enableSystem={false}         // без «system», по вашему требованию
      storageKey="sg-theme"        // ключ сохранения
      disableTransitionOnChange    // без анимационных артефактов при смене
    >
      {children}
    </NextThemesProvider>
  )
}
