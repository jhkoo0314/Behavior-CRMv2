-- 개발자 계정 권한 설정
-- jhyun06270314@gmail.com 계정을 head_manager로 설정하여 모든 권한 부여

UPDATE users
SET role = 'head_manager'
WHERE email = 'jhyun06270314@gmail.com';

-- 확인용 쿼리 (실행 후 결과 확인)
-- SELECT id, email, name, role, team_id FROM users WHERE email = 'jhyun06270314@gmail.com';

