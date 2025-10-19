-- Indexes pour optimiser les performances
-- Création des index clés pour améliorer les requêtes

-- Index sur la table profiles
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX idx_profiles_created_at ON public.profiles(created_at);

-- Index sur la table insurance_categories
CREATE INDEX idx_insurance_categories_is_active ON public.insurance_categories(is_active);
CREATE INDEX idx_insurance_categories_name ON public.insurance_categories(name);

-- Index sur la table insurers
CREATE INDEX idx_insurers_profile_id ON public.insurers(profile_id);
CREATE INDEX idx_insurers_is_active ON public.insurers(is_active);
CREATE INDEX idx_insurers_company_name ON public.insurers(company_name);

-- Index sur la table insurance_offers
CREATE INDEX idx_insurance_offers_insurer_id ON public.insurance_offers(insurer_id);
CREATE INDEX idx_insurance_offers_category_id ON public.insurance_offers(category_id);
CREATE INDEX idx_insurance_offers_is_active ON public.insurance_offers(is_active);
CREATE INDEX idx_insurance_offers_premium_amount ON public.insurance_offers(premium_amount);

-- Index sur la table quotes
CREATE INDEX idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX idx_quotes_category_id ON public.quotes(category_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_quotes_created_at ON public.quotes(created_at);

-- Index sur la table quote_offers
CREATE INDEX idx_quote_offers_quote_id ON public.quote_offers(quote_id);
CREATE INDEX idx_quote_offers_offer_id ON public.quote_offers(offer_id);
CREATE INDEX idx_quote_offers_status ON public.quote_offers(status);
CREATE INDEX idx_quote_offers_price ON public.quote_offers(price);
CREATE INDEX idx_quote_offers_valid_until ON public.quote_offers(valid_until);

-- Index sur la table policies
CREATE INDEX idx_policies_user_id ON public.policies(user_id);
CREATE INDEX idx_policies_insurer_id ON public.policies(insurer_id);
CREATE INDEX idx_policies_quote_offer_id ON public.policies(quote_offer_id);
CREATE INDEX idx_policies_policy_number ON public.policies(policy_number);
CREATE INDEX idx_policies_status ON public.policies(status);
CREATE INDEX idx_policies_start_date ON public.policies(start_date);
CREATE INDEX idx_policies_end_date ON public.policies(end_date);

-- Index sur la table payments
CREATE INDEX idx_payments_policy_id ON public.payments(policy_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_payment_method ON public.payments(payment_method);

DO $$
BEGIN
  RAISE NOTICE '=== INDEX CRÉÉS AVEC SUCCÈS ===';
  RAISE NOTICE '✅ Index sur toutes les tables principales créés';
  RAISE NOTICE '✅ Performances optimisées pour les requêtes fréquentes';
END $$;