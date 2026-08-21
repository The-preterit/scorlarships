import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Link as LinkIcon, Plus, Trash2, Calendar, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ScholarshipStatus, EducationLevel } from '@/types/database'

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000'

interface FormData {
  title: string
  organization: string
  description: string
  education_level: EducationLevel | ''
  destination_country: string
  host_organization: string
  deadline: string
  opening_date: string
  reference_links: string[]
  status: ScholarshipStatus
  notes: string
}

const STEPS = [
  { id: 1, title: 'Informations générales', description: '' },
  { id: 2, title: 'Détails académiques', description: '' },
  { id: 3, title: 'Liens et statut', description: '' },
]

const EDUCATION_LEVELS = [
  { value: 'licence', label: 'Licence' },
  { value: 'master', label: 'Master' },
  { value: 'doctorat', label: 'Doctorat' },
]

const STATUS_OPTIONS: { value: ScholarshipStatus; label: string }[] = [
  { value: 'saved', label: 'Enregistrée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'applied', label: 'Postulée' },
]

export default function CreateScholarship() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    title: '',
    organization: '',
    description: '',
    education_level: '',
    destination_country: '',
    host_organization: '',
    deadline: '',
    opening_date: '',
    reference_links: [''],
    status: 'saved',
    notes: '',
  })

  const updateForm = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const handleLinkChange = (index: number, value: string) => {
    const newLinks = [...formData.reference_links]
    newLinks[index] = value
    updateForm({ reference_links: newLinks })
  }

  const addLink = () => {
    updateForm({ reference_links: [...formData.reference_links, ''] })
  }

  const removeLink = (index: number) => {
    if (formData.reference_links.length > 1) {
      const newLinks = formData.reference_links.filter((_, i) => i !== index)
      updateForm({ reference_links: newLinks })
    }
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.title.trim() !== ''
      case 2:
        return formData.deadline !== ''
      case 3:
        return formData.status !== ''
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    if (!isStepValid(currentStep)) return

    setLoading(true)
    try {
      const scholarshipData = {
        title: formData.title,
        description: formData.description || null,
        organization: formData.organization || null,
        status: formData.status,
        deadline: new Date(formData.deadline + 'T23:59:59').toISOString(),
        opening_date: formData.opening_date ? new Date(formData.opening_date).toISOString() : null,
        education_level: formData.education_level || null,
        destination_country: formData.destination_country || null,
        host_organization: formData.host_organization || null,
        reference_links: formData.reference_links.filter(link => link.trim() !== ''),
        notes: formData.notes || null,
        user_id: DEFAULT_USER_ID,
      }

      const { error } = await supabase
        .from('scholarships')
        .insert(scholarshipData)

      if (error) throw error

      navigate('/')
    } catch (error: any) {
      console.error('Error creating scholarship:', error)
      alert(`Erreur lors de la création: ${error?.message || 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 3 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Nouvelle bourse</h1>
            <div className="w-9" />
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.id
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400 hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mt-[-20px] ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Step 1: General Information */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la bourse *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Ex: Bourse Excellence 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organisme
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => updateForm({ organization: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Ex: Campus France"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                  placeholder="Description de la bourse..."
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Step 2: Academic Details */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Niveau d'études
                </label>
                <div className="flex flex-wrap gap-2">
                  {EDUCATION_LEVELS.map(level => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => updateForm({ education_level: level.value as EducationLevel })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.education_level === level.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'ouverture
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.opening_date}
                      onChange={(e) => updateForm({ opening_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date limite *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => updateForm({ deadline: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays de destination
                </label>
                <input
                  type="text"
                  value={formData.destination_country}
                  onChange={(e) => updateForm({ destination_country: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Ex: France"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Établissement d'accueil
                </label>
                <input
                  type="text"
                  value={formData.host_organization}
                  onChange={(e) => updateForm({ host_organization: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="Ex: Université Paris-Saclay"
                />
              </div>
            </div>
          )}

          {/* Step 3: Links and Status */}
          {currentStep === 3 && (
            <div className="space-y-5">
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
                          className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLink(index)}
                        className="p-2.5 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={formData.reference_links.length === 1}
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut initial
                </label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateForm({ status: option.value })}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        formData.status === option.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                  placeholder="Notes personnelles..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>
            )}
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !isStepValid(currentStep)}
                className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Créer la bourse
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
