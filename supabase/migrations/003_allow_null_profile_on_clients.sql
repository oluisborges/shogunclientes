-- Allow clients to exist without a profile_id link.
-- Gestores manage clients centrally; the profile_id is only needed
-- when a client user logs in and needs to see their own data.

ALTER TABLE public.clients ALTER COLUMN profile_id DROP NOT NULL;
