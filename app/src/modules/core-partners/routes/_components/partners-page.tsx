import { Suspense } from "react"
import type { Metadata } from "next"
import PartnersSection from "./partners-showcase"

export const metadata: Metadata = {
  title: "Partners — SaturnusGo",
  description:
    "Discover our trusted hospitality partners powering the future of dining, accommodation, and event experiences.",
}

const partners = [
  {
    id: "marriott",
    name: "Marriott",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Marriott_logo_PNG1.png",
    category: "hospitality" as const,
    partnership_type: "integration" as const,
    established: "2025",
    status: "active" as const,
    description:
      "Global hospitality leader with premium hotel experiences and innovative guest services across 130+ countries.",
    employees: "174K+",
    revenue: "$20.8B",
    locations: "8,000+",
    website: "https://marriott.com",
  },
  {
    id: "hyatt",
    name: "Hyatt",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Hyatt_logo_PNG2.png",
    category: "hospitality" as const,
    partnership_type: "strategic" as const,
    established: "2025",
    status: "expanding" as const,
    description:
      "Premium hospitality brand focused on purposeful hospitality and creating meaningful experiences for guests worldwide.",
    employees: "45K+",
    revenue: "$6.2B",
    locations: "1,150+",
    website: "https://hyatt.com",
  },
  {
    id: "ritz-carlton",
    name: "Ritz-Carlton",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Ritz-Carlton-Logo_PNG2.png",
    category: "hospitality" as const,
    partnership_type: "integration" as const,
    established: "2025",
    status: "active" as const,
    description:
      "Luxury hospitality brand renowned for exceptional service and creating unforgettable experiences in the world's most desirable destinations.",
    employees: "40K+",
    revenue: "$4.5B",
    locations: "110+",
    website: "https://ritzcarlton.com",
  },
  {
    id: "courtyard",
    name: "Courtyard",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Courtyard_logo_PNG2.png",
    category: "hospitality" as const,
    partnership_type: "technology" as const,
    established: "2025",
    status: "pilot" as const,
    description:
      "Modern hotel brand designed for business travelers, offering smart spaces and seamless connectivity for productive stays.",
    employees: "25K+",
    revenue: "$3.1B",
    locations: "1,200+",
    website: "https://marriott.com/courtyard",
  },
  {
    id: "accor",
    name: "Accor",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Accor_logo_PNG3.png",
    category: "hospitality" as const,
    partnership_type: "strategic" as const,
    established: "2025",
    status: "active" as const,
    description:
      "European hospitality leader with diverse portfolio of brands, from luxury to economy, serving guests across 110+ countries.",
    employees: "260K+",
    revenue: "$4.7B",
    locations: "5,300+",
    website: "https://accor.com",
  },
]

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <div
            className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-accent rounded-full animate-spin animate-reverse"
            style={{ animationDuration: "1.5s" }}
          />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Loading partners...</p>
      </div>
    </div>
  )
}

export default function PartnersPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<LoadingSpinner />}>
        <PartnersSection partners={partners} />
      </Suspense>
    </div>
  )
}
