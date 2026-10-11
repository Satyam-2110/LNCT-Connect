import { describe, it, expect } from 'vitest'
import {
  fetchFeed,
  createPost,
  deletePost,
  fetchComments,
  createComment,
  deleteComment,
  toggleLike,
  toggleBookmark,
  formatRelativeTime,
} from '../services/posts'

describe('Phase 11: Community Feed, Posts, Comments & Reactions', () => {
  const verifiedAuthor = {
    id: 'student-auth-101',
    name: 'Aakash Patel',
    initials: 'AP',
    avatar: 'warm',
    branch: 'Computer Science',
    year: '3rd year',
  }

  describe('Post Creation & Progressive Access Gating', () => {
    it('blocks unverified users from publishing posts with a descriptive error', async () => {
      const result = await createPost(
        'unverified-user-999',
        {
          name: 'Unverified Student',
          initials: 'US',
          avatar: 'warm',
          branch: 'ECE',
          year: '1st year',
        },
        'Trying to post without student ID verification',
        ['#Testing'],
        false // isVerified = false
      )

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toMatch(/verification required/i)
      expect(result.post).toBeUndefined()
    })

    it('rejects empty or whitespace-only post content', async () => {
      const result = await createPost(
        verifiedAuthor.id,
        verifiedAuthor,
        '   \n\t  ',
        ['#Testing'],
        true
      )

      expect(result.error).not.toBeNull()
      expect(result.error?.message).toMatch(/content cannot be empty/i)
    })

    it('allows verified students to successfully publish posts', async () => {
      const content = 'Launching our decentralized campus notes repository on GitHub today!'
      const tags = ['#BuildInPublic', '#OpenSource']

      const result = await createPost(
        verifiedAuthor.id,
        verifiedAuthor,
        content,
        tags,
        true // isVerified = true
      )

      expect(result.error).toBeNull()
      expect(result.post).toBeDefined()
      expect(result.post?.content).toBe(content)
      expect(result.post?.tags).toEqual(tags)
      expect(result.post?.author.name).toBe(verifiedAuthor.name)
      expect(result.post?.likes).toBe(0)
    })
  })

  describe('Author Ownership & Post Deletion', () => {
    it('allows post author to delete their own post', async () => {
      // First create a post
      const createRes = await createPost(
        verifiedAuthor.id,
        verifiedAuthor,
        'Temporary post to be deleted',
        ['#Temporary'],
        true
      )
      expect(createRes.post).toBeDefined()
      const postId = createRes.post!.id

      // Delete the post as the author
      const deleteRes = await deletePost(postId, verifiedAuthor.id)
      expect(deleteRes.error).toBeNull()
    })

    it('prevents non-authors from deleting other students posts', async () => {
      const createRes = await createPost(
        verifiedAuthor.id,
        verifiedAuthor,
        'Protected author post',
        ['#Protected'],
        true
      )
      const postId = createRes.post!.id

      // Attempt to delete with a foreign user ID
      const deleteRes = await deletePost(postId, 'malicious-user-666')
      expect(deleteRes.error).not.toBeNull()
      expect(deleteRes.error?.message).toMatch(/permission/i)
    })
  })

  describe('Reactions (Likes) & Idempotency', () => {
    it('blocks unverified students from reacting to posts', async () => {
      const result = await toggleLike('p1', 'unverified-student-12', false)
      expect(result.error).not.toBeNull()
      expect(result.error?.message).toMatch(/verification required/i)
    })

    it('toggles post like on and off for verified students', async () => {
      const testUserId = 'verified-liker-1'
      const testPostId = 'p1'

      // First like
      const like1 = await toggleLike(testPostId, testUserId, true)
      expect(like1.error).toBeNull()
      expect(like1.liked).toBe(true)

      // Unlike
      const like2 = await toggleLike(testPostId, testUserId, true)
      expect(like2.error).toBeNull()
      expect(like2.liked).toBe(false)
    })
  })

  describe('Comments Workflow', () => {
    it('blocks unverified users from commenting on posts', async () => {
      const result = await createComment(
        'p1',
        'unverified-user',
        verifiedAuthor,
        'This comment should be blocked',
        false
      )
      expect(result.error).not.toBeNull()
      expect(result.error?.message).toMatch(/verification required/i)
    })

    it('allows verified students to add and retrieve comments', async () => {
      const commentText = 'Great initiative! Happy to contribute documentation.'
      const result = await createComment(
        'p1',
        verifiedAuthor.id,
        verifiedAuthor,
        commentText,
        true
      )

      expect(result.error).toBeNull()
      expect(result.comment).toBeDefined()
      expect(result.comment?.content).toBe(commentText)
      expect(result.comment?.author.name).toBe(verifiedAuthor.name)

      // Fetch comments for post
      const comments = await fetchComments('p1')
      const found = comments.find((c) => c.content === commentText)
      expect(found).toBeDefined()
    })
  })

  describe('Feed Tag & Saved Filtering', () => {
    it('filters posts by specific hashtag', async () => {
      const feed = await fetchFeed({ tag: '#BuildInPublic' })
      expect(feed.length).toBeGreaterThan(0)
      for (const post of feed) {
        const hasTag = post.tags.some(
          (t) => t.toLowerCase() === '#buildinpublic' || t.toLowerCase() === 'buildinpublic'
        )
        expect(hasTag).toBe(true)
      }
    })

    it('toggles and respects bookmark saving', async () => {
      const bookmarkUser = 'user-bookmark-test'
      const targetPost = 'p2'

      const bookmark1 = await toggleBookmark(targetPost, bookmarkUser)
      expect(bookmark1.error).toBeNull()
      expect(bookmark1.saved).toBe(true)

      const savedFeed = await fetchFeed({ savedOnly: true, currentUserId: bookmarkUser })
      expect(savedFeed.some((p) => p.id === targetPost)).toBe(true)

      // Untoggle bookmark
      const bookmark2 = await toggleBookmark(targetPost, bookmarkUser)
      expect(bookmark2.error).toBeNull()
      expect(bookmark2.saved).toBe(false)
    })
  })

  describe('Relative Time Formatter', () => {
    it('formats recent timestamps correctly', () => {
      const justNow = new Date().toISOString()
      expect(formatRelativeTime(justNow)).toBe('Just now')

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      expect(formatRelativeTime(tenMinutesAgo)).toBe('10m ago')

      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago')
    })
  })
})
