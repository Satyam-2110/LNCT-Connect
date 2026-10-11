-- ==============================================================================
-- Migration: 0007_security_and_rls_hardening.sql
-- Project: LNCT Connect 2.0 (Milestone 4 — Phase 16)
-- Description: Database Security & RLS Hardening (Priority 1)
--   1. Conversation participant immutability trigger & policy
--   2. Message content and sender tampering prevention trigger & policy
--   3. Notification creation actor verification policy
--   4. Profile privilege escalation prevention & WITH CHECK enforcement
--   5. Connection request authorization & bilateral deduplication index
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- 1. CONVERSATION PARTICIPANT IMMUTABILITY
-- -----------------------------------------------------------------------------
-- Prevent alteration of conversation participants post-creation
CREATE OR REPLACE FUNCTION public.prevent_conversation_participant_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.participant_one <> OLD.participant_one OR NEW.participant_two <> OLD.participant_two THEN
    RAISE EXCEPTION 'Conversation participants cannot be altered post-creation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_conversation_participant_mutation ON public.conversations;
CREATE TRIGGER trg_prevent_conversation_participant_mutation
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_conversation_participant_mutation();

-- Recreate UPDATE policy on conversations ensuring participants cannot be forged
DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
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


-- -----------------------------------------------------------------------------
-- 2. MESSAGE SENDER & CONTENT SPOOFING PREVENTION
-- -----------------------------------------------------------------------------
-- Prevent modification of message content, sender, or conversation post-creation
CREATE OR REPLACE FUNCTION public.prevent_message_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.content <> OLD.content THEN
    RAISE EXCEPTION 'Message content cannot be modified post-creation';
  END IF;
  IF NEW.sender_id <> OLD.sender_id THEN
    RAISE EXCEPTION 'Message sender cannot be modified post-creation';
  END IF;
  IF NEW.conversation_id <> OLD.conversation_id THEN
    RAISE EXCEPTION 'Message conversation cannot be modified post-creation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_message_tampering ON public.messages;
CREATE TRIGGER trg_prevent_message_tampering
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_message_tampering();

-- Restrict messages UPDATE policy: only allow marking is_read = true
DROP POLICY IF EXISTS "Participants can mark messages read" ON public.messages;
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
    AND is_read = true
  );


-- -----------------------------------------------------------------------------
-- 3. NOTIFICATION ACTOR LOCKDOWN
-- -----------------------------------------------------------------------------
-- Ensure members can only create notifications where actor_id equals auth.uid()
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND actor_id = auth.uid()
  );


-- -----------------------------------------------------------------------------
-- 4. PROFILE UPDATE PRIVILEGE ESCALATION PREVENTION
-- -----------------------------------------------------------------------------
-- Explicit WITH CHECK constraint to prevent profile identifier hijacking
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- 5. CONNECTION AUTHORIZATION & RECIPROCAL DEDUPLICATION
-- -----------------------------------------------------------------------------
-- Strictly restrict connection status updates to the receiver of the request
DROP POLICY IF EXISTS "Participants can update connection status" ON public.connections;
DROP POLICY IF EXISTS "Only receiver can update connection status" ON public.connections;
CREATE POLICY "Only receiver can update connection status"
  ON public.connections
  FOR UPDATE
  USING (
    auth.uid() = receiver_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = receiver_id
  );

-- Database trigger to prevent requesters from self-accepting connection requests
CREATE OR REPLACE FUNCTION public.prevent_connection_self_acceptance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'pending' AND (NEW.status = 'accepted' OR NEW.status = 'rejected') THEN
    IF auth.uid() = OLD.requester_id THEN
      RAISE EXCEPTION 'Requesters cannot accept or reject their own connection request';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_connection_self_acceptance ON public.connections;
CREATE TRIGGER trg_prevent_connection_self_acceptance
  BEFORE UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_connection_self_acceptance();

-- Bilateral unique index to prohibit duplicate connections regardless of request direction
CREATE UNIQUE INDEX IF NOT EXISTS idx_connections_bilateral_unique
  ON public.connections (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));
