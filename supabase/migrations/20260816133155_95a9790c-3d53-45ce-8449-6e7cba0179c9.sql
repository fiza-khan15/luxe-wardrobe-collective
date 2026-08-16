CREATE TABLE public.waitlist_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  instagram TEXT,
  linkedin TEXT,
  intent TEXT NOT NULL DEFAULT 'renter',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT waitlist_email_valid CHECK (char_length(email) BETWEEN 3 AND 255 AND position('@' in email) > 1),
  CONSTRAINT waitlist_intent_valid CHECK (intent IN ('renter','giver','both'))
);

GRANT INSERT ON public.waitlist_signups TO anon;
GRANT INSERT ON public.waitlist_signups TO authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist" ON public.waitlist_signups FOR INSERT TO anon, authenticated WITH CHECK (true);