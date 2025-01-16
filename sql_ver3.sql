-- 데이터베이스 초기화
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

-- 정성 문항 테이블
CREATE TABLE qualitative (
    `id` INT AUTO_INCREMENT PRIMARY KEY, -- 문항 ID
    `question_number` INT NOT NULL COMMENT '문항 번호',
    `response` ENUM('자문필요', '해당없음') NOT NULL COMMENT '응답 상태',
    `additional_comment` TEXT COMMENT '추가 의견'
);

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




