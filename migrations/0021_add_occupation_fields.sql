-- Migration: Add occupation/industry fields for user segmentation
-- Date: 2025-11-19
-- Purpose: Add detailed occupation classification for B2C users

-- Add occupation field for work_stress users (직무 스트레스)
ALTER TABLE users ADD COLUMN occupation TEXT;

-- Add life_situation field for daily_stress users (일상 스트레스)
ALTER TABLE users ADD COLUMN life_situation TEXT;

-- Occupation values for work_stress (b2c_category = 'work_stress'):
-- 'management_executive' - 관리자/임원
-- 'office_it' - 사무직(사무·IT) - 고강도 인지부하
-- 'service_retail' - 서비스업(리테일·호스피탈리티) - 고객대면 스트레스
-- 'medical_care' - 의료·간병 - 정서적 소모, 교대·야간근무
-- 'education' - 교육(교사·강사) - 정서적 소모
-- 'manufacturing_logistics' - 제조·현장(제조·물류) - 교대·야간근무
-- 'freelancer_self_employed' - 프리랜서/자영업 - 불안정 소득/불확실성
-- 'finance' - 금융·회계 - 고강도 인지부하
-- 'other' - 기타

-- Life situation values for daily_stress (b2c_category = 'daily_stress'):
-- 'student' - 학생 - 학업 스트레스
-- 'parent' - 양육자 - 육아 스트레스
-- 'homemaker' - 전업주부 - 가사 스트레스
-- 'job_seeker' - 취업준비생 - 불안정성, 미래 불확실성
-- 'retiree' - 은퇴자/노년층 - 건강, 관계 스트레스
-- 'caregiver' - 간병인/케어기버 - 정서적 소모
-- 'other' - 기타
