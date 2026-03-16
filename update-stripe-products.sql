-- ViciVidi AI Stripe Product IDs 更新脚本
-- 生成时间：2026-03-16

-- 删除旧的套餐定义（如果有）
DELETE FROM plan_definitions;

-- 插入订阅套餐

-- ViciVidi Starter
INSERT INTO plan_definitions (
  id,
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  monthly_credits,
  price_cents,
  currency,
  billing_interval,
  is_active,
  features,
  created_at,
  updated_at
) VALUES (
  'plan_starter',
  'ViciVidi Starter',
  '适合外贸新手与个人 SOHO',
  'prod_U9kbOGBTllzhlG',
  'price_1TBR6QDwu2b3jvrtO0CyLgat',
  50,
  3900,
  'usd',
  'month',
  true,
  '{"monthlyCredits":50,"baseSearch":true,"emailVerification":true,"maxUsers":1,"support":"email"}'::jsonb,
  NOW(),
  NOW()
);

-- ViciVidi Growth
INSERT INTO plan_definitions (
  id,
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  monthly_credits,
  price_cents,
  currency,
  billing_interval,
  is_active,
  features,
  created_at,
  updated_at
) VALUES (
  'plan_growth',
  'ViciVidi Growth',
  '适合成长型外贸团队（热门）',
  'prod_U9kbvrDwXwuPsQ',
  'price_1TBR6QDwu2b3jvrtYZeIICkh',
  100,
  7900,
  'usd',
  'month',
  true,
  '{"monthlyCredits":100,"baseSearch":true,"emailVerification":true,"maxUsers":5,"support":"priority"}'::jsonb,
  NOW(),
  NOW()
);

-- ViciVidi Pro
INSERT INTO plan_definitions (
  id,
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  monthly_credits,
  price_cents,
  currency,
  billing_interval,
  is_active,
  features,
  created_at,
  updated_at
) VALUES (
  'plan_pro',
  'ViciVidi Pro',
  '适合成熟外贸企业',
  'prod_U9kbPMSQ7fj5BP',
  'price_1TBR6RDwu2b3jvrtF667u8Y2',
  300,
  13900,
  'usd',
  'month',
  true,
  '{"monthlyCredits":300,"baseSearch":true,"emailVerification":true,"maxUsers":-1,"support":"dedicated"}'::jsonb,
  NOW(),
  NOW()
);

-- 插入预充值套餐

-- 500 Credits
INSERT INTO plan_definitions (
  id,
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  monthly_credits,
  price_cents,
  currency,
  billing_interval,
  is_active,
  features,
  created_at,
  updated_at
) VALUES (
  'pack_500_credits',
  '500 Credits',
  '入门体验',
  'prod_U9kb8OhD3FNPuO',
  'price_1TBR6SDwu2b3jvrtmVxkBKqC',
  500,
  4900,
  'usd',
  'one_time',
  true,
  '{"type":"credit_pack","unitPrice":0.098,"validity":12}'::jsonb,
  NOW(),
  NOW()
);

-- 1200 Credits
INSERT INTO plan_definitions (
  id,
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  monthly_credits,
  price_cents,
  currency,
  billing_interval,
  is_active,
  features,
  created_at,
  updated_at
) VALUES (
  'pack_1200_credits',
  '1200 Credits',
  '最受欢迎（送 100 credits）',
  'prod_U9kbCjDv2zTzyA',
  'price_1TBR6TDwu2b3jvrtTbKr4Paw',
  1200,
  9900,
  'usd',
  'one_time',
  true,
  '{"type":"credit_pack","unitPrice":0.082,"validity":12,"bonus":100}'::jsonb,
  NOW(),
  NOW()
);

-- 3000 Credits
INSERT INTO plan_definitions (
  id,
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  monthly_credits,
  price_cents,
  currency,
  billing_interval,
  is_active,
  features,
  created_at,
  updated_at
) VALUES (
  'pack_3000_credits',
  '3000 Credits',
  '超值特惠（送 300 credits）',
  'prod_U9kbu7vPqFZyrh',
  'price_1TBR6TDwu2b3jvrtV85om4dt',
  3000,
  19900,
  'usd',
  'one_time',
  true,
  '{"type":"credit_pack","unitPrice":0.066,"validity":12,"bonus":300}'::jsonb,
  NOW(),
  NOW()
);

-- 10000 Credits
INSERT INTO plan_definitions (
  id,
  name,
  description,
  stripe_product_id,
  stripe_price_id,
  monthly_credits,
  price_cents,
  currency,
  billing_interval,
  is_active,
  features,
  created_at,
  updated_at
) VALUES (
  'pack_10000_credits',
  '10000 Credits',
  '企业专享（送 2000 credits）',
  'prod_U9kbGOq8rIkbhk',
  'price_1TBR6UDwu2b3jvrtL9uWGDh6',
  10000,
  49900,
  'usd',
  'one_time',
  true,
  '{"type":"credit_pack","unitPrice":0.05,"validity":24,"bonus":2000}'::jsonb,
  NOW(),
  NOW()
);

-- 验证插入结果
SELECT
  id,
  name,
  monthly_credits,
  price_cents,
  stripe_product_id,
  stripe_price_id
FROM plan_definitions
ORDER BY
  CASE
    WHEN billing_interval = 'month' THEN 0
    ELSE 1
  END,
  price_cents;