-- 데이터베이스 초기화
DROP DATABASE `compliance`;	
CREATE DATABASE	`compliance`;
USE compliance;



-- 전문가회원 테이블 
CREATE TABLE expert (
    id INT NOT NULL AUTO_INCREMENT COMMENT '전문가 ID',
    name VARCHAR(255) NOT NULL COMMENT '전문가 이름',
    institution_name VARCHAR(255) NOT NULL COMMENT '소속 기관명',
    ofcps VARCHAR(255) NOT NULL COMMENT '전문가 직책',
    phone_number VARCHAR(255) NOT NULL COMMENT '전화번호',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT '이메일',
    major_carrea VARCHAR(255) NOT NULL COMMENT '전문 경력',
    PRIMARY KEY (id)
);

select * from expert;
-- 2024-01-14 
-- 전문가 회원 데이터 추가
INSERT INTO expert (name, institution_name, ofcps, phone_number, email, major_carrea)
VALUES ('전문가 홍길동', '정보보호연구소', '책임 연구원', '010-5678-1234', 'expert@securitylab.com', '개인정보보호 및 정보보안 분야 10년 경력');

-- 전문가 ID 가져오기
SET @expert_id = (SELECT id FROM expert WHERE email = 'expert@securitylab.com');

-- 2024-01-16
ALTER TABLE expert
ADD COLUMN password VARCHAR(255) NOT NULL COMMENT '비밀번호';


-- 슈퍼유저 테이블 
CREATE TABLE SuperUser (
    id INT NOT NULL AUTO_INCREMENT COMMENT '슈퍼유저 ID',
    name VARCHAR(255) NOT NULL COMMENT '이름',
    email VARCHAR(255) NOT NULL COMMENT '이메일',
    password VARCHAR(255) NOT NULL COMMENT '비밀번호',
    phone_number VARCHAR(255) NOT NULL COMMENT '전화번호',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '가입 날짜',
    PRIMARY KEY (id)
);

-- 2024-01-12 추가
-- 슈퍼유저 초기 데이터 삽입
INSERT INTO SuperUser (name, email, password, phone_number, created_at)
VALUES ('Admin User', 'admin@example.com', 'securepassword', '010-1234-5678', NOW());

-- 슈퍼유저 삽입 제한 트리거
CREATE TRIGGER restrict_superuser_insert
BEFORE INSERT ON SuperUser
FOR EACH ROW
BEGIN
    DECLARE superuser_count INT;
    SET superuser_count = (SELECT COUNT(*) FROM SuperUser);

    IF superuser_count >= 1 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = '슈퍼유저는 1명만 존재할 수 있습니다.';
    END IF;
END;

-- 슈퍼유저 작업 로그 테이블
CREATE TABLE SuperUserLog (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '로그 ID',
    superuser_id INT NOT NULL COMMENT '슈퍼유저 ID',
    action_type ENUM('추가', '수정', '삭제', '조회') NOT NULL COMMENT '작업 유형',
    target_table ENUM('User', 'Expert', 'System', 'Assignment', 'AssessmentResult') NOT NULL COMMENT '대상 테이블',
    target_id INT NOT NULL COMMENT '대상 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작업 시간',
    FOREIGN KEY (superuser_id) REFERENCES SuperUser(id) ON DELETE CASCADE
);

-- 기관 회원 테이블
CREATE TABLE User (
    `id` INT AUTO_INCREMENT PRIMARY KEY, -- 회원 ID
    `institution_name` VARCHAR(255) NOT NULL COMMENT '기관명',
    `institution_address` VARCHAR(255) NOT NULL COMMENT '기관 주소',
    `representative_name` VARCHAR(255) NOT NULL COMMENT '대표자 이름',
    `email` VARCHAR(255) NOT NULL UNIQUE COMMENT '이메일',
    `password` VARCHAR(255) NOT NULL COMMENT '비밀번호',
    `phone_number` VARCHAR(15) NOT NULL COMMENT '전화번호', -- 전화번호 속성 추가
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '가입 날짜',
    `member_type` ENUM('기관회원', '전문가', '슈퍼유저') NOT NULL COMMENT '회원 유형'
);
-- 2024-01-07 수정 
ALTER TABLE User
ADD `feedback_id` INT DEFAULT NULL COMMENT '피드백 ID';
-- 2024-01-11 수정 
ALTER TABLE User
DROP COLUMN feedback_id,
DROP COLUMN member_type;

-- 2024-01-12 
-- 사용자 A 데이터 추가
INSERT INTO User (institution_name, institution_address, representative_name, email, password, phone_number, created_at)
VALUES ('기관 A', '서울시 강남구 테헤란로 123', '홍길동', 'userA@organization.com', 'password123', '010-1234-5678', NOW());

