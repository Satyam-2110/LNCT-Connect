import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { posts as seedPosts } from '../data/posts'
import type { Post } from '../types'

export interface CommentItem {
  id: string
  postId: string
  authorId: string
  author: {
    id: string
    name: string
    initials: string
    avatar: string
    branch: string
    year: string
  }
  content: string
  createdAt: string
  timeAgo: string
}

// In-memory mock store for local development when Supabase credentials are pending
interface MockPost {
  id: string
  authorId: string
  author: {
    id: string
    name: string
    initials: string
    avatar: string
    branch: string
    year: string
  }
  content: string
  tags: string[]
  imageUrl?: string
  createdAt: string
}

interface MockComment {
  id: string
  postId: string
  authorId: string
  author: {
    id: string
    name: string
    initials: string
    avatar: string
    branch: string
    year: string
  }
  content: string
  createdAt: string
}

const mockPostsStore: MockPost[] = []
const mockCommentsStore: MockComment[] = [
  {
    id: 'c1',
    postId: 'p1',
    authorId: 'dev-malviya',
    author: {
      id: 'dev-malviya',
      name: 'Dev Malviya',
      initials: 'DM',
      avatar: 'from-amber-400 to-orange-500',
      branch: 'ECE',
      year: '2nd year',
    },
    content: 'The study flow UI feels remarkably clean. Are you guys using local vector search for the revision notes?',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'c2',
    postId: 'p2',
    authorId: 'kavya-jain',
    author: {
      id: 'kavya-jain',
      name: 'Kavya Jain',
      initials: 'KJ',
      avatar: 'from-emerald-400 to-teal-500',
      branch: 'CSE',
      year: '4th year',
    },
    content: '100% agreed Nisha. The messy trade-offs and iteration sketches are always what recruiters ask about first in portfolio reviews.',
    createdAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
  },
]
const mockLikesStore: Set<string> = new Set() // "userId:postId"
const mockBookmarksStore: Set<string> = new Set() // "userId:postId"

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000))

  if (diffInSeconds < 60) return 'Just now'
  const minutes = Math.floor(diffInSeconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return date.toLocaleDateString()
}

export interface FeedOptions {
  tag?: string
  savedOnly?: boolean
  currentUserId?: string | null
  limit?: number
  offset?: number
}

/**
 * Fetches the campus network feed, combining database posts with seed data
 * and applying tag, bookmark, and pagination filtering.
 */
export async function fetchFeed(options: FeedOptions = {}): Promise<Post[]> {
  const { tag, savedOnly, currentUserId, limit, offset = 0 } = options
  let dbPosts: Post[] = []

  if (isSupabaseConfigured) {
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          author_id,
          content,
          tags,
          image_url,
          created_at,
          profiles!author_id (
            id,
            full_name,
            avatar_url,
            branch,
            batch
          ),
          post_reactions (
            user_id
          ),
          comments (
            id
          ),
          post_bookmarks (
            user_id
          )
        `)
        .order('created_at', { ascending: false })

      if (limit !== undefined) {
        query = query.range(offset, offset + limit - 1)
      }

      const { data, error } = await query


      if (!error && data) {
        dbPosts = data.map((row: any) => {
          const profile = row.profiles || {}
          const nameParts = (profile.full_name || 'Student').trim().split(' ')
          const initials =
            nameParts.length > 1
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
              : nameParts[0].slice(0, 2).toUpperCase()

          const likesCount = (row.post_reactions || []).length
          const commentsCount = (row.comments || []).length
          const userLiked = currentUserId
            ? (row.post_reactions || []).some((r: any) => r.user_id === currentUserId)
            : false
          const userSaved = currentUserId
            ? (row.post_bookmarks || []).some((b: any) => b.user_id === currentUserId)
            : false

          return {
            id: row.id,
            author: {
              id: row.author_id,
              name: profile.full_name || 'Student',
              initials,
              avatar: profile.avatar_url || 'warm',
              branch: profile.branch || 'Engineering',
              year: profile.batch || 'Student',
            },
            time: formatRelativeTime(row.created_at),
            content: row.content,
            tags: row.tags || [],
            image: row.image_url || undefined,
            likes: likesCount,
            comments: commentsCount,
            shares: 0,
            liked: userLiked,
            saved: userSaved,
          }
        })
      }
    } catch (err) {
      console.error('[LNCT Connect] Error fetching feed from database:', err)
    }
  } else {
    // Offline local store mapping
    dbPosts = mockPostsStore.map((mp) => {
      const likesCount = Array.from(mockLikesStore).filter((k) => k.endsWith(`:${mp.id}`)).length
      const commentsCount = mockCommentsStore.filter((c) => c.postId === mp.id).length
      const userLiked = currentUserId ? mockLikesStore.has(`${currentUserId}:${mp.id}`) : false
      const userSaved = currentUserId ? mockBookmarksStore.has(`${currentUserId}:${mp.id}`) : false

      return {
        id: mp.id,
        author: mp.author,
        time: formatRelativeTime(mp.createdAt),
        content: mp.content,
        tags: mp.tags,
        image: mp.imageUrl,
        likes: likesCount,
        comments: commentsCount,
        shares: 0,
        liked: userLiked,
        saved: userSaved,
      }
    })
  }

  // Combine live posts with seed posts (avoiding duplicate IDs)
  const existingIds = new Set(dbPosts.map((p) => p.id))
  const augmentedSeedPosts = seedPosts
    .filter((sp) => !existingIds.has(sp.id))
    .map((sp) => {
      const userLiked = currentUserId ? mockLikesStore.has(`${currentUserId}:${sp.id}`) : Boolean(sp.liked)
      const userSaved = currentUserId ? mockBookmarksStore.has(`${currentUserId}:${sp.id}`) : Boolean(sp.saved)
      return {
        ...sp,
        liked: userLiked,
        saved: userSaved,
      }
    })

  let combined = [...dbPosts, ...augmentedSeedPosts]

  // Apply Tag Filter
  if (tag && tag !== 'All') {
    const formattedTag = tag.startsWith('#') ? tag.toLowerCase() : `#${tag.toLowerCase()}`
    combined = combined.filter((p) =>
      p.tags.some((t) => t.toLowerCase() === formattedTag || t.toLowerCase() === tag.toLowerCase())
    )
  }

  // Apply Saved Filter
  if (savedOnly) {
    combined = combined.filter((p) => p.saved)
  }

  if (limit !== undefined) {
    combined = combined.slice(offset, offset + limit)
  }

  return combined
}


