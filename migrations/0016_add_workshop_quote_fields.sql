-- Add company_industry and company_contact_position fields to workshop_quotes table

ALTER TABLE workshop_quotes ADD COLUMN company_industry TEXT;
ALTER TABLE workshop_quotes ADD COLUMN company_contact_position TEXT;

-- Update existing records to have NULL values (will be filled by users on next quote)
