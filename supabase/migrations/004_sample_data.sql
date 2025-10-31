-- Insert sample insurance categories
INSERT INTO public.insurance_categories (id, name, description, icon) VALUES
('AUTO', 'Auto Insurance', 'Vehicle insurance for cars, motorcycles, and other vehicles', 'car'),
('HOME', 'Home Insurance', 'Homeowners and renters insurance', 'home'),
('HEALTH', 'Health Insurance', 'Medical and health coverage', 'heart'),
('LIFE', 'Life Insurance', 'Life coverage and financial protection', 'user'),
('TRAVEL', 'Travel Insurance', 'Travel-related coverage', 'plane');

-- Insert sample insurers (Ivorian insurance companies)
INSERT INTO public.insurers (id, name, description, logo_url, rating, contact_email, phone) VALUES
('NSIA', 'NSIA Assurance', 'Compagnie d''assurance leader en Côte d''Ivoire', '/logos/nsia.png', 4.6, 'contact@nsia.ci', '+22527203000'),
('SOGECI', 'SOGECI Assurance', 'Société ivoirienne de gestion et d''assurance', '/logos/sogeci.png', 4.4, 'info@sogeci.ci', '+22520244000'),
('SATAM', 'SATAM Assurances', 'Société africaine d''assurances et de réassurance', '/logos/satam.png', 4.2, 'contact@satam.ci', '+22520224000'),
('ALLIANZ-CI', 'Allianz Côte d''Ivoire', 'Filiale ivoirienne du groupe Allianz', '/logos/allianz-ci.png', 4.5, 'contact@allianz.ci', '+22520202000'),
('AXA-CI', 'AXA Côte d''Ivoire', 'Présence AXA en Côte d''Ivoire', '/logos/axa-ci.png', 4.3, 'contact@axa.ci', '+22527208000');

-- Insert sample insurance offers (Ivorian market context)
INSERT INTO public.insurance_offers (id, insurer_id, category_id, name, description, price_min, price_max, coverage_amount, deductible, contract_type, features) VALUES
('NSIA_AUTO_BASE', 'NSIA', 'AUTO', 'Auto Base CI', 'Assurance automobile de base pour le marché ivoirien', 50000, 150000, 5000000, 25000, 'basic', '{"Responsabilité civile", "Vol et incendie", "Bris de glaces"}'),
('SOGECI_AUTO_ALLRISKS', 'SOGECI', 'AUTO', 'Auto Tous Risques CI', 'Assurance automobile tous risques premium', 150000, 400000, 15000000, 10000, 'all_risks', '{"Tous risques", "Dépannage 24/7", "Véhicule de remplacement", "Assistance voyage"}'),
('SATAM_HOME_STANDARD', 'SATAM', 'HOME', 'Habitation Standard CI', 'Assurance habitation pour résidences en CI', 30000, 80000, 10000000, 50000, 'comprehensive', '{"Incendie", "Vol", "Dégâts des eaux", "Responsabilité civile familiale"}'),
('ALLIANZ-CI_HEALTH_PREMIUM', 'ALLIANZ-CI', 'HEALTH', 'Santé Premium CI', 'Complémentaire santé adaptée au marché ivoirien', 200000, 600000, 20000000, 5000, 'comprehensive', '{"Hospitalisation", "Consultations", "Soins dentaires", "Optique", "Médicaments"}'),
('AXA-CI_TRAVEL_ECOWAS', 'AXA-CI', 'TRAVEL', 'Voyage CEDEAO', 'Assurance voyage pour la zone CEDEAO', 25000, 75000, 5000000, 10000, 'comprehensive', '{"Frais médicaux", "Rapatriement", "Annulation", "Perte bagages"}'),
('NSIA_LIFE_EPSARGNE', 'NSIA', 'LIFE', 'Vie Épargne CI', 'Assurance vie avec épargne pour l''avenir', 100000, 500000, 50000000, 0, 'savings', '{"Capital décès", "Rente viagère", "Epargne retraite", "Frais éducation"}');

-- REMOVED: Sample tarification rules have been replaced by coverage-based system
-- The new coverage-based tarification system is implemented in migrations 006-010
-- INSERT INTO public.tarification_rules (id, category_id, age_min, age_max, risk_factor, coefficient, description) VALUES
-- ('AUTO_YOUNG_CI', 'AUTO', 18, 25, 'jeune_conducteur', 1.9, 'Majoration jeune conducteur en CI'),
-- ('AUTO_ADULT_CI', 'AUTO', 26, 60, 'standard', 1.0, 'Tarif adulte standard en CI'),
-- ('AUTO_SENIOR_CI', 'AUTO', 61, 80, 'senior', 1.15, 'Ajustement senior en CI'),
-- ('AUTO_ABIDJAN', 'AUTO', 0, NULL, 'zone_abidjan', 1.25, 'Surcharge zone urbaine Abidjan'),
-- ('AUTO_INTERIEUR', 'AUTO', 0, NULL, 'zone_interieur', 0.9, 'Réduction zone intérieur CI'),
-- ('HOME_ABIDJAN', 'HOME', 0, NULL, 'zone_abidjan', 1.3, 'Surcharge habitation Abidjan'),
-- ('HOME_STANDARD_CI', 'HOME', 0, NULL, 'standard', 1.0, 'Tarif habitation standard CI'),
-- ('HEALTH_FAMILY', 'HEALTH', 0, NULL, 'famille_nombreuse', 0.85, 'Réduction famille nombreuse'),
-- ('HEALTH_SENIOR', 'HEALTH', 60, NULL, 'senior', 1.3, 'Majoration santé senior'),
-- ('TRAVEL_CEDEAO', 'TRAVEL', 0, NULL, 'zone_cedeao', 1.0, 'Tarif voyage zone CEDEAO'),
-- ('LIFE_EPARGNE', 'LIFE', 25, 45, 'epargnant_actif', 0.9, 'Réduction épargnant actif');

-- Create a sample user (Ivorian context)
INSERT INTO public.profiles (id, email, first_name, last_name, phone, role) VALUES
('11111111-1111-1111-1111-111111111111', 'koffi.yao@example.com', 'Koffi', 'YAO', '+22507070707', 'USER');