export const fetchFeedPosts = fetchFeed


/**
 * Publishes a new post to the campus feed.
 * Strictly verifies progressive access prerequisites.
 */
export async function createPost(
  authorId: string,
  authorProfile: {
    name: string
    initials: string
    avatar?: string
    branch?: string
    year?: string
  },
  content: string,
  tags: string[] = [],
  isVerified: boolean,
  imageUrl?: string
): Promise<{ error: Error | null; post?: Post }> {
  const trimmed = content.trim()
  if (!trimmed) {
    return { error: new Error('Post content cannot be empty.') }
  }

  // Progressive access check
  if (!isVerified) {
    return {
      error: new Error('Student verification required. Please verify your student ID before publishing posts.'),
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: authorId,
          content: trimmed,
          tags,
          image_url: imageUrl || '',
        })
        .select()
        .single()

      if (error) return { error }

      const newPostItem: Post = {
        id: data.id,
        author: {
          id: authorId,
          name: authorProfile.name,
          initials: authorProfile.initials,
          avatar: authorProfile.avatar || 'warm',
          branch: authorProfile.branch || 'Engineering',
          year: authorProfile.year || 'Student',
        },
        time: 'Just now',
        content: trimmed,
        tags,
        image: imageUrl,
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
        saved: false,
      }

      return { error: null, post: newPostItem }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline fallback
  const mockId = `mock-post-${Date.now()}`
  const now = new Date().toISOString()
  const mockItem: MockPost = {
    id: mockId,
    authorId,
    author: {
      id: authorId,
      name: authorProfile.name,
      initials: authorProfile.initials,
      avatar: authorProfile.avatar || 'warm',
      branch: authorProfile.branch || 'Engineering',
      year: authorProfile.year || 'Student',
    },
    content: trimmed,
    tags,
    imageUrl,
    createdAt: now,
  }
  mockPostsStore.unshift(mockItem)

  const createdPost: Post = {
    id: mockId,
    author: mockItem.author,
    time: 'Just now',
    content: trimmed,
    tags,
    image: imageUrl,
    likes: 0,
    comments: 0,
    shares: 0,
    liked: false,
    saved: false,
  }

  return { error: null, post: createdPost }
}

/**
 * Deletes a post created by the active student.
 */
export async function deletePost(
  postId: string,
  authorId: string
): Promise<{ error: Error | null }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', authorId)

      return { error }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline deletion
  const index = mockPostsStore.findIndex((p) => p.id === postId)
  if (index !== -1) {
    if (mockPostsStore[index].authorId !== authorId) {
      return { error: new Error('You do not have permission to delete this post.') }
    }
    mockPostsStore.splice(index, 1)
  }
  return { error: null }
}

/**
 * Retrieves comments for a given post.
 */
export async function fetchComments(postId: string): Promise<CommentItem[]> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          post_id,
          author_id,
          content,
          created_at,
          profiles!author_id (
            id,
            full_name,
            avatar_url,
            branch,
            batch
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[LNCT Connect] Error fetching comments:', error.message)
        return []
      }

      if (data) {
        return data.map((row: any) => {
          const profile = row.profiles || {}
          const nameParts = (profile.full_name || 'Student').trim().split(' ')
          const initials =
            nameParts.length > 1
              ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
              : nameParts[0].slice(0, 2).toUpperCase()

          return {
            id: row.id,
            postId: row.post_id,
            authorId: row.author_id,
            author: {
              id: row.author_id,
              name: profile.full_name || 'Student',
              initials,
              avatar: profile.avatar_url || 'warm',
              branch: profile.branch || 'Engineering',
              year: profile.batch || 'Student',
            },
            content: row.content,
            createdAt: row.created_at,
            timeAgo: formatRelativeTime(row.created_at),
          }
        })
      }
      return []
    } catch (err) {
      console.error('[LNCT Connect] Error fetching comments:', err)
      return []
    }
  }

  // Local offline fallback
  return mockCommentsStore
    .filter((c) => c.postId === postId)
    .map((c) => ({
      id: c.id,
      postId: c.postId,
      authorId: c.authorId,
      author: c.author,
      content: c.content,
      createdAt: c.createdAt,
      timeAgo: formatRelativeTime(c.createdAt),
    }))
}

