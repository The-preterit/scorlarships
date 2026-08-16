export type ScholarshipStatus = 'saved' | 'in_progress' | 'applied' | 'archived'

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
}

export interface ScholarshipInsert {
  title: string
  description?: string | null
  organization?: string | null
  status?: ScholarshipStatus
  deadline: string
  reference_links?: string[]
  notes?: string | null
}

export interface ReminderInsert {
  scholarship_id: string
  days_before: number
  scheduled_for: string
}