-- 사용자 A의 ID 가져오기
SET @user_id = (SELECT id FROM User WHERE email = 'userA@organization.com');


-- 시스템 테이블
CREATE TABLE systems (
    `id` INT AUTO_INCREMENT PRIMARY KEY, -- 시스템 ID
    `user_id` INT NOT NULL COMMENT '회원 ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '등록 날짜',
    `name` VARCHAR(255) NOT NULL COMMENT '시스템 이름',
    `min_subjects` INT NOT NULL COMMENT '최소 문항 수',
    `max_subjects` INT NOT NULL COMMENT '최대 문항 수',
    `purpose` VARCHAR(255) NOT NULL COMMENT '처리 목적',
    `is_private` BOOLEAN NOT NULL COMMENT '민감 정보 포함 여부',
    `is_unique` BOOLEAN NOT NULL COMMENT '고유 식별 정보 포함 여부',
    `is_resident` BOOLEAN NOT NULL COMMENT '주민등록번호 포함 여부',
    `reason` ENUM('동의', '법적 근거', '기타') NOT NULL COMMENT '수집 근거',
    `assessment_status` ENUM('시작전', '완료') NOT NULL COMMENT '평가 상태',    
    FOREIGN KEY (`user_id`) REFERENCES User(`id`) ON DELETE CASCADE
);
-- 2024-01-07 수정 
ALTER TABLE systems
ADD `assignment_id` INT DEFAULT NULL COMMENT '담당 ID';

-- 2024-01-11 수정 
ALTER TABLE systems
MODIFY COLUMN user_id INT NOT NULL COMMENT '기관 회원 ID';

ALTER TABLE systems
DROP COLUMN assignment_id;

-- 2024-01-12 
-- 시스템 A 데이터 추가
INSERT INTO systems (user_id, created_at, name, min_subjects, max_subjects, purpose, is_private, is_unique, is_resident, reason, assessment_status)
VALUES (@user_id, NOW(), '시스템 A', 5, 10, '개인정보 관리', TRUE, FALSE, TRUE, '동의', '시작전');

-- 시스템 A의 ID 가져오기
SET @system_id = (SELECT id FROM systems WHERE name = '시스템 A');


-- 전문가회원 - 시스템 (N:M) 담당 테이블
CREATE TABLE assignment (
    `id` INT NOT NULL AUTO_INCREMENT COMMENT '담당 ID',
    `user_id` INT NOT NULL COMMENT '전문가 ID', -- 전문가 회원만 연결
    `systems_id` INT NOT NULL COMMENT '시스템 ID',
    `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '할당 날짜',
    `feedback_status` BOOLEAN NOT NULL COMMENT '피드백 완료 여부',
    PRIMARY KEY (`id`),
    FOREIGN KEY (`user_id`) REFERENCES User(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`systems_id`) REFERENCES systems(`id`) ON DELETE CASCADE
);


-- 2024-01-11 수정
ALTER TABLE assignment
CHANGE COLUMN user_id expert_id INT NOT NULL COMMENT '전문가 ID';

-- 기존 외래 키 제거
ALTER TABLE assignment
DROP FOREIGN KEY assignment_ibfk_1;

-- 새로운 외래 키 추가
ALTER TABLE assignment
ADD CONSTRAINT fk_expert_id FOREIGN KEY (expert_id) REFERENCES expert(id) ON DELETE CASCADE;

-- 2024-01-14
-- 시스템 A에 전문가 배치
INSERT INTO assignment (expert_id, systems_id, assigned_at, feedback_status)
VALUES (@expert_id, @system_id, NOW(), FALSE);

-- 배치된 정보 확인
SELECT * FROM assignment;

-- 자가진단 입력 테이블
CREATE TABLE self_assessment (
    `id` INT AUTO_INCREMENT PRIMARY KEY, -- 입력 ID
    `user_scale` VARCHAR(255) NOT NULL COMMENT '사용자 규모',
    `personal_info_system` ENUM('있음', '없음') NOT NULL COMMENT '개인정보처리 시스템 여부',
    `member_info_homepage` ENUM('있음', '없음') NOT NULL COMMENT '회원정보 홈페이지 여부',
    `external_data_provision` ENUM('있음', '없음') NOT NULL COMMENT '외부정보 제공 여부',
    `cctv_operation` ENUM('운영', '미운영') NOT NULL COMMENT 'CCTV 운영 여부',
    `task_outsourcing` ENUM('있음', '없음') NOT NULL COMMENT '업무 위탁 여부',
    `personal_info_disposal` ENUM('있음', '없음') NOT NULL COMMENT '개인정보 폐기 여부',
    `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '제출 시간'
);

