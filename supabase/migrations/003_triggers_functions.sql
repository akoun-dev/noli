-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to generate policy number
CREATE OR REPLACE FUNCTION generate_policy_number()
RETURNS TRIGGER AS $$
DECLARE
    prefix text;
    year_text text;
    sequence_num integer;
BEGIN
    -- Get category prefix from insurance_offers
    SELECT SUBSTRING(ic.id FROM 1 FOR 3) INTO prefix
    FROM insurance_offers io
    JOIN insurance_categories ic ON io.category_id = ic.id
    WHERE io.id = NEW.offer_id;
    
    -- Get current year
    year_text := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Get next sequence number for this category and year
    SELECT COALESCE(MAX(CAST(SUBSTRING(policy_number FROM '[0-9]+$') AS INTEGER)), 0) + 1 INTO sequence_num
    FROM policies
    WHERE policy_number LIKE prefix || year_text || '%';
    
    -- Format: CAT2310001, CAT2310002, etc.
    NEW.policy_number := prefix || year_text || LPAD(sequence_num::text, 5, '0');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to validate quote expiration
CREATE OR REPLACE FUNCTION validate_quote_expiration()
RETURNS TRIGGER AS $$
BEGIN
    -- If valid_until is not set, default to 30 days from creation
    IF NEW.valid_until IS NULL THEN
        NEW.valid_until := NEW.created_at + INTERVAL '30 days';
    END IF;
    
    -- Ensure valid_until is in the future
    IF NEW.valid_until <= NEW.created_at THEN
        RAISE EXCEPTION 'valid_until must be in the future';
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update quote status when expired
CREATE OR REPLACE FUNCTION update_expired_quotes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE quotes 
    SET status = 'EXPIRED' 
    WHERE valid_until < CURRENT_TIMESTAMP 
    AND status NOT IN ('EXPIRED', 'APPROVED', 'REJECTED');
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_categories_updated_at BEFORE UPDATE ON public.insurance_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurers_updated_at BEFORE UPDATE ON public.insurers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_insurance_offers_updated_at BEFORE UPDATE ON public.insurance_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON public.quotes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_policies_updated_at BEFORE UPDATE ON public.policies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- REMOVED: tarification_rules table has been replaced by coverage-based system
-- CREATE TRIGGER update_tarification_rules_updated_at BEFORE UPDATE ON public.tarification_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Policy number generation trigger
CREATE TRIGGER generate_policy_number_trigger BEFORE INSERT ON public.policies FOR EACH ROW EXECUTE FUNCTION generate_policy_number();

-- Quote validation trigger
CREATE TRIGGER validate_quote_trigger BEFORE INSERT ON public.quotes FOR EACH ROW EXECUTE FUNCTION validate_quote_expiration();

-- REMOVED: Trigger was causing issues with user registration
-- Profile creation is now handled manually in authService.ts after successful signup
-- If you need to re-enable this later, make sure to test it thoroughly

-- Function to create profile when user is created in auth.users (DISABLED)
-- CREATE OR REPLACE FUNCTION create_user_profile()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     INSERT INTO public.profiles (
--         id,
--         email,
--         first_name,
--         last_name,
--         phone,
--         role,
--         avatar_url,
--         is_active,
--         email_verified,
--         phone_verified,
--         created_at,
--         updated_at
--     )
--     VALUES (
--         NEW.id,
--         NEW.email,
--         COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
--         COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
--         COALESCE(NEW.raw_user_meta_data->>'phone', ''),
--         COALESCE(NEW.raw_user_meta_data->>'role', 'USER'),
--         COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
--         true, -- is_active
--         NEW.email_confirmed,
--         false, -- phone_verified (default to false)
--         NEW.created_at,
--         NEW.updated_at
--     );
--     RETURN NEW;
-- END;
-- $$ language 'plpgsql';

-- Trigger to create profile automatically when user signs up (DISABLED)
-- CREATE TRIGGER create_user_profile_trigger
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION create_user_profile();

-- Scheduled job to update expired quotes (this would be called by a cron job)
CREATE TRIGGER update_expired_quotes_trigger
    AFTER INSERT OR UPDATE ON public.quotes
    FOR EACH STATEMENT
    EXECUTE FUNCTION update_expired_quotes();

-- Function to create user profile via RPC (for manual profile creation during signup)
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  user_email TEXT,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  user_role user_role DEFAULT 'USER'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insérer le profil avec les permissions élevées de la fonction
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    company_name,
    role,
    is_active,
    email_verified,
    phone_verified,
    avatar_url,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    first_name,
    last_name,
    phone,
    company_name,
    user_role,
    true,
    false,
    false,
    '',
    NOW(),
    NOW()
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating profile: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant permissions on the RPC function
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO anon;