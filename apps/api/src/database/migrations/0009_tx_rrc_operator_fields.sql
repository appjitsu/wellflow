-- Add TX RRC operator/agent/contact fields to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS tx_rrc_operator_number varchar(20),
  ADD COLUMN IF NOT EXISTS tx_rrc_agent_id varchar(50),
  ADD COLUMN IF NOT EXISTS regulatory_contact_name varchar(255),
  ADD COLUMN IF NOT EXISTS regulatory_contact_email varchar(255),
  ADD COLUMN IF NOT EXISTS regulatory_contact_phone varchar(20);

