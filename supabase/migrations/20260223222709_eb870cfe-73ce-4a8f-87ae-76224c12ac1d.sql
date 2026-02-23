ALTER TABLE subcontractor_directory_profiles
  ADD COLUMN has_white_card boolean DEFAULT false,
  ADD COLUMN white_card_number text,
  ADD COLUMN white_card_document_url text;