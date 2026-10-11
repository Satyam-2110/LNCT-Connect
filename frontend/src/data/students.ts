import type { Student } from '../types'

export const currentUser: Student = {
  id: 'aanya-mehta',
  name: 'Aanya Mehta',
  initials: 'AM',
  avatar: 'from-indigo-400 to-violet-500',
  branch: 'Computer Science',
  year: '3rd year',
  bio: 'Frontend builder, community person, and occasional hackathon night owl.',
  skills: ['React', 'TypeScript', 'UI/UX'],
  interests: ['Product Design', 'AI for Education', 'Startups'],
  connections: 248,
  location: 'Bhopal, India',
  online: true,
}

export const students: Student[] = [
  { id: 'arjun-sinha', name: 'Arjun Sinha', initials: 'AS', avatar: 'from-cyan-400 to-blue-500', branch: 'Computer Science', year: '4th year', bio: 'Building intelligent products at the edge of design and ML.', skills: ['Python', 'ML', 'Next.js'], interests: ['AI', 'Open Source'], connections: 418, location: 'Bhopal, India', online: true },
  { id: 'nisha-verma', name: 'Nisha Verma', initials: 'NV', avatar: 'from-rose-400 to-pink-500', branch: 'Information Technology', year: '3rd year', bio: 'Designing thoughtful digital experiences. Currently exploring accessibility.', skills: ['Figma', 'React', 'Research'], interests: ['Design Systems', 'Community'], connections: 292, location: 'Bhopal, India' },
  { id: 'dev-malviya', name: 'Dev Malviya', initials: 'DM', avatar: 'from-amber-400 to-orange-500', branch: 'Electronics & Communication', year: '2nd year', bio: 'Hardware tinkerer turning overlooked campus problems into prototypes.', skills: ['IoT', 'C++', 'PCB Design'], interests: ['Robotics', 'Hardware'], connections: 187, location: 'Bhopal, India' },
  { id: 'kavya-jain', name: 'Kavya Jain', initials: 'KJ', avatar: 'from-emerald-400 to-teal-500', branch: 'Computer Science', year: '4th year', bio: 'Full-stack engineer and an open-source contributor. Always happy to pair.', skills: ['Node.js', 'PostgreSQL', 'React'], interests: ['DevTools', 'Mentoring'], connections: 501, location: 'Bhopal, India', online: true },
  { id: 'rahul-sharma', name: 'Rahul Sharma', initials: 'RS', avatar: 'from-blue-500 to-indigo-600', branch: 'Computer Science', year: 'Alumni', graduationYear: '2023', bio: 'Software engineer solving developer-scale problems and supporting the next batch.', skills: ['React', 'Node.js', 'System Design'], interests: ['Mentorship', 'Engineering'], connections: 876, location: 'Bengaluru, India', role: 'Software Engineer', company: 'Google', isAlumni: true },
  { id: 'ishita-gupta', name: 'Ishita Gupta', initials: 'IG', avatar: 'from-fuchsia-400 to-purple-500', branch: 'MBA', year: 'Alumni', graduationYear: '2022', bio: 'Product manager who loves zero-to-one products and sharp problem statements.', skills: ['Product Strategy', 'Analytics', 'Growth'], interests: ['Product', 'Startups'], connections: 732, location: 'Gurugram, India', role: 'Product Manager', company: 'Razorpay', isAlumni: true },
  { id: 'yash-gupta', name: 'Yash Gupta', initials: 'YG', avatar: 'from-sky-400 to-indigo-500', branch: 'Computer Science', year: '3rd year', bio: 'Developer advocate in training; building a campus marketplace after class.', skills: ['Flutter', 'Firebase', 'UI Design'], interests: ['Mobile', 'Startups'], connections: 315, location: 'Bhopal, India' },
  { id: 'tanya-rathore', name: 'Tanya Rathore', initials: 'TR', avatar: 'from-orange-300 to-rose-400', branch: 'Information Technology', year: '2nd year', bio: 'Learning data storytelling, visual systems, and useful frontend patterns.', skills: ['JavaScript', 'Tableau', 'SQL'], interests: ['Data', 'Design'], connections: 153, location: 'Bhopal, India' },
]

export const getStudent = (id: string) => students.find((student) => student.id === id) ?? currentUser
