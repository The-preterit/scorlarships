import { useState, useEffect } from 'react'
import { Search, Plus, LogOut, GraduationCap, Filter } from 'lucide-react'
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
    <div className="min-h-screen bg-primary-900">
      {/* Header */}
      <header className="sticky top-0 bg-primary-900/95 backdrop-blur-lg border-b border-primary-700/50 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-700 rounded-full flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-white">Scholarships</h1>
                <p className="text-xs text-primary-400">{stats.total} bourses</p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5 text-primary-300" />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 py-2 bg-primary-800 border border-primary-700 rounded-lg text-white placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-primary-600' : 'bg-primary-800 hover:bg-primary-700'
              }`}
            >
              <Filter className="w-5 h-5 text-primary-300" />
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
                      ? 'bg-primary-600 text-white'
                      : 'bg-primary-700 text-primary-300 hover:bg-primary-600'
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
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredScholarships.length === 0 ? (
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery || statusFilter !== 'all' ? 'Aucun résultat' : 'Aucune bourse'}
            </h3>
            <p className="text-primary-400 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par ajouter votre première bourse'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50"
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
