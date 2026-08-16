import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, LogOut, GraduationCap, Filter, RefreshCw, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Scholarship, ScholarshipStatus } from '@/types/database'
import ScholarshipCard from '@/components/ScholarshipCard'
import ScholarshipForm from '@/components/ScholarshipForm'

const FILTER_OPTIONS: { value: ScholarshipStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'saved', label: 'Enregistrées' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'applied', label: 'Postulées' },
  { value: 'archived', label: 'Archivées' },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [scholarships, setScholarships] = useState<Scholarship[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ScholarshipStatus | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | undefined>()
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchScholarships()
  }, [])

  const fetchScholarships = async () => {
    try {
      const { data, error } = await supabase
        .from('scholarships')
        .select('*')
        .order('deadline', { ascending: true })

      if (error) throw error
      setScholarships(data || [])
    } catch (error) {
      console.error('Error fetching scholarships:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette bourse ?')) return

    try {
      const { error } = await supabase.from('scholarships').delete().eq('id', id)
      if (error) throw error
      setScholarships(scholarships.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error deleting scholarship:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const filteredScholarships = scholarships
    .filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          s.title.toLowerCase().includes(query) ||
          s.organization?.toLowerCase().includes(query) ||
          s.description?.toLowerCase().includes(query)
        )
      }
      return true
    })
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())

  const stats = {
    total: scholarships.length,
    saved: scholarships.filter(s => s.status === 'saved').length,
    in_progress: scholarships.filter(s => s.status === 'in_progress').length,
    applied: scholarships.filter(s => s.status === 'applied').length,
    archived: scholarships.filter(s => s.status === 'archived').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Scholarships</h1>
                <p className="text-xs text-gray-500">{stats.total} bourses</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/profile')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Profil"
              >
                <User className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={signOut}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
            <button
              onClick={fetchScholarships}
              disabled={loading}
              className="p-2 rounded-lg transition-colors bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50"
              title="Rafraîchir"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {FILTER_OPTIONS.map(option => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    statusFilter === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {option.label} ({stats[option.value === 'all' ? 'total' : option.value] || 0})
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredScholarships.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'Aucun résultat' : 'Aucune bourse'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par ajouter votre première bourse'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter une bourse
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredScholarships.map(scholarship => (
              <ScholarshipCard
                key={scholarship.id}
                scholarship={scholarship}
                onEdit={() => {
                  setEditingScholarship(scholarship)
                  setShowForm(true)
                }}
                onDelete={() => handleDelete(scholarship.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Form Modal */}
      {showForm && (
        <ScholarshipForm
          scholarship={editingScholarship}
          onClose={() => {
            setShowForm(false)
            setEditingScholarship(undefined)
          }}
          onSave={() => {
            setShowForm(false)
            setEditingScholarship(undefined)
            fetchScholarships()
          }}
        />
      )}
    </div>
  )
}
