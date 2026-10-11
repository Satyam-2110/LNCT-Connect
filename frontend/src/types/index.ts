export type Student = {
  id: string
  name: string
  initials: string
  avatar: string
  branch: string
  year: string
  graduationYear?: string
  bio: string
  skills: string[]
  interests: string[]
  connections: number
  location: string
  role?: string
  company?: string
  isAlumni?: boolean
  online?: boolean
}

export type Project = {
  id: string
  name: string
  description: string
  category: string
  tech: string[]
  creator: Pick<Student, 'name' | 'initials' | 'avatar'>
  members: number
  lookingFor: string[]
  status: 'Building' | 'Ideation' | 'Launched'
  progress: number
  accent: string
}

export type Opportunity = {
  id: string
  title: string
  organization: string
  logo: string
  type: 'Internship' | 'Job' | 'Hackathon' | 'Competition' | 'Campus Event' | 'Freelance'
  location: string
  deadline: string
  skills: string[]
  description: string
  featured?: boolean
}

export type Mentor = Student & {
  experience: string
  topics: string[]
  availability: string
}

export type Post = {
  id: string
  author: Pick<Student, 'id' | 'name' | 'initials' | 'avatar' | 'branch' | 'year'>
  time: string
  content: string
  tags: string[]
  image?: string
  likes: number
  comments: number
  shares: number
  liked?: boolean
  saved?: boolean
}

export type Conversation = {
  id: string
  person: Pick<Student, 'id' | 'name' | 'initials' | 'avatar' | 'role' | 'company' | 'online'>
  preview: string
  time: string
  unread?: number
  messages: { id: string; text: string; at: string; mine?: boolean }[]
}
