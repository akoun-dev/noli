-- Migration: Admin supervision tables and functions

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id)
);

-- Create system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  type text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  CONSTRAINT system_alerts_pkey PRIMARY KEY (id)
);

-- Create RPC function for getting platform stats
CREATE OR REPLACE FUNCTION public.admin_get_platform_stats()
RETURNS TABLE (
  users jsonb,
  insurers jsonb,
  offers jsonb,
  quotes jsonb
) AS $$
DECLARE
  user_stats jsonb;
  insurer_stats jsonb;
  offer_stats jsonb;
  quote_stats jsonb;
BEGIN
  -- Get user statistics
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'new', COUNT(*) FILTER (WHERE created_at >= now() - interval '30 days'),
    'active', COUNT(*) FILTER (WHERE status = 'active')
  ) INTO user_stats
  FROM public.profiles;

  -- Get insurer statistics
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'pending', COUNT(*) FILTER (WHERE status = 'pending'),
    'active', COUNT(*) FILTER (WHERE status = 'active')
  ) INTO insurer_stats
  FROM public.insurers;

  -- Get offer statistics
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'active', COUNT(*) FILTER (WHERE status = 'active')
  ) INTO offer_stats
  FROM public.insurance_offers;

  -- Get quote statistics
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'converted', COUNT(*) FILTER (WHERE status = 'converted'),
    'conversion_rate', CASE 
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'converted')::numeric / COUNT(*)::numeric) * 100, 2)
      ELSE 0
    END
  ) INTO quote_stats
  FROM public.quotes;

  RETURN QUERY
  SELECT user_stats, insurer_stats, offer_stats, quote_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for getting database size
CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS text AS $$
DECLARE
  db_size text;
BEGIN
  SELECT pg_size_pretty(pg_database_size(current_database())) INTO db_size;
  RETURN db_size;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for getting active connections
CREATE OR REPLACE FUNCTION public.get_active_connections()
RETURNS integer AS $$
BEGIN
  RETURN COUNT(*) FROM pg_stat_activity WHERE state = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- Create indexes for system_alerts
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON public.system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON public.system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON public.system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON public.system_alerts(created_at);

-- Create triggers for updated_at columns
CREATE TRIGGER update_activity_logs_updated_at 
BEFORE UPDATE ON public.activity_logs 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_alerts_updated_at 
BEFORE UPDATE ON public.system_alerts 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for activity_logs
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can insert activity logs" ON public.activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- RLS policies for system_alerts
CREATE POLICY "Admins can view all system alerts" ON public.system_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can manage system alerts" ON public.system_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );