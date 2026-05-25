"use client"

import { useState } from "react"
import { ExternalLink, Calendar, Building2, Users, CheckCircle, Clock, Zap } from "lucide-react"
import type { Partner } from "../data"

interface PartnersGridProps {
  partners: Partner[]
}

const categoryLabels = {
  hospitality: "Hospitality",
  restaurants: "Restaurants",
  hotels: "Hotels",
  cafes: "Cafés",
  events: "Events",
}

const statusConfig = {
  active: {
    color: "#10b981",
    bgColor: "#ecfdf5",
    icon: CheckCircle,
    label: "Active Partnership",
  },
  pilot: {
    color: "#f59e0b",
    bgColor: "#fffbeb",
    icon: Clock,
    label: "Pilot Program",
  },
  expanding: {
    color: "#3b82f6",
    bgColor: "#eff6ff",
    icon: Zap,
    label: "Expanding",
  },
}

const partnershipTypeLabels = {
  integration: "Technology Integration",
  strategic: "Strategic Alliance",
  distribution: "Distribution Partner",
  investment: "Investment Partner",
}

export default function PartnersGrid({ partners }: PartnersGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const categories = ["all", ...Object.keys(categoryLabels)]
  const filteredPartners =
    selectedCategory === "all" ? partners : partners.filter((p) => p.category === selectedCategory)

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {categories.map((category) => (
          <button
            key={category}
            className={`filter-btn ${selectedCategory === category ? "filter-btn--active" : ""}`}
            onClick={() => setSelectedCategory(category)}
            aria-pressed={selectedCategory === category}
          >
            {category === "all" ? "All Partners" : categoryLabels[category as keyof typeof categoryLabels]}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filteredPartners.map((partner) => {
          const statusInfo = statusConfig[partner.status as keyof typeof statusConfig]
          const StatusIcon = statusInfo?.icon || CheckCircle

          return (
            <article key={partner.id} className="partner-card">
              <div className="p-8">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                      <img
                        src={partner.logo || "/placeholder.svg"}
                        alt={`${partner.name} logo`}
                        className="h-16 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>
                        {partner.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
                          {categoryLabels[partner.category as keyof typeof categoryLabels] || partner.category}
                        </span>
                        {partner.website && (
                          <>
                            <span style={{ color: "var(--text-3)" }}>•</span>
                            <a
                              href={partner.website}
                              className="text-sm flex items-center gap-1 hover:opacity-80 transition-opacity"
                              style={{ color: "var(--accent)" }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Visit Website
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="status-badge">
                    <div className="status-dot" style={{ backgroundColor: statusInfo?.color || "#6b7280" }} />
                    <span className="status-label">{statusInfo?.label || partner.status}</span>
                  </div>
                </div>

                {/* Description */}
                {partner.description && (
                  <p className="text-base leading-relaxed mb-6" style={{ color: "var(--text-2)" }}>
                    {partner.description}
                  </p>
                )}

                <div className="partner-info-grid">
                  <div className="partner-info-item">
                    <div className="partner-info-icon" style={{ backgroundColor: "rgba(74, 123, 217, 0.1)" }}>
                      <Building2 className="h-5 w-5" style={{ color: "var(--accent)" }} />
                    </div>
                    <div>
                      <div className="partner-info-label">Partnership Type</div>
                      <div className="partner-info-value">
                        {partnershipTypeLabels[partner.partnership_type as keyof typeof partnershipTypeLabels] ||
                          partner.partnership_type}
                      </div>
                    </div>
                  </div>

                  <div className="partner-info-item">
                    <div className="partner-info-icon" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                      <Calendar className="h-5 w-5" style={{ color: "#10b981" }} />
                    </div>
                    <div>
                      <div className="partner-info-label">Partnership Since</div>
                      <div className="partner-info-value">{partner.established}</div>
                    </div>
                  </div>

                  <div className="partner-info-item">
                    <div className="partner-info-icon" style={{ backgroundColor: "rgba(147, 51, 234, 0.1)" }}>
                      <Users className="h-5 w-5" style={{ color: "#9333ea" }} />
                    </div>
                    <div>
                      <div className="partner-info-label">Category</div>
                      <div className="partner-info-value">
                        {categoryLabels[partner.category as keyof typeof categoryLabels] || partner.category}
                      </div>
                    </div>
                  </div>
                </div>

                {(partner.employees || partner.revenue || partner.locations) && (
                  <div className="partner-metrics">
                    {partner.employees && (
                      <div className="partner-metric">
                        <div className="partner-metric-value">{partner.employees}</div>
                        <div className="partner-metric-label">Employees</div>
                      </div>
                    )}
                    {partner.revenue && (
                      <div className="partner-metric">
                        <div className="partner-metric-value">{partner.revenue}</div>
                        <div className="partner-metric-label">Annual Revenue</div>
                      </div>
                    )}
                    {partner.locations && (
                      <div className="partner-metric">
                        <div className="partner-metric-value">{partner.locations}</div>
                        <div className="partner-metric-label">Locations</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {filteredPartners.length === 0 && (
        <div className="text-center py-12">
          <div className="text-lg" style={{ color: "var(--text-2)" }}>
            No partners found in this category.
          </div>
        </div>
      )}
    </div>
  )
}
