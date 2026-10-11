import type { Opportunity } from '../types'

export const opportunities: Opportunity[] = [
  { id: 'amazon-sde', title: 'SDE Intern 2027', organization: 'Amazon', logo: 'A', type: 'Internship', location: 'Bengaluru · Hybrid', deadline: 'Oct 18', skills: ['DSA', 'Java', 'Problem Solving'], description: 'Work with an engineering team to build customer-facing services at meaningful scale.', featured: true },
  { id: 'hackverse', title: 'HackVerse 2026', organization: 'Coding Club LNCT', logo: 'H', type: 'Hackathon', location: 'LNCT Campus', deadline: 'Oct 12', skills: ['Open Innovation', 'Teamwork'], description: 'A 36-hour campus hackathon for students who want to ship a bold idea with friends.', featured: true },
  { id: 'figma-campus', title: 'Campus Design Partner', organization: 'Figma', logo: 'F', type: 'Freelance', location: 'Remote', deadline: 'Oct 22', skills: ['Figma', 'Community', 'Content'], description: 'Help strengthen the student design community with events, workshops, and local stories.' },
  { id: 'deloitte-analyst', title: 'Business Technology Analyst', organization: 'Deloitte', logo: 'D', type: 'Job', location: 'Hyderabad · On-site', deadline: 'Oct 26', skills: ['SQL', 'Analytics', 'Communication'], description: 'Join a collaborative technology consulting team and solve problems for global clients.' },
  { id: 'ideathon', title: 'MP Student Ideathon', organization: 'Startup MP', logo: 'S', type: 'Competition', location: 'Bhopal', deadline: 'Oct 15', skills: ['Pitching', 'Product', 'Research'], description: 'Bring a team, validate your idea, and pitch it to founders and ecosystem leaders.' },
  { id: 'alumni-panel', title: 'From Campus to Product', organization: 'LNCT Alumni Cell', logo: 'L', type: 'Campus Event', location: 'Auditorium 2', deadline: 'Tomorrow', skills: ['Networking', 'Product'], description: 'An honest alumni panel about early careers, pivots, and building a meaningful portfolio.' },
]
