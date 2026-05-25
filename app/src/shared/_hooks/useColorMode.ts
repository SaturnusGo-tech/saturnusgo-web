"use client"

import { useTheme } from "next-themes"

type TogglePos = { x: number; y: number }

export function useColorMode() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const current = (resolvedTheme ?? theme) as "light" | "dark" | undefined
  const isLight = current === "light"

  function toggleBase(next: "light" | "dark") {
    setTheme(next)
  }

  function toggleAnimated(pos?: TogglePos) {
    const html = document.documentElement
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches

    const x = pos?.x ?? window.innerWidth / 2
    const y = pos?.y ?? window.innerHeight / 2

    // Fallback: мягкий CSS-переход без View Transitions
    if (reduce || !("startViewTransition" in document)) {
      html.classList.add("theme-fade")
      toggleBase(isLight ? "dark" : "light")
      setTimeout(() => html.classList.remove("theme-fade"), 320)
      return
    }

    // View Transitions: радиальный reveal из точки клика
    html.style.setProperty("--vt-x", `${x}px`)
    html.style.setProperty("--vt-y", `${y}px`)
    html.dataset.themeFrom = isLight ? "light" : "dark"
    html.classList.add("theme-switching")

    // @ts-ignore — типы для startViewTransition ещё в пути
    const vt = document.startViewTransition(() => {
      toggleBase(isLight ? "dark" : "light")
    })

    vt.finished.finally(() => {
      html.classList.remove("theme-switching")
      html.style.removeProperty("--vt-x")
      html.style.removeProperty("--vt-y")
      delete html.dataset.themeFrom
    })
  }

  return {
    theme: current,
    isLight,
    setLight: () => toggleBase("light"),
    setDark: () => toggleBase("dark"),
    toggle: () => toggleBase(isLight ? "dark" : "light"),
    toggleAnimated,
  }
}
