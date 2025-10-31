-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- Insurance categories indexes
CREATE INDEX idx_insurance_categories_name ON public.insurance_categories(name);

-- Insurers indexes
CREATE INDEX idx_insurers_is_active ON public.insurers(is_active);
CREATE INDEX idx_insurers_rating ON public.insurers(rating);
CREATE INDEX idx_insurers_created_at ON public.insurers(created_at);

-- Insurance offers indexes
CREATE INDEX idx_insurance_offers_insurer_id ON public.insurance_offers(insurer_id);
CREATE INDEX idx_insurance_offers_category_id ON public.insurance_offers(category_id);
CREATE INDEX idx_insurance_offers_is_active ON public.insurance_offers(is_active);
CREATE INDEX idx_insurance_offers_contract_type ON public.insurance_offers(contract_type);
CREATE INDEX idx_insurance_offers_price_range ON public.insurance_offers(price_min, price_max);
CREATE INDEX idx_insurance_offers_created_at ON public.insurance_offers(created_at);

-- Quotes indexes
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_category_id ON public.quotes(category_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_valid_until ON public.quotes(valid_until);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at);

-- Policies indexes
CREATE INDEX idx_policies_user_id ON public.policies(user_id);
CREATE INDEX idx_policies_insurer_id ON public.policies(insurer_id);
CREATE INDEX idx_policies_offer_id ON public.policies(offer_id);
CREATE INDEX idx_policies_quote_id ON public.policies(quote_id);
CREATE INDEX idx_policies_status ON public.policies(status);
CREATE INDEX idx_policies_policy_number ON public.policies(policy_number);
CREATE INDEX idx_policies_dates ON public.policies(start_date, end_date);
CREATE INDEX idx_policies_created_at ON public.policies(created_at);

-- Payments indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_policy_id ON public.payments(policy_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

-- Tarification rules indexes (DEPRECATED - replaced by coverage-based system)
-- These indexes are no longer needed as tarification_rules has been replaced
-- by the new coverage_tariff_rules table with its own indexes

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON public.audit_logs(resource, resource_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Password reset tokens indexes
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_refresh_token ON public.user_sessions(refresh_token);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- JSONB indexes for better query performance
CREATE INDEX idx_quotes_personal_data_gin ON public.quotes USING gin(personal_data);
CREATE INDEX idx_quotes_vehicle_data_gin ON public.quotes USING gin(vehicle_data);
CREATE INDEX idx_quotes_property_data_gin ON public.quotes USING gin(property_data);
CREATE INDEX idx_policies_coverage_details_gin ON public.policies USING gin(coverage_details);
CREATE INDEX idx_audit_logs_metadata_gin ON public.audit_logs USING gin(metadata);