/**
 * Adds a new comment to a post.
 * Strictly verifies progressive access prerequisites.
 */
export async function createComment(
  postId: string,
  authorId: string,
  authorProfile: {
    name: string
    initials: string
    avatar?: string
    branch?: string
    year?: string
  },
  content: string,
  isVerified: boolean
): Promise<{ error: Error | null; comment?: CommentItem }> {
  const trimmed = content.trim()
  if (!trimmed) {
    return { error: new Error('Comment cannot be empty.') }
  }

  // Progressive access check
  if (!isVerified) {
    return {
      error: new Error('Student verification required. Please verify your student ID before commenting.'),
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          author_id: authorId,
          content: trimmed,
        })
        .select()
        .single()

      if (error) return { error }

      const commentItem: CommentItem = {
        id: data.id,
        postId,
        authorId,
        author: {
          id: authorId,
          name: authorProfile.name,
          initials: authorProfile.initials,
          avatar: authorProfile.avatar || 'warm',
          branch: authorProfile.branch || 'Engineering',
          year: authorProfile.year || 'Student',
        },
        content: trimmed,
        createdAt: data.created_at,
        timeAgo: 'Just now',
      }
      return { error: null, comment: commentItem }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline fallback
  const mockId = `mock-cmt-${Date.now()}`
  const now = new Date().toISOString()
  const mockItem: MockComment = {
    id: mockId,
    postId,
    authorId,
    author: {
      id: authorId,
      name: authorProfile.name,
      initials: authorProfile.initials,
      avatar: authorProfile.avatar || 'warm',
      branch: authorProfile.branch || 'Engineering',
      year: authorProfile.year || 'Student',
    },
    content: trimmed,
    createdAt: now,
  }
  mockCommentsStore.push(mockItem)

  return {
    error: null,
    comment: {
      id: mockId,
      postId,
      authorId,
      author: mockItem.author,
      content: trimmed,
      createdAt: now,
      timeAgo: 'Just now',
    },
  }
}

/**
 * Deletes a comment.
 */
export async function deleteComment(
  commentId: string,
  authorId: string
): Promise<{ error: Error | null }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('author_id', authorId)

      return { error }
    } catch (err: any) {
      return { error: err }
    }
  }

  const idx = mockCommentsStore.findIndex((c) => c.id === commentId && c.authorId === authorId)
  if (idx !== -1) {
    mockCommentsStore.splice(idx, 1)
  }
  return { error: null }
}

/**
 * Toggles a like reaction on a post.
 * Strictly verifies progressive access prerequisites.
 */
export async function toggleLike(
  postId: string,
  userId: string,
  isVerified: boolean
): Promise<{ error: Error | null; liked?: boolean }> {
  // Progressive access check
  if (!isVerified) {
    return {
      error: new Error('Student verification required. Please verify your student ID before liking posts.'),
    }
  }

  if (isSupabaseConfigured) {
    try {
      // Check existing reaction
      const { data: existing, error: checkErr } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      if (checkErr) return { error: checkErr }

      if (existing) {
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existing.id)

        if (error) return { error }
        return { error: null, liked: false }
      } else {
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: userId,
            reaction_type: 'like',
          })

        if (error) return { error }
        return { error: null, liked: true }
      }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline fallback
  const key = `${userId}:${postId}`
  if (mockLikesStore.has(key)) {
    mockLikesStore.delete(key)
    return { error: null, liked: false }
  } else {
    mockLikesStore.add(key)
    return { error: null, liked: true }
  }
}

/**
 * Toggles a saved bookmark on a post.
 */
export async function toggleBookmark(
  postId: string,
  userId: string
): Promise<{ error: Error | null; saved?: boolean }> {
  if (isSupabaseConfigured) {
    try {
      const { data: existing, error: checkErr } = await supabase
        .from('post_bookmarks')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle()

      if (checkErr) return { error: checkErr }

      if (existing) {
        const { error } = await supabase
          .from('post_bookmarks')
          .delete()
          .eq('id', existing.id)

        if (error) return { error }
        return { error: null, saved: false }
      } else {
        const { error } = await supabase
          .from('post_bookmarks')
          .insert({
            post_id: postId,
            user_id: userId,
          })

        if (error) return { error }
        return { error: null, saved: true }
      }
    } catch (err: any) {
      return { error: err }
    }
  }

  // Local offline fallback
  const key = `${userId}:${postId}`
  if (mockBookmarksStore.has(key)) {
    mockBookmarksStore.delete(key)
    return { error: null, saved: false }
  } else {
    mockBookmarksStore.add(key)
    return { error: null, saved: true }
  }
}
