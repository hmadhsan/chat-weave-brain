-- Create groups table
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai BOOLEAN NOT NULL DEFAULT false,
  thread_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS on all tables
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Groups policies: members can view their groups
CREATE POLICY "Users can view groups they are members of"
ON public.groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  )
);

-- Users can create groups
CREATE POLICY "Authenticated users can create groups"
ON public.groups FOR INSERT
WITH CHECK (auth.uid() = owner_id);

-- Owners can update their groups
CREATE POLICY "Owners can update their groups"
ON public.groups FOR UPDATE
USING (auth.uid() = owner_id);

-- Owners can delete their groups
CREATE POLICY "Owners can delete their groups"
ON public.groups FOR DELETE
USING (auth.uid() = owner_id);

-- Group members policies
CREATE POLICY "Users can view group members for their groups"
ON public.group_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can add new members"
ON public.group_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()
  )
  OR auth.uid() = user_id
);

CREATE POLICY "Owners can remove members"
ON public.group_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id 
    AND g.owner_id = auth.uid()
  )
  OR user_id = auth.uid()
);

-- Messages policies
CREATE POLICY "Group members can view messages"
ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = messages.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group members can send messages"
ON public.messages FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = messages.group_id 
    AND gm.user_id = auth.uid()
  )
);

-- Invitations policies
CREATE POLICY "Users can view invitations they created or for groups they own"
ON public.invitations FOR SELECT
USING (
  invited_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = invitations.group_id 
    AND g.owner_id = auth.uid()
  )
);

CREATE POLICY "Group members can create invitations"
ON public.invitations FOR INSERT
WITH CHECK (
  auth.uid() = invited_by
  AND EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = invitations.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Invitation creators can update their invitations"
ON public.invitations FOR UPDATE
USING (invited_by = auth.uid());

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;

-- Create indexes for better performance
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_messages_group_id ON public.messages(group_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_invitations_token ON public.invitations(token);
CREATE INDEX idx_invitations_email ON public.invitations(email);

-- Trigger for updated_at on groups
CREATE TRIGGER update_groups_updated_at
BEFORE UPDATE ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();