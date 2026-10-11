-- ==============================================================================
-- Migration: 0003_projects_and_opportunities.sql
-- Project: LNCT Connect 2.0 (Backend MVP)
-- Description: Schema, Indexes, Triggers, and RLS for Projects, Collaboration Members,
--              Join Applications, Opportunities, and Opportunity Bookmarks
-- ==============================================================================

-- 1. SCHEMAS & TABLES

-- -----------------------------------------------------------------------------
-- PROJECTS: Campus initiatives, tech products, hackathon builds, and startups
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  description TEXT NOT NULL CHECK (char_length(trim(description)) > 0),
  category TEXT NOT NULL DEFAULT 'Campus Tech',
  tech TEXT[] NOT NULL DEFAULT '{}',
  looking_for TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'Building' CHECK (status IN ('Ideation', 'Building', 'Launched')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  accent TEXT DEFAULT 'from-amber-500/25 to-orange-500/5',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- PROJECT_MEMBERS: Team members collaborating on a project
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member', 'mentor')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_project_member UNIQUE (project_id, user_id)
);

-- -----------------------------------------------------------------------------
-- PROJECT_APPLICATIONS: Join requests sent by students to join project teams
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_project_application UNIQUE (project_id, applicant_id)
);

-- -----------------------------------------------------------------------------
-- OPPORTUNITIES: Campus hackathons, internships, jobs, and events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  organization TEXT NOT NULL,
  logo TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('Internship', 'Job', 'Hackathon', 'Competition', 'Campus Event', 'Freelance')),
  location TEXT NOT NULL,
  deadline TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  posted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- OPPORTUNITY_BOOKMARKS: Private saved opportunities for students
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.opportunity_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_opportunity_bookmark UNIQUE (opportunity_id, user_id)
);

-- 2. INDEXES
CREATE INDEX IF NOT EXISTS idx_projects_creator ON public.projects(creator_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_project ON public.project_applications(project_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_applicant ON public.project_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_project_applications_status ON public.project_applications(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities(type);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON public.opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_opportunity_bookmarks_user ON public.opportunity_bookmarks(user_id);

-- 3. TRIGGERS
DROP TRIGGER IF EXISTS tr_projects_updated_at ON public.projects;
CREATE TRIGGER tr_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_project_applications_updated_at ON public.project_applications;
CREATE TRIGGER tr_project_applications_updated_at
  BEFORE UPDATE ON public.project_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_bookmarks ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- PROJECTS POLICIES
-- -----------------------------------------------------------------------------
-- Read: Everyone can explore campus projects
CREATE POLICY "Allow read projects to all"
  ON public.projects
  FOR SELECT
  USING (true);

-- Create: Only verified students can publish projects
CREATE POLICY "Verified users can create projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND verification_status = 'verified'
    )
  );

-- Update: Only creator can update
CREATE POLICY "Creators can update own projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Delete: Creator or admin
CREATE POLICY "Creators or admins can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = creator_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- PROJECT MEMBERS POLICIES
-- -----------------------------------------------------------------------------
-- Read: Everyone can view project teammates
CREATE POLICY "Allow read project members to all"
  ON public.project_members
  FOR SELECT
  USING (true);

-- Insert: Creator can add members, or creator adds self upon project creation
CREATE POLICY "Creators can manage project members"
  ON public.project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_members.project_id AND creator_id = auth.uid()
    )
  );

-- Delete: Member can leave or creator can remove
CREATE POLICY "Members or creators can remove memberships"
  ON public.project_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_members.project_id AND creator_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- PROJECT APPLICATIONS POLICIES
-- -----------------------------------------------------------------------------
-- Read: Applicant can view their own application, or creator can view applications for their project
CREATE POLICY "Applicants and project creators can view applications"
  ON public.project_applications
  FOR SELECT
  TO authenticated
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_applications.project_id AND creator_id = auth.uid()
    )
  );

-- Insert: Verified students can apply (except project creator cannot apply to own project)
CREATE POLICY "Verified students can submit join requests"
  ON public.project_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = applicant_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND verification_status = 'verified'
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_applications.project_id AND creator_id = auth.uid()
    )
  );

-- Update: Project creator can update application status (accept/reject)
CREATE POLICY "Project creators can update application status"
  ON public.project_applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_applications.project_id AND creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_applications.project_id AND creator_id = auth.uid()
    )
  );

-- Delete: Applicant or project creator can cancel/delete application
CREATE POLICY "Applicants or creators can delete applications"
  ON public.project_applications
  FOR DELETE
  TO authenticated
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_applications.project_id AND creator_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- OPPORTUNITIES POLICIES
-- -----------------------------------------------------------------------------
-- Read: Everyone can explore campus opportunities
CREATE POLICY "Allow read opportunities to all"
  ON public.opportunities
  FOR SELECT
  USING (true);

-- Insert: Admins or verified faculty/students
CREATE POLICY "Verified users or admins can post opportunities"
  ON public.opportunities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (role = 'admin' OR verification_status = 'verified')
    )
  );

-- -----------------------------------------------------------------------------
-- OPPORTUNITY BOOKMARKS POLICIES
-- -----------------------------------------------------------------------------
-- Read: Users only see their own bookmarks
CREATE POLICY "Users can read own opportunity bookmarks"
  ON public.opportunity_bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert: Authenticated users can bookmark
CREATE POLICY "Users can bookmark opportunities"
  ON public.opportunity_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Delete: Users can remove bookmark
CREATE POLICY "Users can remove own opportunity bookmarks"
  ON public.opportunity_bookmarks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
