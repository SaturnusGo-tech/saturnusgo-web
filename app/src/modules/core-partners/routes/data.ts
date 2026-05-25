export interface Partner {
  id: string
  name: string
  logo: string
  category: string
  partnership_type: string
  established: string
  status: string
  description?: string
  website?: string
  employees?: string
  revenue?: string
  locations?: string
}

export const partners: Partner[] = [
  {
    id: "marriott",
    name: "Marriott International",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Marriott_logo_PNG1.png",
    category: "hospitality",
    partnership_type: "integration",
    established: "2025",
    status: "active",
    description:
      "Global hospitality leader with over 8,000 properties worldwide. Our integration enables seamless booking and loyalty program synchronization across all Marriott brands.",
    website: "https://marriott.com",
    employees: "174,000+",
    revenue: "$23.7B",
    locations: "139 countries",
  },
  {
    id: "hyatt",
    name: "Hyatt Hotels Corporation",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Hyatt_logo_PNG2.png",
    category: "hospitality",
    partnership_type: "strategic",
    established: "2025",
    status: "expanding",
    description:
      "Premium hospitality brand focused on care and personal service. Partnership includes exclusive access to World of Hyatt benefits and personalized guest experiences.",
    website: "https://hyatt.com",
    employees: "45,000+",
    revenue: "$6.2B",
    locations: "70+ countries",
  },
  {
    id: "ritz-carlton",
    name: "The Ritz-Carlton",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Ritz-Carlton-Logo_PNG2.png",
    category: "hospitality",
    partnership_type: "integration",
    established: "2025",
    status: "active",
    description:
      "Luxury hospitality brand renowned for exceptional service and memorable experiences. Integration provides VIP treatment and exclusive amenities for our premium users.",
    website: "https://ritzcarlton.com",
    employees: "40,000+",
    revenue: "$4.9B",
    locations: "34 countries",
  },
  {
    id: "courtyard",
    name: "Courtyard by Marriott",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Courtyard_logo_PNG2.png",
    category: "hospitality",
    partnership_type: "integration",
    established: "2025",
    status: "pilot",
    description:
      "Modern hotels designed for business travelers and modern nomads. Pilot program focuses on seamless check-in/out and workspace booking integration.",
    website: "https://marriott.com/courtyard",
    employees: "25,000+",
    locations: "50+ countries",
  },
  {
    id: "accor",
    name: "Accor Group",
    logo: "https://wjfhdyynywkjudwlouxv.supabase.co/storage/v1/object/public/Video-host/Accor_logo_PNG3.png",
    category: "hospitality",
    partnership_type: "strategic",
    established: "2025",
    status: "active",
    description:
      "European hospitality leader with diverse portfolio from luxury to economy. Strategic alliance covers loyalty integration and co-marketing initiatives across Europe.",
    website: "https://accor.com",
    employees: "300,000+",
    revenue: "$4.7B",
    locations: "110 countries",
  },
]
