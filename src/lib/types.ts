export type ProgramStatus = 'pending' | 'accepted' | 'active' | 'archived' | 'deleted'

export interface Program {
  id: string
  name: string
  description: string
  slackChannel: string
  subdomain: string
  startDate: string
  endDate: string
  keyColor: string
  status: ProgramStatus
  template?: string
  resources: {
    slack?: string
    github?: string
    domain?: string
    hcb?: string
    airtable?: string
    fillout?: string
  }
  createdAt: string
  creatorSlackId?: string
  creatorName?: string
  creatorEmail?: string
  creatorGithubUsername?: string
  errorStep?: string | null
  errorMessage?: string | null
}

export interface CreateProgramInput {
  name: string
  description: string
  slackChannel: string
  subdomain: string
  startDate: string
  endDate: string
  keyColor: string
  creatorSlackId?: string
  creatorName?: string
  creatorEmail?: string
  creatorGithubUsername?: string
}

export type StepStatus = 'done' | 'in_progress' | 'pending' | 'error'


export interface CreationStep {
  id: string
  label: string
  status: StepStatus
}
