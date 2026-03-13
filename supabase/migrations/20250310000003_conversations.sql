-- Conversations: authority-initiated chats with survivors
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  survivor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  authority_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_survivor ON public.conversations(survivor_id);
CREATE INDEX IF NOT EXISTS idx_conversations_authority ON public.conversations(authority_id);

-- Messages in a conversation
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('survivor', 'authority')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv ON public.conversation_messages(conversation_id);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

-- Survivors: can see their own conversations
CREATE POLICY "Survivors view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = survivor_id);

-- Survivors: can update (for last_read etc, if we add later)
CREATE POLICY "Survivors update own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = survivor_id);

-- Authorities: can see conversations they're in
CREATE POLICY "Authorities view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = authority_id);

-- Only authorities can create new conversations
CREATE POLICY "Authorities create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    auth.uid() = authority_id
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'authority'
    )
  );

-- Messages: participants can read
CREATE POLICY "Participants read messages"
  ON public.conversation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.survivor_id = auth.uid() OR c.authority_id = auth.uid())
    )
  );

-- Participants can insert messages
CREATE POLICY "Participants send messages"
  ON public.conversation_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.survivor_id = auth.uid() OR c.authority_id = auth.uid())
    )
  );
