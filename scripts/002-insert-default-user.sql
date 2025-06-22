-- 插入默认用户数据
INSERT INTO users (id, email, name) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'demo@runtracker.app', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- 验证用户创建
SELECT id, email, name, created_at FROM users WHERE id = '550e8400-e29b-41d4-a716-446655440000'; 