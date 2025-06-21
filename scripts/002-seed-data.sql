-- 插入示例用户
INSERT INTO users (id, email, name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'demo@example.com', 'Demo User')
ON CONFLICT (email) DO NOTHING;

-- 插入示例目标
INSERT INTO goals (user_id, title, type, target, current_value, unit, deadline, description, status) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', '本月跑步100公里', 'distance', 100.00, 25.50, 'km', '2024-12-31', '每月跑步100公里的目标', 'active'),
    ('550e8400-e29b-41d4-a716-446655440000', '每周跑步3次', 'frequency', 12.00, 8.00, 'runs', '2024-12-31', '本月跑步12次', 'active'),
    ('550e8400-e29b-41d4-a716-446655440000', '跑步总时长300分钟', 'time', 300.00, 180.00, 'minutes', '2024-12-31', '本月跑步总时长目标', 'active')
ON CONFLICT DO NOTHING;

-- 插入示例活动
INSERT INTO activities (user_id, date, distance, duration, pace, location, notes) VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', '2024-01-15', 5.2, 32, 6.15, '中央公园', '今天天气不错，跑步感觉很好'),
    ('550e8400-e29b-41d4-a716-446655440000', '2024-01-13', 8.0, 48, 6.00, '滨江公园', '长距离跑步，配速保持得不错'),
    ('550e8400-e29b-41d4-a716-446655440000', '2024-01-10', 3.5, 22, 6.29, '小区周边', '轻松跑，恢复训练')
ON CONFLICT DO NOTHING;
