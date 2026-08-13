import React, { useState } from 'react'
import { X, Link as LinkIcon, Plus, Trash2, Calendar, Clock, Save } from 'lucide-react'
import { Scholarship, ScholarshipInsert, ScholarshipStatus } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

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

export default function ScholarshipForm({ scholarship, initialData, onClose, onSave }: ScholarshipFormProps) {
  const { user } = useAuth()
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
    if (!user) return

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
          .insert({ ...scholarshipData, user_id: user.id })
          .select()
          .single()

        if (error) throw error
        scholarshipId = data.id
      }

      // Create reminders
      if (selectedReminders.length > 0) {
        const reminders = selectedReminders.map(days => ({
          scholarship_id: scholarshipId,
          user_id: user.id,
          days_before: days,
          scheduled_for: new Date(deadline.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
        }))

        const { error: reminderError } = await supabase.from('reminders').insert(reminders)
        if (reminderError) throw reminderError
      }

      onSave()
    } catch (error) {
      console.error('Error saving scholarship:', error)
      alert('Erreur lors de la sauvegarde')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-primary-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-primary-800 px-6 py-4 border-b border-primary-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {scholarship ? 'Modifier la bourse' : 'Nouvelle bourse'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-primary-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">
              Titre *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-900/50 border border-primary-600 rounded-lg text-white placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Titre de la bourse"
              required
            />
          </div>

          {/* Organization */}
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">
              Organisme
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-900/50 border border-primary-600 rounded-lg text-white placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nom de l'organisme"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-900/50 border border-primary-600 rounded-lg text-white placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Description de la bourse"
              rows={3}
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">
              Deadline *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-primary-900/50 border border-primary-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
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
                      : 'bg-primary-700 text-primary-300 hover:bg-primary-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reference Links */}
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
              Liens de référence
            </label>
            <div className="space-y-2">
              {formData.reference_links.map((link, index) => (
                <div key={index} className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => handleLinkChange(index, e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-primary-900/50 border border-primary-600 rounded-lg text-white placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLink}
                className="flex items-center gap-2 text-sm text-primary-300 hover:text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Ajouter un lien
              </button>
            </div>
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-2">
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
                      ? 'bg-yellow-500 text-primary-900'
                      : 'bg-primary-700 text-primary-300 hover:bg-primary-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-primary-200 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-primary-900/50 border border-primary-600 rounded-lg text-white placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Notes personnelles"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-primary-700 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
