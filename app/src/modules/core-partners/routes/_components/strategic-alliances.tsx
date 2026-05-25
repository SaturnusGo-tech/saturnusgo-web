"use client"

import { useMemo } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Clock, ExternalLink, Sparkles, Zap } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"


export interface Partner {
  id: string
  name: string
  logo: string
  website?: string
  category?: "technology" | "integration" | "strategic"
  description?: string
  partnership_type?: "strategic" | "integration" | "technology"
  established?: string
  status?: "active" | "pilot" | "expanding"
}

interface StrategicAlliancesProps {
  partners?: Partner[]
}

const statusConfig = {
  active: {
    color: "hsl(var(--primary))",
    icon: CheckCircle,
    label: "Active",
    bgColor: "hsl(var(--primary) / 0.1)",
    borderColor: "hsl(var(--primary) / 0.2)",
  },
  pilot: {
    color: "hsl(var(--secondary-foreground))",
    icon: Clock,
    label: "Pilot",
    bgColor: "hsl(var(--secondary) / 0.5)",
    borderColor: "hsl(var(--secondary))",
  },
  expanding: {
    color: "hsl(var(--accent-foreground))",
    icon: Zap,
    label: "Expanding",
    bgColor: "hsl(var(--accent) / 0.5)",
    borderColor: "hsl(var(--accent))",
  },
} as const

const partnershipTypeLabels = {
  integration: "Technology Integration",
  strategic: "Strategic Alliance",
  technology: "Technology Partner",
} as const

const PartnerListItem = ({ partner, index }: { partner: Partner; index: number }) => {
  const statusInfo = partner.status ? statusConfig[partner.status] : undefined
  const StatusIcon = statusInfo?.icon || CheckCircle

  const meta = useMemo(() => {
    const items: string[] = []
    if (partner.partnership_type)
      items.push(partnershipTypeLabels[partner.partnership_type] ?? partner.partnership_type)
    if (partner.established) items.push(`Since ${partner.established}`)
    return items
  }, [partner.partnership_type, partner.established])

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group"
    >
      <Card className="h-full overflow-hidden border-border/40 bg-gradient-to-b from-background to-muted/10 backdrop-blur transition-all hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-muted/50 border flex items-center justify-center overflow-hidden">
                <img
                  src={partner.logo || "/placeholder.svg?height=32&width=32&query=company logo"}
                  alt={`${partner.name} logo`}
                  className="w-8 h-8 object-contain"
                  loading="lazy"
                />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between mb-1 gap-2">
                <h3 className="font-semibold text-foreground truncate">{partner.name}</h3>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {statusInfo && (
                    <div
                      className="inline-flex items-center gap-2 h-7 px-3 rounded-full text-xs font-medium leading-none whitespace-nowrap"
                      style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}
                    >
                      <StatusIcon className="w-3 h-3 shrink-0" />
                      <span className="hidden sm:inline truncate">{statusInfo.label}</span>
                    </div>
                  )}

                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg bg-muted/50 border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                      aria-label={`Visit ${partner.name} website`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>

              {meta.length > 0 && <p className="text-sm text-muted-foreground mb-1">{meta.join(" · ")}</p>}
              {partner.description && (
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{partner.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function StrategicAlliances({ partners = [] }: StrategicAlliancesProps) {
  // Default partners data if none provided
  const defaultPartners: Partner[] = [
    {
      id: "1",
      name: "TechFlow Solutions",
      logo: "/placeholder.svg?height=40&width=40",
      website: "https://techflow.com",
      partnership_type: "strategic",
      established: "2023",
      status: "active",
      description: "Leading automation platform helping businesses streamline their workflows and boost productivity.",
    },
    {
      id: "2",
      name: "DataSync Pro",
      logo: "/placeholder.svg?height=40&width=40",
      website: "https://datasync.com",
      partnership_type: "integration",
      established: "2022",
      status: "expanding",
      description: "Advanced data integration service that connects all your business tools in one unified platform.",
    },
    {
      id: "3",
      name: "CloudSecure",
      logo: "/placeholder.svg?height=40&width=40",
      website: "https://cloudsecure.com",
      partnership_type: "technology",
      established: "2024",
      status: "pilot",
      description: "Enterprise-grade security solutions ensuring your data stays protected with end-to-end encryption.",
    },
    {
      id: "4",
      name: "Analytics Hub",
      logo: "/placeholder.svg?height=40&width=40",
      website: "https://analyticshub.com",
      partnership_type: "strategic",
      established: "2023",
      status: "active",
      description: "Powerful business intelligence platform providing real-time insights and data visualization tools.",
    },
  ]

  const displayPartners = partners.length > 0 ? partners : defaultPartners

  return (
    <section className="w-full py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center justify-center space-y-4 text-center mb-12"
        >
          <Badge className="rounded-full px-4 py-1.5 text-sm font-medium" variant="secondary">
            <Sparkles className="w-4 h-4 mr-2" />
            Strategic Partnerships
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Strategic Alliances</h2>
          <p className="max-w-[800px] text-muted-foreground md:text-lg">
            We partner with industry leaders to deliver comprehensive solutions that help your business thrive in the
            digital landscape.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto"
        >
          {displayPartners.map((partner, index) => (
            <PartnerListItem key={partner.id} partner={partner} index={index} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
