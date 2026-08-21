import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Edit, 
  Trash2, 
  Globe, 
  Building2, 
  GraduationCap,
  FileText,
  Link as LinkIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Scholarship } from '@/types/database'

const STATUS_COLORS = {
  saved: { bg: 'bg-gray-500', label: 'Enregistrée' },
  in_progress: { bg: 'bg-blue-500', label: 'En cours' },
  applied: { bg: 'bg-green-500', label: 'Postulée' },
  archived: { bg: 'bg-red-500', label: 'Archivée' },
}

const EDUCATION_LABELS = {
  licence: 'Licence',
  master: 'Master',
  doctorat: 'Doctorat',
}

function getTimeRemaining(deadline: string): { text: string; urgent: boolean; expired: boolean } {
  const now = new Date()
  const deadlineDate = new Date(deadline)
  const diff = deadlineDate.getTime() - now.getTime()
  
  if (diff < 0) {
    return { text: 'Expirée', urgent: true, expired: true }
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days === 0) {
    if (hours === 0) {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      return { text: `Dans ${minutes} min`, urgent: true, expired: false }
    }
    return { text: `Dans ${hours}h`, urgent: true, expired: false }
  }
  
  if (days === 1) {
    return { text: 'Demain', urgent: true, expired: false }
  }
  
  if (days <= 7) {
    return { text: `Dans ${days} jours`, urgent: true, expired: false }
  }
  
  return { text: `Dans ${days} jours`, urgent: false, expired: false }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ScholarshipDetail() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [scholarship, setScholarship] = useState<Scholarship | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchScholarship()
  }, [id])

  const fetchScholarship = async () => {
    if (!id) return
    
    try {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setScholarship(data)
    } catch (error) {
      console.error('Error fetching scholarship:', error)
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!scholarship) return

    try {
      const { error } = await supabase
        .from('scholarships')
        .delete()
        .eq('id', scholarship.id)

      if (error) throw error
      navigate('/')
    } catch (error) {
      console.error('Error deleting scholarship:', error)
      alert('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!scholarship) {
    return null
  }

  const status = STATUS_COLORS[scholarship.status]
  const { text: timeText, urgent, expired } = getTimeRemaining(scholarship.deadline)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/edit/${scholarship.id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Title Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{scholarship.title}</h1>
              {scholarship.organization && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm">{scholarship.organization}</span>
                </div>
              )}
            </div>
            <span className={`${status.bg} text-white text-xs px-3 py-1.5 rounded-full font-medium`}>
              {status.label}
            </span>
          </div>

          {/* Deadline Alert */}
          <div className={`rounded-xl p-4 ${expired ? 'bg-red-50 border border-red-200' : urgent ? 'bg-orange-50 border border-orange-200' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${expired ? 'bg-red-100' : urgent ? 'bg-orange-100' : 'bg-blue-100'}`}>
                  <Clock className={`w-5 h-5 ${expired ? 'text-red-600' : urgent ? 'text-orange-600' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${expired ? 'text-red-700' : urgent ? 'text-orange-700' : 'text-blue-700'}`}>
                    {timeText}
                  </p>
                  <p className="text-xs text-gray-500">Date limite</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatDate(scholarship.deadline)}</p>
                <p className="text-xs text-gray-500">{formatDateTime(scholarship.deadline)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Details */}
        {(scholarship.education_level || scholarship.destination_country || scholarship.host_organization || scholarship.opening_date) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Détails académiques</h2>
            <div className="space-y-4">
              {scholarship.education_level && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Niveau d'études</p>
                    <p className="text-sm font-medium text-gray-900">
                      {EDUCATION_LABELS[scholarship.education_level]}
                    </p>
                  </div>
                </div>
              )}

              {scholarship.destination_country && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Pays de destination</p>
                    <p className="text-sm font-medium text-gray-900">{scholarship.destination_country}</p>
                  </div>
                </div>
              )}

              {scholarship.host_organization && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Établissement d'accueil</p>
                    <p className="text-sm font-medium text-gray-900">{scholarship.host_organization}</p>
                  </div>
                </div>
              )}

              {scholarship.opening_date && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 mb-1">Date d'ouverture</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(scholarship.opening_date)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {scholarship.description && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Description</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{scholarship.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reference Links */}
        {scholarship.reference_links.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Liens de référence</h2>
            <div className="space-y-2">
              {scholarship.reference_links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <LinkIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">Lien {index + 1}</p>
                    <p className="text-xs text-gray-500 truncate">{link}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {scholarship.notes && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900 mb-2">Notes</h2>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{scholarship.notes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="text-center text-xs text-gray-400 py-4">
          <p>Créée le {formatDateTime(scholarship.created_at)}</p>
          <p>Mise à jour le {formatDateTime(scholarship.updated_at)}</p>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Supprimer cette bourse ?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Cette action est irréversible. La bourse "{scholarship.title}" sera définitivement supprimée.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
