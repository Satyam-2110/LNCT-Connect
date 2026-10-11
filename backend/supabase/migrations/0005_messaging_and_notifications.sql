-- ==============================================================================
-- Migration: 0005_messaging_and_notifications.sql
-- Project: LNCT Connect 2.0 (Backend MVP)
-- Description: Schema, Indexes, Triggers, and RLS for 1-on-1 Conversations,
--              Direct Messages, and In-App Notifications
-- ==============================================================================

-- 1. SCHEMAS & TABLES

-- -----------------------------------------------------------------------------
-- CONVERSATIONS: 1-on-1 direct message threads between two campus members
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_two UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT check_distinct_participants CHECK (participant_one <> participant_two)
);

-- -----------------------------------------------------------------------------
-- MESSAGES: Real-time and persistent chat messages inside conversations
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(trim(content)) > 0),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS: Campus activity notifications (connections, mentorship, projects)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('connection_request', 'connection_accepted', 'project_application', 'mentorship_request', 'message', 'reaction')),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  message TEXT NOT NULL CHECK (char_length(trim(message)) > 0),
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON public.conversations(participant_one);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON public.conversations(participant_two);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(conversation_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, is_read);

-- 3. TRIGGERS
-- Trigger to keep conversation.last_message and conversation.updated_at in sync
CREATE OR REPLACE FUNCTION public.handle_new_message_conversation_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message = NEW.content,
    last_message_at = NEW.created_at,
    updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_messages_update_conversation ON public.messages;
CREATE TRIGGER trg_messages_update_conversation
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_message_conversation_update();

-- 4. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS: CONVERSATIONS
-- -----------------------------------------------------------------------------

-- Read: Only conversation participants can view the thread
CREATE POLICY "Participants can view conversations"
  ON public.conversations
  FOR SELECT
  USING (
    auth.uid() = participant_one
    OR auth.uid() = participant_two
  );

-- Insert: Verified users can initiate a conversation between distinct participants
CREATE POLICY "Verified users can create conversations"
  ON public.conversations
  FOR INSERT
  WITH CHECK (
    (auth.uid() = participant_one OR auth.uid() = participant_two)
    AND participant_one <> participant_two
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND verification_status = 'verified'
    )
  );

-- Update: Participants can update conversation metadata
CREATE POLICY "Participants can update conversations"
  ON public.conversations
  FOR UPDATE
  USING (
    auth.uid() = participant_one
    OR auth.uid() = participant_two
  )
  WITH CHECK (
    auth.uid() = participant_one
    OR auth.uid() = participant_two
  );

-- Delete: Participants can delete conversations
CREATE POLICY "Participants can delete conversations"
  ON public.conversations
  FOR DELETE
  USING (
    auth.uid() = participant_one
    OR auth.uid() = participant_two
  );

-- -----------------------------------------------------------------------------
-- RLS: MESSAGES
-- -----------------------------------------------------------------------------

-- Read: Only participants in the conversation can read messages
CREATE POLICY "Participants can view messages"
  ON public.messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

-- Insert: Verified sender can insert messages in their conversation
CREATE POLICY "Verified participants can send messages"
  ON public.messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND verification_status = 'verified'
    )
  );

-- Update: Participants can mark messages as read
CREATE POLICY "Participants can mark messages read"
  ON public.messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

-- Delete: Senders can delete their own messages
CREATE POLICY "Senders can delete messages"
  ON public.messages
  FOR DELETE
  USING (auth.uid() = sender_id);

-- -----------------------------------------------------------------------------
-- RLS: NOTIFICATIONS
-- -----------------------------------------------------------------------------

-- Read: Only recipient can view their notifications
CREATE POLICY "Recipient can view notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = recipient_id);

-- Insert: Authenticated users can generate notifications for other members
CREATE POLICY "Users can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Update: Recipient can mark notifications as read
CREATE POLICY "Recipient can update notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Delete: Recipient can dismiss notifications
CREATE POLICY "Recipient can delete notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = recipient_id);
