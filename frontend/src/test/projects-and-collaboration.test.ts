import { describe, it, expect, beforeEach } from 'vitest'
import {
  fetchProjects,
  createProject,
  applyToProject,
  fetchProjectApplications,
  respondToApplication,
  deleteProject,
  __resetProjectsStore,
} from '../services/projects'
import {
  fetchOpportunities,
  toggleOpportunityBookmark,
} from '../services/opportunities'

describe('Phase 12: Projects, Collaboration & Opportunities', () => {
  beforeEach(() => {
    __resetProjectsStore()
  })
  const verifiedCreator = {
    id: 'creator-user-001',
    name: 'Aanya Mehta',
    initials: 'AM',
    avatar: 'warm',
  }

  const verifiedApplicant = {
    id: 'applicant-user-002',
    name: 'Rohan Verma',
    initials: 'RV',
    avatar: 'warm',
    branch: 'CSE',
    year: '2nd year',
  }

  describe('Project Creation & Progressive Access Gating', () => {
    it('blocks unverified students from publishing projects with descriptive error', async () => {
      const result = await createProject(
        'unverified-creator',
        { name: 'Unverified Student', initials: 'US' },
        {
          name: 'Campus Notes Share',
          description: 'A platform to share class notes.',
          category: 'Campus Tech',
          tech: ['React', 'Node.js'],
          lookingFor: ['Frontend Developer'],
          status: 'Building',
        },
        false // isVerified = false
      )

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toMatch(/verification required/i)
      expect(result.project).toBeUndefined()
    })

    it('rejects project creation with empty name or description', async () => {
      const result = await createProject(
        verifiedCreator.id,
        verifiedCreator,
        {
          name: '   ',
          description: '',
          tech: ['React'],
          lookingFor: ['Designer'],
          status: 'Building',
        },
        true
      )

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toMatch(/required/i)
    })

    it('allows verified students to successfully publish a project', async () => {
      const result = await createProject(
        verifiedCreator.id,
        verifiedCreator,
        {
          name: 'LNCT Autonomous Rover',
          description: 'Building an autonomous delivery rover for college campus navigation.',
          category: 'Campus Tech',
          tech: ['Python', 'C++', 'ROS'],
          lookingFor: ['Embedded Engineer', 'Computer Vision Dev'],
          status: 'Building',
          progress: 35,
        },
        true // isVerified = true
      )

      expect(result.error).toBeNull()
      expect(result.project).toBeDefined()
      expect(result.project?.name).toBe('LNCT Autonomous Rover')
      expect(result.project?.creator.name).toBe(verifiedCreator.name)
      expect(result.project?.members).toBe(1)
    })
  })

  describe('Team Recruitment & Join Requests Workflow', () => {
    it('blocks unverified students from applying to join project teams', async () => {
      const result = await applyToProject(
        'ai-study',
        'unverified-applicant',
        verifiedApplicant,
        'I want to join your team!',
        false // isVerified = false
      )

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toMatch(/verification required/i)
    })

    it('prevents project creator from applying to join their own project', async () => {
      // First create a new project with verifiedCreator
      const projRes = await createProject(
        verifiedCreator.id,
        verifiedCreator,
        {
          name: 'Creator Self Test Project',
          description: 'Testing creator self-application restriction.',
          tech: ['React'],
          lookingFor: ['Developer'],
          status: 'Ideation',
        },
        true
      )
      const projectId = projRes.project!.id

      // Creator attempts to apply to their own project
      const result = await applyToProject(
        projectId,
        verifiedCreator.id, // same as creator
        { name: verifiedCreator.name, initials: verifiedCreator.initials },
        'Applying to my own team',
        true
      )

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toMatch(/cannot apply to join your own project/i)
    })

    it('allows verified candidate to apply and creator to accept the application', async () => {
      // Create project
      const projRes = await createProject(
        verifiedCreator.id,
        verifiedCreator,
        {
          name: 'Open Source Compiler Workshop',
          description: 'Hands-on compiler construction study group.',
          tech: ['Rust', 'LLVM'],
          lookingFor: ['Rust Developer'],
          status: 'Building',
        },
        true
      )
      const projectId = projRes.project!.id

      // Candidate applies
      const applyRes = await applyToProject(
        projectId,
        verifiedApplicant.id,
        verifiedApplicant,
        'Excited about LLVM! Would love to contribute.',
        true
      )
      expect(applyRes.error).toBeNull()

      // Creator reviews applications
      const applications = await fetchProjectApplications(projectId)
      expect(applications.length).toBeGreaterThan(0)
      const targetApp = applications.find((a) => a.applicantId === verifiedApplicant.id)
      expect(targetApp).toBeDefined()
      expect(targetApp?.status).toBe('pending')

      // Creator accepts application
      const acceptRes = await respondToApplication(
        targetApp!.id,
        true,
        projectId,
        verifiedApplicant.id
      )
      expect(acceptRes.error).toBeNull()

      // Re-query applications
      const updatedApps = await fetchProjectApplications(projectId)
      const acceptedApp = updatedApps.find((a) => a.id === targetApp!.id)
      expect(acceptedApp?.status).toBe('accepted')
    })

    it('allows creator to decline a candidate application', async () => {
      // Create project
      const projRes = await createProject(
        verifiedCreator.id,
        verifiedCreator,
        {
          name: 'Robotics Fleet Sim',
          description: 'Testing robotics simulator.',
          tech: ['Gazebo'],
          lookingFor: ['Sim Engineer'],
          status: 'Ideation',
        },
        true
      )
      const projectId = projRes.project!.id

      const candidateId = 'applicant-to-decline-003'
      await applyToProject(
        projectId,
        candidateId,
        { name: 'Declined User', initials: 'DU' },
        'Hello',
        true
      )

      const apps = await fetchProjectApplications(projectId)
      const target = apps.find((a) => a.applicantId === candidateId)
      expect(target).toBeDefined()

      const declineRes = await respondToApplication(target!.id, false, projectId, candidateId)
      expect(declineRes.error).toBeNull()

      const recheckedApps = await fetchProjectApplications(projectId)
      const rechecked = recheckedApps.find((a) => a.id === target!.id)
      expect(rechecked?.status).toBe('rejected')
    })
  })

  describe('Project Search & Tech Filters', () => {
    it('filters projects by tech stack', async () => {
      const filtered = await fetchProjects({ tech: 'Python' })
      expect(filtered.length).toBeGreaterThan(0)
      for (const p of filtered) {
        expect(p.tech).toContain('Python')
      }
    })

    it('filters projects by status', async () => {
      const filtered = await fetchProjects({ status: 'Launched' })
      expect(filtered.length).toBeGreaterThan(0)
      for (const p of filtered) {
        expect(p.status).toBe('Launched')
      }
    })
  })

  describe('Opportunities Board & Bookmarking', () => {
    it('filters opportunities by category', async () => {
      const { opportunities } = await fetchOpportunities({ category: 'Hackathon' })
      expect(opportunities.length).toBeGreaterThan(0)
      for (const o of opportunities) {
        expect(o.type).toBe('Hackathon')
      }
    })

    it('toggles and respects opportunity bookmarks', async () => {
      const testUserId = 'student-bookmark-evaluator'
      const targetOppId = 'hackverse'

      // Bookmark opportunity
      const bmark1 = await toggleOpportunityBookmark(targetOppId, testUserId)
      expect(bmark1.error).toBeNull()
      expect(bmark1.saved).toBe(true)

      // Query with savedOnly
      const { opportunities: savedOpps } = await fetchOpportunities({
        savedOnly: true,
        currentUserId: testUserId,
      })
      expect(savedOpps.some((o) => o.id === targetOppId)).toBe(true)

      // Unbookmark
      const bmark2 = await toggleOpportunityBookmark(targetOppId, testUserId)
      expect(bmark2.error).toBeNull()
      expect(bmark2.saved).toBe(false)
    })
  })
})
