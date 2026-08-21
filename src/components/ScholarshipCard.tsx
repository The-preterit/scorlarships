import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, ChevronRight } from 'lucide-react'
import { Scholarship } from '@/types/database'

interface ScholarshipCardProps {
  scholarship: Scholarship
}

const STATUS_COLORS = {
  saved: { bg: 'bg-gray-500', text: 'Enregistrée' },
  in_progress: { bg: 'bg-blue-500', text: 'En cours' },
  applied: { bg: 'bg-green-500', text: 'Postulée' },
  archived: { bg: 'bg-red-500', text: 'Archivée' },
}

function getTimeRemaining(deadline: string): { text: string; urgent: boolean } {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate.getTime() - now.getTime()
  
  if (diff < 0) {
    return { text: 'Expirée', urgent: true }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days === 0) {
    if (hours === 0) {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return { text: `Dans ${minutes} min`, urgent: true }
    }
    return { text: `Dans ${hours}h`, urgent: true }
  }
  
  if (days === 1) {
    return { text: 'Demain', urgent: true }
  }
  
  if (days <= 7) {
    return { text: `Dans ${days} jours`, urgent: true }
  }
  
  return { text: `Dans ${days} jours`, urgent: false }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ScholarshipCard({ scholarship }: ScholarshipCardProps) {
  const navigate = useNavigate()
  const status = STATUS_COLORS[scholarship.status]
  const { text: timeText, urgent } = getTimeRemaining(scholarship.deadline)

  return (
    <div 
      onClick={() => navigate(`/scholarship/${scholarship.id}`)}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 pr-3">
          <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">{scholarship.title}</h3>
          {scholarship.organization && (
            <p className="text-sm text-gray-500 line-clamp-1">{scholarship.organization}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`${status.bg} text-white text-xs px-2 py-1 rounded-full`}>
            {status.text}
          </span>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {scholarship.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{scholarship.description}</p>
      )}

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-gray-600">{formatDate(scholarship.deadline)}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${urgent ? 'text-orange-600 font-medium' : 'text-gray-600'}`}>
          <Clock className="w-3.5 h-3.5" />
          <span>{timeText}</span>
        </div>
      </div>
    </div>
  )
}