-- 2024-01-12
-- 자가진단 입력 데이터 추가
INSERT INTO self_assessment (user_scale, personal_info_system, member_info_homepage, external_data_provision, cctv_operation, task_outsourcing, personal_info_disposal, submitted_at)
VALUES ('중소기업', '있음', '있음', '있음', '운영', '있음', '있음', NOW());

-- 자가진단 입력의 ID 가져오기
SET @self_assessment_id = (SELECT id FROM self_assessment ORDER BY id DESC LIMIT 1);



-- 정량 문항 테이블
CREATE TABLE quantitative (
    `id` INT AUTO_INCREMENT PRIMARY KEY, -- 문항 ID
    `question_number` INT NOT NULL COMMENT '문항 번호',
    `question` VARCHAR(255) NOT NULL COMMENT '문항',
    `unit_type` ENUM('기관', '시스템') NOT NULL COMMENT '대상 유형',
    `legal_basis` VARCHAR(255) NOT NULL COMMENT '법적 근거',
    `evaluation_criteria` VARCHAR(255) NOT NULL COMMENT '평가 기준',
    `response` ENUM('이수', '미이수', '자문필요', '해당없음') NOT NULL COMMENT '응답 상태',
    `additional_comment` TEXT COMMENT '추가 의견',
    `field` VARCHAR(255) NOT NULL COMMENT '분야',
    `score` INT NOT NULL COMMENT '점수'
);

-- 2024-01-12 
-- 정량적 진단 데이터 추가 (43개 문항)
INSERT INTO quantitative (question_number, question, unit_type, legal_basis, evaluation_criteria, response, additional_comment, field, score)
VALUES 
(1, '개인정보 암호화 여부', '시스템', '개인정보보호법', '암호화 적용 여부', '이수', '적합', '보안', 10),
(2, '접근 통제 설정 여부', '시스템', '정보보호법', '권한별 접근 제어', '이수', '문제없음', '보안', 9),
(3, '비밀번호 정책 준수', '기관', '정보보호법', '비밀번호 복잡성 및 변경 주기', '미이수', '강화 필요', '인증', 0),
(4, '데이터 삭제 절차', '시스템', '개인정보보호법', '불필요한 데이터의 정기 삭제', '이수', '정상', '데이터 관리', 8),
(5, '데이터 백업 여부', '기관', '정보보호법', '정기적인 데이터 백업', '자문필요', '추가 검토 필요', '백업', 7),
-- 생략된 문항: 나머지 38개 문항도 비슷한 방식으로 추가
(43, '데이터 접근 기록 감사', '시스템', '정보보호법', '접근 기록 감사 수행', '이수', '적합', '보안', 9);


-- 정성 문항 테이블
CREATE TABLE qualitative (
    `id` INT AUTO_INCREMENT PRIMARY KEY, -- 문항 ID
    `question_number` INT NOT NULL COMMENT '문항 번호',
    `response` ENUM('자문필요', '해당없음') NOT NULL COMMENT '응답 상태',
    `additional_comment` TEXT COMMENT '추가 의견'
);

-- 2024-01-12
-- 정성적 진단 데이터 추가 (8개 문항)
INSERT INTO qualitative (question_number, response, additional_comment)
VALUES 
(1, '자문필요', '보안 정책 재검토 필요'),
(2, '해당없음', '현재 시스템에서는 해당 없음'),
(3, '자문필요', '외부 위탁 관련 정책 부족'),
(4, '자문필요', '추가 정책 수립 필요'),
(5, '해당없음', '관련 법률 없음'),
(6, '자문필요', '보안 테스트 강화 필요'),
(7, '해당없음', '특별히 문제 없음'),
(8, '자문필요', '외부 보안 인증 필요');


-- 피드백 테이블
CREATE TABLE feedback (
    `id` INT AUTO_INCREMENT NOT NULL, -- 피드백 ID
    `self_assessment_id` INT NOT NULL COMMENT '자가진단 입력 ID',
    `expert_id` INT NOT NULL COMMENT '전문가 ID',
    `feedback_content` TEXT NOT NULL COMMENT '피드백 내용',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    PRIMARY KEY (`id`),
    FOREIGN KEY (`self_assessment_id`) REFERENCES self_assessment(`id`) ON DELETE CASCADE
);

-- 2024-01-11 수정
DROP TABLE feedback;

-- 피드백 테이블
CREATE TABLE feedback (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '피드백 ID',
    assessment_result_id INT NOT NULL COMMENT '자가진단 결과 ID',
    assignment_id INT NOT NULL COMMENT '담당 시스템 ID',
    feedback_content TEXT NOT NULL COMMENT '피드백 내용',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '피드백 생성 날짜',
    FOREIGN KEY (assessment_result_id) REFERENCES assessment_result(id) ON DELETE CASCADE, -- 자가진단 결과 연결
    FOREIGN KEY (assignment_id) REFERENCES assignment(id) ON DELETE CASCADE -- 담당 시스템 연결
);


