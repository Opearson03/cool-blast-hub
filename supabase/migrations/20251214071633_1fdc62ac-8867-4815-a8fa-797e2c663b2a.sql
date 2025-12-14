-- Drop existing select policy and create one that allows checking invites by email
DROP POLICY IF EXISTS "Users can check their own pending invites" ON public.pending_invites;

-- Allow anyone to check if they have a pending invite (needed for signup flow)
CREATE POLICY "Anyone can check pending invites by email" 
ON public.pending_invites 
FOR SELECT 
USING (accepted_at IS NULL);