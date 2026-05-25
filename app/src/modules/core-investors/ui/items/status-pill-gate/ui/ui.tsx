"use client"

import { usePathname } from "next/navigation"
import StatusPill from '../../status-pill'

export default function StatusPillGate() {
  const pathname = usePathname()

  const show =
    pathname === "/" ||
    pathname === "/investor" ||
    pathname === "/investors" ||
    pathname === "/founder"

  if (!show) return null
  return <StatusPill />
}
