import React from 'react'
import { Calendar, ExternalLink, Edit, Trash2, Clock } from 'lucide-react'
import { Scholarship } from '@/types/database'

interface ScholarshipCardProps {
  scholarship: Scholarship
  onEdit: () => void
  onDelete: () => void
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

export default function ScholarshipCard({ scholarship, onEdit, onDelete }: ScholarshipCardProps) {
  const status = STATUS_COLORS[scholarship.status]
  const { text: timeText, urgent } = getTimeRemaining(scholarship.deadline)

  return (
    <div className="bg-primary-800/50 border border-primary-700/50 rounded-xl p-4 hover:border-primary-600 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">{scholarship.title}</h3>
          {scholarship.organization && (
            <p className="text-sm text-primary-400">{scholarship.organization}</p>
          )}
        </div>
        <span className={`${status.bg} text-white text-xs px-2 py-1 rounded-full`}>
          {status.text}
        </span>
      </div>

      {scholarship.description && (
        <p className="text-sm text-primary-300 mb-3 line-clamp-2">{scholarship.description}</p>
      )}

      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5 text-sm">
          <Calendar className="w-4 h-4 text-primary-400" />
          <span className="text-primary-300">{formatDate(scholarship.deadline)}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-sm ${urgent ? 'text-yellow-400' : 'text-primary-300'}`}>
          <Clock className="w-4 h-4" />
          <span>{timeText}</span>
        </div>
      </div>

      {scholarship.reference_links.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {scholarship.reference_links.map((link, index) => (
            <a
              key={index}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Lien {index + 1}
            </a>
          ))}
        </div>
      )}

      {scholarship.notes && (
        <p className="text-xs text-primary-400 mb-3 italic line-clamp-1">{scholarship.notes}</p>
      )}

      <div className="flex gap-2 pt-2 border-t border-primary-700/50">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-primary-300 hover:text-white hover:bg-primary-700/50 rounded-lg transition-all"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </button>
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      </div>
    </div>
  )
}
