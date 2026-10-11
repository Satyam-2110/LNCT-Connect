import type { Mentor } from '../types'
import { students } from './students'

const mentorSource = students.filter((student) => student.isAlumni)

export const mentors: Mentor[] = [
  { ...mentorSource[0], experience: '3 years in full-stack engineering', topics: ['Career roadmap', 'System design', 'Frontend engineering'], availability: '2 slots this month' },
  { ...mentorSource[1], experience: '4 years across fintech products', topics: ['Product thinking', 'PM interviews', 'Portfolio reviews'], availability: '1 slot this month' },
  { id: 'sneha-kulkarni', name: 'Sneha Kulkarni', initials: 'SK', avatar: 'from-teal-400 to-emerald-600', branch: 'Electronics & Communication', year: 'Alumni', graduationYear: '2021', bio: 'I help early-career engineers turn curiosity into confidence.', skills: ['Data Science', 'Python', 'MLOps'], interests: ['AI', 'Mentorship'], connections: 604, location: 'Pune, India', role: 'Data Scientist', company: 'Microsoft', isAlumni: true, experience: '5 years in applied AI', topics: ['Data careers', 'ML portfolios', 'Interview prep'], availability: '3 slots this month' },
  { id: 'siddharth-nair', name: 'Siddharth Nair', initials: 'SN', avatar: 'from-orange-400 to-red-500', branch: 'Computer Science', year: 'Alumni', graduationYear: '2020', bio: 'Founder, operator, and believer in learning in public.', skills: ['Startups', 'Growth', 'Go-to-market'], interests: ['Founders', 'Community'], connections: 982, location: 'Mumbai, India', role: 'Co-founder', company: 'Looply', isAlumni: true, experience: '6 years building startups', topics: ['Startup validation', 'Pitching', 'Growth'], availability: '4 slots this month' },
]
