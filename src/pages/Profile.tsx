import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Save, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function Profile() {
  const navigate = useNavigate()
  const { profile: authProfile, signOut, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Log profile data when page loads
    console.log('Profile page loaded - authProfile:', authProfile)
  }, [])

  useEffect(() => {
    if (authProfile) {
      setFullName(authProfile.full_name || '')
      console.log('Profile data updated:', authProfile)
    }
  }, [authProfile])

  const handleSave = async () => {
    if (!authProfile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, updated_at: new Date().toISOString() })
        .eq('id', authProfile.id)

      if (error) throw error
      await refreshProfile()
      alert('Profil mis à jour avec succès !')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Erreur lors de la mise à jour du profil')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-lg border-b border-gray-200 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">Profil</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {authProfile?.full_name || 'Utilisateur'}
            </h2>
            <p className="text-sm text-gray-500">{authProfile?.id}</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID Utilisateur
              </label>
              <input
                type="text"
                value={authProfile?.id || ''}
                disabled
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Cet identifiant est unique et ne peut pas être modifié</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dernière mise à jour
              </label>
              <input
                type="text"
                value={authProfile?.updated_at ? new Date(authProfile.updated_at).toLocaleString('fr-FR') : 'Jamais'}
                disabled
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>

            <button
              onClick={signOut}
              className="w-full py-2.5 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
