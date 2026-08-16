import React, { useState } from 'react'
import { X, Link as LinkIcon, Plus, Trash2, Calendar, Save } from 'lucide-react'
import { Scholarship, ScholarshipInsert, ScholarshipStatus } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface ScholarshipFormProps {
  scholarship?: Scholarship
  initialData?: {
    title?: string
    description?: string
    url?: string
    text?: string
  }
  onClose: () => void
  onSave: () => void
}

const STATUS_OPTIONS: { value: ScholarshipStatus; label: string; color: string }[] = [
  { value: 'saved', label: 'Enregistrée', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'En cours', color: 'bg-blue-500' },
  { value: 'applied', label: 'Postulée', color: 'bg-green-500' },
  { value: 'archived', label: 'Archivée', color: 'bg-red-500' },
]

const REMINDER_OPTIONS = [
  { days: 14, label: '2 semaines avant' },
  { days: 7, label: '1 semaine avant' },
  { days: 3, label: '3 jours avant' },
  { days: 1, label: '1 jour avant' },
]

// Default user ID for personal use
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000'

export default function ScholarshipForm({ scholarship, initialData, onClose, onSave }: ScholarshipFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: scholarship?.title || initialData?.title || initialData?.text?.split('\n')[0] || '',
    description: scholarship?.description || initialData?.text || '',
    organization: scholarship?.organization || '',
    status: scholarship?.status || 'saved',
    deadline: scholarship?.deadline ? scholarship.deadline.slice(0, 16) : '',
    notes: scholarship?.notes || '',
    reference_links: scholarship?.reference_links || (initialData?.url ? [initialData.url] : []),
  })
  const [selectedReminders, setSelectedReminders] = useState<number[]>([])

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...formData.reference_links]
    newLinks[index] = value
    setFormData({ ...formData, reference_links: newLinks })
  }

  const addLink = () => {
    setFormData({ ...formData, reference_links: [...formData.reference_links, ''] })
  }

  const removeLink = (index: number) => {
    const newLinks = formData.reference_links.filter((_, i) => i !== index)
    setFormData({ ...formData, reference_links: newLinks })
  }

  const toggleReminder = (days: number) => {
    setSelectedReminders(prev =>
      prev.includes(days)
        ? prev.filter(d => d !== days)
        : [...prev, days].sort((a, b) => b - a)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    try {
      const deadline = new Date(formData.deadline)
      const scholarshipData: ScholarshipInsert = {
        title: formData.title,
        description: formData.description || null,
        organization: formData.organization || null,
        status: formData.status as ScholarshipStatus,
        deadline: deadline.toISOString(),
        reference_links: formData.reference_links.filter(link => link.trim() !== ''),
        notes: formData.notes || null,
      }

      let scholarshipId: string

      if (scholarship) {
        // Update existing scholarship
        const { error } = await supabase
          .from('scholarships')
          .update({
            ...scholarshipData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', scholarship.id)

        if (error) throw error
        scholarshipId = scholarship.id

        // Delete existing reminders
        await supabase.from('reminders').delete().eq('scholarship_id', scholarshipId)
      } else {
        // Create new scholarship
        const { data, error } = await supabase
          .from('scholarships')
          .insert({ ...scholarshipData, user_id: DEFAULT_USER_ID })
          .select()
          .single()

        if (error) throw error
        scholarshipId = data.id
      }

      // Create reminders
      if (selectedReminders.length > 0) {
        const reminders = selectedReminders.map(days => ({
          scholarship_id: scholarshipId,
          user_id: DEFAULT_USER_ID,
          days_before: days,
          scheduled_for: new Date(deadline.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
        }))

        const { error: reminderError } = await supabase.from('reminders').insert(reminders)
        if (reminderError) throw reminderError
      }

      onSave()
    } catch (error: any) {
      console.error('Error saving scholarship:', error)
      alert(`Erreur lors de la sauvegarde: ${error?.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {scholarship ? 'Modifier la bourse' : 'Nouvelle bourse'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Titre de la bourse"
              required
            />
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organisme
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              placeholder="Nom de l'organisme"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              placeholder="Description de la bourse"
              rows={3}
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={formData.deadline ? formData.deadline.slice(0, 10) : ''}
                onChange={(e) => {
                  const date = e.target.value
                  // Set time to 23:59 by default
                  setFormData({ ...formData, deadline: date + 'T23:59' })
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: option.value })}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    formData.status === option.value
                      ? `${option.color} text-white`
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference Links */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Liens de référence
            </label>
            <div className="space-y-2">
              {formData.reference_links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => handleLinkChange(index, e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLink}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un lien
              </button>
            </div>
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rappels
            </label>
            <div className="flex flex-wrap gap-2">
              {REMINDER_OPTIONS.map(option => (
                <button
                  key={option.days}
                  type="button"
                  onClick={() => toggleReminder(option.days)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    selectedReminders.includes(option.days)
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
              placeholder="Notes personnelles"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Sauvegarder
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
