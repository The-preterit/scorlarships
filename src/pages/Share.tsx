import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ScholarshipForm from '@/components/ScholarshipForm'

export default function Share() {
  const [searchParams] = useSearchParams()
  const [showForm, setShowForm] = useState(false)
  const [initialData, setInitialData] = useState<{
    title?: string
    text?: string
    url?: string
    description?: string
  }>({})

  useEffect(() => {
    const title = searchParams.get('title') || ''
    const text = searchParams.get('text') || ''
    const url = searchParams.get('url') || ''

    if (title || text || url) {
      setInitialData({ title, text, url })
      setShowForm(true)
    }
  }, [searchParams])

  const handleClose = () => {
    setShowForm(false)
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Partage de bourse</h1>
        <p className="text-gray-500 mb-8">
          {showForm
            ? 'Remplissez les informations de la bourse'
            : 'Redirection en cours...'}
        </p>
        {!showForm && (
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        )}
      </div>

      {showForm && (
        <ScholarshipForm
          initialData={initialData}
          onClose={handleClose}
          onSave={handleClose}
        />
      )}
    </div>
  )
}
