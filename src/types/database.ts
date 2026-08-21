export type ScholarshipStatus = 'saved' | 'in_progress' | 'applied' | 'archived'
export type EducationLevel = 'licence' | 'master' | 'doctorat'
export type ScholarshipStepStatus = 'not_started' | 'started' | 'completed'
export type ProfileDocumentType = 'last_diploma' | 'recommendation_letter'

export interface Scholarship {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  title: string
  description: string | null
  organization: string | null
  status: ScholarshipStatus
  deadline: string
  reference_links: string[]
  notes: string | null
  education_level: EducationLevel | null
  opening_date: string | null
  destination_country: string | null
  host_organization: string | null
}

export interface ScholarshipDomain {
  id: string
  scholarship_id: string
  name: string
  created_at: string
}

export interface ScholarshipLink {
  id: string
  scholarship_id: string
  name: string
  url: string
  created_at: string
}

export interface ScholarshipAdmissionCriteria {
  scholarship_id: string
  english_required: boolean
  minimum_average: number | null
  recommendation_letters_required: number
}

export interface ScholarshipStep {
  id: string
  scholarship_id: string
  position: number
  status: ScholarshipStepStatus
  description: string | null
  completion_reason: string | null
  created_at: string
  updated_at: string
}

export interface Reminder {
  id: string
  scholarship_id: string
  user_id: string
  days_before: number
  scheduled_for: string
  is_sent: boolean
}

export interface Profile {
  id: string
  updated_at: string
  full_name: string | null
  first_name: string | null
  last_name: string | null
  age: number | null
  gender: string | null
  education: string | null
}

export interface ProfileDocument {
  id: string
  profile_id: string
  document_type: ProfileDocumentType
  file_name: string
  storage_path: string
  created_at: string
  updated_at: string
}

export interface ScholarshipInsert {
  title: string
  description?: string | null
  organization?: string | null
  status?: ScholarshipStatus
  deadline: string
  reference_links?: string[]
  notes?: string | null
  education_level?: EducationLevel | null
  opening_date?: string | null
  destination_country?: string | null
  host_organization?: string | null
}

export interface ReminderInsert {
  scholarship_id: string
  days_before: number
  scheduled_for: string
}
