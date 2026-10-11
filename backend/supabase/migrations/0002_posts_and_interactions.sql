-- ==============================================================================
-- Migration: 0002_posts_and_interactions.sql
-- Project: LNCT Connect 2.0 (Backend MVP)
-- Description: Schema, Indexes, Triggers, and RLS for Posts, Comments, Reactions, and Bookmarks
-- ==============================================================================

-- 1. SCHEMAS & TABLES

-- -----------------------------------------------------------------------------
-- POSTS: Campus network updates, questions, and project showcases
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- COMMENTS: Direct discussion comments on campus posts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- POST_REACTIONS: Post likes and campus reactions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like' CHECK (reaction_type IN ('like', 'celebrate', 'support', 'insightful')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_post_user_reaction UNIQUE (post_id, user_id, reaction_type)
);

-- -----------------------------------------------------------------------------
-- POST_BOOKMARKS: Private saved posts for authenticated students
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_post_user_bookmark UNIQUE (post_id, user_id)
);

-- 2. INDEXES FOR HIGH-PERFORMANCE FEED QUERIES
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_user ON public.post_bookmarks(user_id);

-- 3. UPDATED_AT TRIGGERS
DROP TRIGGER IF EXISTS tr_posts_updated_at ON public.posts;
CREATE TRIGGER tr_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_comments_updated_at ON public.comments;
CREATE TRIGGER tr_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- POSTS POLICIES
-- -----------------------------------------------------------------------------
-- Public & Authenticated Read: Everyone can read campus feed posts
CREATE POLICY "Allow read posts to all"
  ON public.posts
  FOR SELECT
  USING (true);

-- Progressive Access Insert: Only verified students can publish posts
CREATE POLICY "Verified users can create posts"
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND verification_status = 'verified'
    )
  );

-- Author Update: Authors can edit their own posts
CREATE POLICY "Authors can update own posts"
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Author or Admin Delete: Authors and admins can delete posts
CREATE POLICY "Authors or admins can delete posts"
  ON public.posts
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- COMMENTS POLICIES
-- -----------------------------------------------------------------------------
-- Read: Everyone can view comments
CREATE POLICY "Allow read comments to all"
  ON public.comments
  FOR SELECT
  USING (true);

-- Progressive Access Insert: Only verified students can comment
CREATE POLICY "Verified users can create comments"
  ON public.comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND verification_status = 'verified'
    )
  );

-- Author Update: Authors can edit their own comments
CREATE POLICY "Authors can update own comments"
  ON public.comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Author or Admin Delete: Authors and admins can delete comments
CREATE POLICY "Authors or admins can delete comments"
  ON public.comments
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- POST REACTIONS POLICIES
-- -----------------------------------------------------------------------------
-- Read: Everyone can view post reactions
CREATE POLICY "Allow read reactions to all"
  ON public.post_reactions
  FOR SELECT
  USING (true);

-- Progressive Access Insert: Only verified students can react/like
CREATE POLICY "Verified users can react to posts"
  ON public.post_reactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND verification_status = 'verified'
    )
  );

-- Delete: Users can remove their own reactions (unlike)
CREATE POLICY "Users can remove own reactions"
  ON public.post_reactions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- POST BOOKMARKS POLICIES
-- -----------------------------------------------------------------------------
-- Read: Users can only see their own bookmarks (private bookmarking)
CREATE POLICY "Users can read own bookmarks"
  ON public.post_bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert: Authenticated users can save posts
CREATE POLICY "Users can bookmark posts"
  ON public.post_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Delete: Users can unsave posts
CREATE POLICY "Users can remove own bookmarks"
  ON public.post_bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
