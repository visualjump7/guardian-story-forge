-- Fix security warnings: Set search_path on functions

-- Update get_user_image_usage function with explicit search_path
CREATE OR REPLACE FUNCTION get_user_image_usage(p_user_id UUID)
RETURNS TABLE (
  images_generated INTEGER,
  images_limit INTEGER,
  warning_threshold INTEGER,
  remaining INTEGER,
  should_warn BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  v_usage RECORD;
BEGIN
  INSERT INTO user_image_usage (user_id, month_year)
  VALUES (p_user_id, v_month)
  ON CONFLICT (user_id, month_year) DO NOTHING;
  
  SELECT * INTO v_usage FROM user_image_usage WHERE user_id = p_user_id AND month_year = v_month;
  
  RETURN QUERY SELECT
    v_usage.images_generated,
    v_usage.images_limit,
    v_usage.warning_threshold,
    (v_usage.images_limit - v_usage.images_generated) AS remaining,
    (v_usage.images_generated >= v_usage.warning_threshold AND v_usage.warned_at IS NULL) AS should_warn;
END;
$$;

-- Update increment_user_image_usage function with explicit search_path
CREATE OR REPLACE FUNCTION increment_user_image_usage(p_user_id UUID, p_count INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month TEXT := TO_CHAR(NOW(), 'YYYY-MM');
  v_current INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT images_generated, images_limit INTO v_current, v_limit
  FROM user_image_usage WHERE user_id = p_user_id AND month_year = v_month;
  
  IF v_current + p_count > v_limit THEN RETURN FALSE; END IF;
  
  UPDATE user_image_usage
  SET images_generated = images_generated + p_count, updated_at = NOW()
  WHERE user_id = p_user_id AND month_year = v_month;
  
  RETURN TRUE;
END;
$$;