-- Update referral sources for existing users based on O2O conversions

-- Update users who have O2O conversions
UPDATE users 
SET referral_source = (
  SELECT referral_source 
  FROM o2o_conversions 
  WHERE o2o_conversions.user_id = users.id 
  LIMIT 1
)
WHERE id IN (SELECT DISTINCT user_id FROM o2o_conversions WHERE user_id IS NOT NULL);

-- Update remaining users based on oauth provider
UPDATE users SET referral_source = 'kakao' WHERE oauth_provider = 'kakao' AND referral_source IS NULL;
UPDATE users SET referral_source = 'naver' WHERE oauth_provider = 'naver' AND referral_source IS NULL;
UPDATE users SET referral_source = 'google' WHERE oauth_provider = 'google' AND referral_source IS NULL;
UPDATE users SET referral_source = 'direct' WHERE oauth_provider = 'email' AND referral_source IS NULL;
