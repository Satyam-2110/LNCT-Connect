import { describe, it, expect } from 'vitest'
import generateScript from '../../../backend/scripts/generate-types.js?raw'
import packageJsonRaw from '../../package.json?raw'
import postsServiceRaw from '../services/posts.ts?raw'
import projectsServiceRaw from '../services/projects.ts?raw'
import profilesServiceRaw from '../services/profiles.ts?raw'
import mentorshipServiceRaw from '../services/mentorship.ts?raw'
import messagingServiceRaw from '../services/messaging.ts?raw'

import { fetchFeed } from '../services/posts'
import { fetchProjects } from '../services/projects'
import { fetchProfiles } from '../services/profiles'
import { fetchMentors } from '../services/mentorship'
import { fetchConversations, getOrCreateConversation } from '../services/messaging'

describe('Phase 20: Performance, Tooling & Script Hygiene', () => {
  describe('1. Query Pagination & Bound Enforcement', () => {
    it('applies pagination limits and offsets in fetchFeed', async () => {
      const allPosts = await fetchFeed()
      expect(allPosts.length).toBeGreaterThanOrEqual(3)

      const page1 = await fetchFeed({ limit: 1, offset: 0 })
      const page2 = await fetchFeed({ limit: 1, offset: 1 })

      expect(page1).toHaveLength(1)
      expect(page2).toHaveLength(1)
      expect(page1[0].id).not.toBe(page2[0].id)
    })

    it('applies pagination limits and offsets in fetchProjects', async () => {
      const allProjects = await fetchProjects()
      expect(allProjects.length).toBeGreaterThan(2)

      const page1 = await fetchProjects({ limit: 2, offset: 0 })
      const page2 = await fetchProjects({ limit: 2, offset: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(2)
      expect(page1[0].id).not.toBe(page2[0].id)
    })

    it('applies pagination limits and offsets in fetchProfiles', async () => {
      const allProfiles = await fetchProfiles()
      expect(allProfiles.length).toBeGreaterThan(2)

      const page1 = await fetchProfiles({ limit: 2, offset: 0 })
      const page2 = await fetchProfiles({ limit: 2, offset: 2 })

      expect(page1).toHaveLength(2)
      expect(page2).toHaveLength(2)
      expect(page1[0].id).not.toBe(page2[0].id)
    })

    it('applies pagination limits and offsets in fetchMentors', async () => {
      const allMentors = await fetchMentors()
      expect(allMentors.length).toBeGreaterThan(1)

      const page1 = await fetchMentors({ limit: 1, offset: 0 })
      const page2 = await fetchMentors({ limit: 1, offset: 1 })

      expect(page1).toHaveLength(1)
      expect(page2).toHaveLength(1)
      expect(page1[0].id).not.toBe(page2[0].id)
    })

    it('applies pagination limits and offsets in fetchConversations', async () => {
      // Create test conversations to ensure at least 2 conversations exist
      await getOrCreateConversation(
        'user-p20-1',
        'user-p20-2',
        { name: 'User Two', initials: 'U2', avatar: 'warm' },
        true
      )
      await getOrCreateConversation(
        'user-p20-1',
        'user-p20-3',
        { name: 'User Three', initials: 'U3', avatar: 'warm' },
        true
      )

      const allConversations = await fetchConversations('user-p20-1')
      expect(allConversations.length).toBeGreaterThanOrEqual(2)

      const page1 = await fetchConversations('user-p20-1', { limit: 1, offset: 0 })
      const page2 = await fetchConversations('user-p20-1', { limit: 1, offset: 1 })

      expect(page1).toHaveLength(1)
      expect(page2).toHaveLength(1)
      expect(page1[0].id).not.toBe(page2[0].id)
    })

    it('implements PostgREST query .range() boundary delegation across service layers', () => {
      expect(postsServiceRaw).toContain('.range(offset, offset + limit - 1)')
      expect(projectsServiceRaw).toContain('.range(offset, offset + limit - 1)')
      expect(profilesServiceRaw).toContain('.range(offset, offset + limit - 1)')
      expect(mentorshipServiceRaw).toContain('.range(offset, offset + limit - 1)')
      expect(messagingServiceRaw).toContain('.range(offset, offset + limit - 1)')
    })
  })

  describe('2. Tooling & Script Hygiene', () => {
    it('scripts/generate-types.js guards against missing project ID and placeholders', () => {
      expect(generateScript).toContain('process.env.SUPABASE_PROJECT_ID')
      expect(generateScript).toContain('[YOUR_PROJECT_ID]')
      expect(generateScript).toContain('process.exit(1)')
      expect(generateScript).toContain('targetPath')
      expect(generateScript).toContain('Database types file was preserved and not modified')
    })

    it('package.json configures safe scripts for typegen and linting', () => {
      const pkg = JSON.parse(packageJsonRaw)
      expect(pkg.scripts['db:types']).toBe('node ../backend/scripts/generate-types.js')
      expect(pkg.scripts['lint']).toBe('tsc -b')
    })
  })
})