-- 자가진단 결과 테이블
CREATE TABLE assessment_result (
    `id` INT AUTO_INCREMENT PRIMARY KEY, -- 결과 ID
    `system_id` INT NOT NULL COMMENT '시스템 ID',
    `score` INT NOT NULL COMMENT '점수',
    `feedback_status` ENUM('전문가 자문이 반영되기전입니다', '전문가 자문이 반영되었습니다') NOT NULL COMMENT '피드백 상태',
    `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '완료 시간',
    `grade` ENUM('S', 'A', 'B', 'C', 'D') NOT NULL COMMENT '등급',
    FOREIGN KEY (`system_id`) REFERENCES systems(`id`) ON DELETE CASCADE
);

-- 2024-01-11 수정
DROP TABLE IF EXISTS assessment_result;

CREATE TABLE assessment_result (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '자가진단 결과 ID',
    system_id INT NOT NULL COMMENT '시스템 ID',
    quantitative_id INT UNIQUE COMMENT '정량 데이터 ID', -- 정량 문항 연결
    qualitative_id INT UNIQUE COMMENT '정성 데이터 ID', -- 정성 문항 연결
    self_assessment_id INT UNIQUE COMMENT '자가진단 입력 ID', -- 자가진단 입력 연결
    score INT NOT NULL COMMENT '점수',
    feedback_status ENUM('전문가 자문이 반영되기전입니다', '전문가 자문이 반영되었습니다') NOT NULL COMMENT '피드백 상태',
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '완료 시간',
    grade ENUM('S', 'A', 'B', 'C', 'D') NOT NULL COMMENT '등급',
    FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE CASCADE, -- 시스템 연결
    FOREIGN KEY (quantitative_id) REFERENCES quantitative(id) ON DELETE CASCADE, -- 정량 문항 연결
    FOREIGN KEY (qualitative_id) REFERENCES qualitative(id) ON DELETE CASCADE, -- 정성 문항 연결
    FOREIGN KEY (self_assessment_id) REFERENCES self_assessment(id) ON DELETE CASCADE -- 자가진단 입력 연결
);



-- 정량 문항 총점 계산
SET @max_quantitative_score = (SELECT SUM(score) FROM quantitative WHERE question_number BETWEEN 1 AND 43);

-- 정량 문항 점수 합산
SET @quantitative_score = (SELECT SUM(score) FROM quantitative);

-- 정량 점수를 100점 만점으로 환산
SET @scaled_quantitative_score = (@quantitative_score / @max_quantitative_score) * 100;

-- 정성 문항 총점 (가정: 최대 점수는 20점)
SET @max_qualitative_score = 20;

-- 정성 점수 (이미 고정된 기준으로 계산)
SET @qualitative_score = 20;

-- 정성 점수를 100점 만점으로 환산
SET @scaled_qualitative_score = (@qualitative_score / @max_qualitative_score) * 100;

-- 총점 계산 (정량과 정성 점수를 합산 후 평균)
SET @total_score = (@scaled_quantitative_score + @scaled_qualitative_score) / 2;

-- 점수에 따른 등급 산출
SET @grade = CASE 
    WHEN @total_score >= 90 THEN 'S'
    WHEN @total_score >= 80 THEN 'A'
    WHEN @total_score >= 70 THEN 'B'
    ELSE 'C'
END;
SELECT * FROM ASSESSMENT_RESULT;


-- 자가진단 결과 데이터 추가
INSERT INTO assessment_result (system_id, self_assessment_id, score, feedback_status, completed_at, grade)
VALUES 
(@system_id, @self_assessment_id, @total_score, '전문가 자문이 반영되기전입니다', NOW(), @grade);

-- 자가진단 결과 ID 확인
SET @assessment_result_id = (SELECT id FROM assessment_result ORDER BY id DESC LIMIT 1);

-- 가장 최근에 삽입된 정량 문항 ID 가져오기
SET @quantitative_id = (SELECT id FROM quantitative ORDER BY id DESC LIMIT 1);

-- 가장 최근에 삽입된 정성 문항 ID 가져오기
SET @qualitative_id = (SELECT id FROM qualitative ORDER BY id DESC LIMIT 1);

-- `assessment_result` 테이블에 정량/정성 문항 ID 업데이트
UPDATE assessment_result
SET quantitative_id = @quantitative_id, qualitative_id = @qualitative_id
WHERE id = @assessment_result_id;




