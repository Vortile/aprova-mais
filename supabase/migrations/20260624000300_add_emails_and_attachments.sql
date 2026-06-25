-- Create emails table
CREATE TABLE public.emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id text UNIQUE,
  direction text NOT NULL CHECK (direction IN ('received', 'sent')),
  from_email text NOT NULL,
  to_emails text[] NOT NULL,
  cc_emails text[],
  bcc_emails text[],
  subject text,
  body_html text,
  body_text text,
  status text NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create email_attachments table
CREATE TABLE public.email_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id uuid NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  resend_attachment_id text,
  filename text NOT NULL,
  content_type text,
  size integer,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

-- Define RLS policies
CREATE POLICY "Admins manage emails"
  ON public.emails FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins manage email_attachments"
  ON public.email_attachments FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create indexes for performance
CREATE INDEX emails_resend_id_idx ON public.emails(resend_id);
CREATE INDEX emails_direction_idx ON public.emails(direction);
CREATE INDEX email_attachments_email_id_idx ON public.email_attachments(email_id);
