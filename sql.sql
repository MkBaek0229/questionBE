USE test;
DROP  DATABASE test;
CREATE  DATABASE test;
SHOW TABLES;
ALTER DATABASE test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SELECT *FROM  user;


-- 회원 테이블
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



