"use client"

import { useState, useEffect } from "react"
import { X, Bell, AlertTriangle, AlertCircle, Tag, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  priority: number
}

const typeStyles: Record<string, { bg: string; border: string; icon: string; iconBg: string }> = {
  INFO: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: "text-blue-600",
    iconBg: "bg-blue-100"
  },
  WARNING: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: "text-amber-600",
    iconBg: "bg-amber-100"
  },
  URGENT: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: "text-red-600",
    iconBg: "bg-red-100"
  },
  PROMOTION: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: "text-green-600",
    iconBg: "bg-green-100"
  }
}

const typeIcons: Record<string, React.ReactNode> = {
  INFO: <Bell className="h-5 w-5" />,
  WARNING: <AlertTriangle className="h-5 w-5" />,
  URGENT: <AlertCircle className="h-5 w-5" />,
  PROMOTION: <Tag className="h-5 w-5" />
}

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/announcements')
        if (response.ok) {
          const data = await response.json()
          setAnnouncements(data)
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set(Array.from(prev).concat(id)))
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const newSet = new Set(Array.from(prev))
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const visibleAnnouncements = announcements.filter(a => !dismissed.has(a.id))

  if (loading || visibleAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {visibleAnnouncements.map((announcement) => {
        const styles = typeStyles[announcement.type] || typeStyles.INFO
        const isExpanded = expanded.has(announcement.id)
        const isLongContent = announcement.content.length > 100

        return (
          <div
            key={announcement.id}
            className={`${styles.bg} ${styles.border} border rounded-lg p-4 relative`}
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className={`${styles.iconBg} ${styles.icon} p-2 rounded-full flex-shrink-0`}>
                {typeIcons[announcement.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                <p className={`text-sm text-gray-700 mt-1 ${!isExpanded && isLongContent ? 'line-clamp-2' : ''}`}>
                  {announcement.content}
                </p>
                {isLongContent && (
                  <button
                    onClick={() => toggleExpand(announcement.id)}
                    className="text-sm text-blue-600 hover:text-blue-700 mt-1 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        閉じる
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        続きを読む
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Dismiss button */}
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-8 w-8 p-0"
                onClick={() => handleDismiss(announcement.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
