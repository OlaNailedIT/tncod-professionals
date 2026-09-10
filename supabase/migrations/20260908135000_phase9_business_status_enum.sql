-- Phase 9 prerequisite — commit BusinessStatus enum extension before policies/functions use it.
-- Required because PostgreSQL forbids using a newly added enum label in the same transaction (55P04).
-- Semantic source of the value remains Phase 9 business verification; this file only separates ADD VALUE.

ALTER TYPE "BusinessStatus" ADD VALUE IF NOT EXISTS 'NEEDS_CLARIFICATION';
