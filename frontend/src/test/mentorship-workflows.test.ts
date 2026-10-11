import { describe, it, expect, beforeEach } from 'vitest'
import {
  fetchMentors,
  registerMentorProfile,
  requestMentorshipSession,
  fetchMentorshipRequests,
  respondToMentorshipRequest,
  __resetMentorshipStore,
} from '../services/mentorship'

describe('Phase 13: Mentorship Workflows', () => {
  const verifiedMentor = {
    id: 'mentor-test-001',
    name: 'Priyanka Sharma',
    avatar: 'from-teal-400 to-emerald-600',
    experience: '4 years as Senior Backend Engineer at Razorpay',
    topics: ['System Design', 'Distributed Systems', 'Go & Microservices'],
    availability: '3 slots this month',
  }

  const verifiedStudent = {
    id: 'student-test-002',
    name: 'Aman Patel',
    initials: 'AP',
    avatar: 'from-orange-400 to-amber-600',
    branch: 'Computer Science',
    year: '3rd Year',
  }

  const anotherMentor = {
    id: 'mentor-test-003',
    name: 'Vikram Joshi',
    avatar: 'from-blue-400 to-indigo-600',
    experience: '5 years in ML Engineering',
    topics: ['AI / ML Projects', 'Data Pipelines'],
    availability: '2 slots this month',
  }

  beforeEach(() => {
    __resetMentorshipStore()
  })

  describe('Progressive Access Gating & Self-Mentorship Prevention', () => {
    it('blocks unverified students from booking mentorship sessions with descriptive error', async () => {
      const res = await requestMentorshipSession(
        verifiedMentor.id,
        verifiedStudent.id,
        verifiedStudent,
        {
          topic: 'System Design',
          goalsNote: 'Need advice on designing database sharding for high write throughput.',
        },
        false // isVerified = false
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/verification is required/i)
      expect(res.request).toBeUndefined()
    })

    it('blocks unverified students from registering as a campus mentor', async () => {
      const res = await registerMentorProfile(
        'unverified-user-123',
        {
          experience: '2 years working with React and Node',
          topics: ['Frontend Engineering'],
        },
        false // isVerified = false
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/verification is required/i)
      expect(res.mentor).toBeUndefined()
    })

    it('strictly prevents students from requesting mentorship from their own profile', async () => {
      const res = await requestMentorshipSession(
        verifiedStudent.id, // mentorId === studentId
        verifiedStudent.id,
        verifiedStudent,
        {
          topic: 'Self-coaching',
          goalsNote: 'Trying to request a session with myself.',
        },
        true // isVerified = true
      )

      expect(res.success).toBe(false)
      expect(res.error).toMatch(/cannot request mentorship from yourself/i)
      expect(res.request).toBeUndefined()
    })
  })

  describe('Session Request Creation & Validation', () => {
    it('rejects session requests with empty topic or short goals note', async () => {
      const emptyTopic = await requestMentorshipSession(
        verifiedMentor.id,
        verifiedStudent.id,
        verifiedStudent,
        {
          topic: '   ',
          goalsNote: 'Here are my goals for the mentorship session.',
        },
        true
      )
      expect(emptyTopic.success).toBe(false)
      expect(emptyTopic.error).toMatch(/topic/i)

      const shortGoals = await requestMentorshipSession(
        verifiedMentor.id,
        verifiedStudent.id,
        verifiedStudent,
        {
          topic: 'System Design',
          goalsNote: 'help', // < 5 chars
        },
        true
      )
      expect(shortGoals.success).toBe(false)
      expect(shortGoals.error).toMatch(/at least 5 characters/i)
    })

    it('allows verified students to successfully request a session with topic, goals, and preferred availability', async () => {
      const res = await requestMentorshipSession(
        verifiedMentor.id,
        verifiedStudent.id,
        verifiedStudent,
        {
          topic: 'System Design',
          goalsNote: 'Building an event-driven campus notification service with Kafka and Redis.',
          preferredTime: 'Weekend Morning (10 AM – 12 PM)',
        },
        true
      )

      expect(res.success).toBe(true)
      expect(res.request).toBeDefined()
      expect(res.request?.status).toBe('pending')
      expect(res.request?.mentorId).toBe(verifiedMentor.id)
      expect(res.request?.studentId).toBe(verifiedStudent.id)
      expect(res.request?.student.name).toBe(verifiedStudent.name)
      expect(res.request?.preferredTime).toBe('Weekend Morning (10 AM – 12 PM)')
    })
  })

  describe('Mentor Request Inbox & Response Lifecycle', () => {
    it('allows targeted mentor to view incoming requests and isolates them from other mentors', async () => {
      // Create request for verifiedMentor
      await requestMentorshipSession(
        verifiedMentor.id,
        verifiedStudent.id,
        verifiedStudent,
        {
          topic: 'Go & Microservices',
          goalsNote: 'Reviewing clean architecture and repository patterns in Go.',
        },
        true
      )

      // Verified mentor fetches requests
      const mentorInbox = await fetchMentorshipRequests(verifiedMentor.id, 'mentor')
      expect(mentorInbox.length).toBe(1)
      expect(mentorInbox[0].topic).toBe('Go & Microservices')
      expect(mentorInbox[0].status).toBe('pending')

      // Other mentor fetches requests - should be isolated
      const otherInbox = await fetchMentorshipRequests(anotherMentor.id, 'mentor')
      expect(otherInbox.length).toBe(0)
    })

    it('allows mentor to accept an incoming session request', async () => {
      const created = await requestMentorshipSession(
        verifiedMentor.id,
        verifiedStudent.id,
        verifiedStudent,
        {
          topic: 'System Design',
          goalsNote: 'Discussing database indexing and query optimization on PostgreSQL.',
        },
        true
      )

      expect(created.request).toBeDefined()
      const reqId = created.request!.id

      const respondRes = await respondToMentorshipRequest(
        reqId,
        verifiedMentor.id,
        'accepted',
        'Looking forward to our discussion! Please prepare your schema diagram.'
      )

      expect(respondRes.success).toBe(true)

      const updated = await fetchMentorshipRequests(verifiedMentor.id, 'mentor')
      const targetReq = updated.find((r) => r.id === reqId)
      expect(targetReq?.status).toBe('accepted')
      expect(targetReq?.mentorNotes).toMatch(/prepare your schema diagram/i)
    })

    it('allows mentor to decline a session request', async () => {
      const created = await requestMentorshipSession(
        verifiedMentor.id,
        verifiedStudent.id,
        verifiedStudent,
        {
          topic: 'System Design',
          goalsNote: 'Need advice on my final year capstone project architecture.',
        },
        true
      )

      const reqId = created.request!.id

      const respondRes = await respondToMentorshipRequest(
        reqId,
        verifiedMentor.id,
        'rejected',
        'Slots fully booked this week, please reach out next month.'
      )

      expect(respondRes.success).toBe(true)

      const updated = await fetchMentorshipRequests(verifiedMentor.id, 'mentor')
      const targetReq = updated.find((r) => r.id === reqId)
      expect(targetReq?.status).toBe('rejected')
    })

    it('blocks unauthorized mentors from responding to requests assigned to another mentor', async () => {
      const created = await requestMentorshipSession(
        verifiedMentor.id,
        verifiedStudent.id,
        verifiedStudent,
        {
          topic: 'System Design',
          goalsNote: 'Seeking architectural guidance on distributed caching.',
        },
        true
      )

      const reqId = created.request!.id

      // Attempt response by another mentor
      const unauthorizedRes = await respondToMentorshipRequest(
        reqId,
        anotherMentor.id, // wrong mentor
        'accepted'
      )

      expect(unauthorizedRes.success).toBe(false)
      expect(unauthorizedRes.error).toMatch(/unauthorized/i)
    })
  })

  describe('Mentor Registration & Catalog Search', () => {
    it('allows verified alumni to register mentor profile and renders in mentor catalog', async () => {
      const registerRes = await registerMentorProfile(
        'alumni-lead-999',
        {
          name: 'Shashank Mishra',
          role: 'Staff Data Engineer',
          company: 'Expedia Group',
          experience: '6 years in big data processing & Spark',
          topics: ['Data Engineering', 'Big Data Architecture', 'Apache Spark'],
          availability: '2 slots this month',
        },
        true // isVerified = true
      )

      expect(registerRes.success).toBe(true)
      expect(registerRes.mentor?.name).toBe('Shashank Mishra')

      // Query mentors catalog
      const allMentors = await fetchMentors()
      const found = allMentors.find((m) => m.id === 'alumni-lead-999')
      expect(found).toBeDefined()
      expect(found?.topics).toContain('Data Engineering')
    })

    it('filters mentors by advisory topic and search query across hybrid catalog', async () => {
      // Query seed mentor Sneha Kulkarni by topic 'Data careers'
      const dataMentors = await fetchMentors({ topic: 'Data careers' })
      expect(dataMentors.length).toBeGreaterThan(0)
      expect(dataMentors.some((m) => m.name === 'Sneha Kulkarni')).toBe(true)

      // Query by keyword 'Microsoft'
      const msftMentors = await fetchMentors({ query: 'Microsoft' })
      expect(msftMentors.some((m) => m.name === 'Sneha Kulkarni')).toBe(true)

      // Query by non-existent query
      const nonExistent = await fetchMentors({ query: 'Quantum Cryptography Specialist XYZ' })
      expect(nonExistent.length).toBe(0)
    })
  })
})
