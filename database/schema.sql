-- ============================================================
-- CertiSecure2 — MySQL Database Schema
-- Database Name: certisecure
-- ============================================================

CREATE DATABASE IF NOT EXISTS `certisecure`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `certisecure`;

-- Disable foreign key checks for clean creation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `verification_logs`;
DROP TABLE IF EXISTS `revocations`;
DROP TABLE IF EXISTS `certificates`;
DROP TABLE IF EXISTS `institution_keys`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `institutions`;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- 1. Institutions (Issuers Registry)
-- ------------------------------------------------------------
CREATE TABLE `institutions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `domain` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `logo_path` VARCHAR(500) NULL,
  `status` ENUM('pending', 'verified', 'suspended') NOT NULL DEFAULT 'pending',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `ix_institutions_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 2. Users (RBAC: admin, issuer, verifier)
-- ------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'issuer', 'verifier') NOT NULL DEFAULT 'verifier',
  `institution_id` INT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE SET NULL,
  INDEX `ix_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 3. Institution Cryptographic Keys (Ed25519)
-- ------------------------------------------------------------
CREATE TABLE `institution_keys` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `institution_id` INT NOT NULL,
  `key_id` VARCHAR(50) NOT NULL UNIQUE,
  `public_key_pem` TEXT NOT NULL,
  `encrypted_private_key` TEXT NOT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deactivated_at` DATETIME NULL,
  CONSTRAINT `fk_keys_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`) ON DELETE CASCADE,
  INDEX `ix_institution_keys_key_id` (`key_id`),
  INDEX `ix_institution_keys_active` (`institution_id`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 4. Certificates
-- ------------------------------------------------------------
CREATE TABLE `certificates` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `certificate_uid` VARCHAR(50) NOT NULL UNIQUE,
  `institution_id` INT NOT NULL,
  `key_id` INT NOT NULL,
  `holder_name` VARCHAR(255) NOT NULL,
  `holder_email` VARCHAR(255) NULL,
  `roll_number` VARCHAR(100) NULL,
  `course` VARCHAR(500) NOT NULL,
  `certificate_type` VARCHAR(100) NOT NULL DEFAULT 'Completion',
  `description` TEXT NULL,
  `issue_date` DATETIME NOT NULL,
  `expiry_date` DATETIME NULL,
  `grade` VARCHAR(50) NULL,
  `canonical_data` TEXT NOT NULL,
  `data_hash` VARCHAR(64) NOT NULL,
  `signature` TEXT NOT NULL,
  `status` ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
  `pdf_path` VARCHAR(500) NULL,
  `pdf_hash` VARCHAR(64) NULL,
  `qr_path` VARCHAR(500) NULL,
  `issued_by` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_certs_institution` FOREIGN KEY (`institution_id`) REFERENCES `institutions` (`id`),
  CONSTRAINT `fk_certs_key` FOREIGN KEY (`key_id`) REFERENCES `institution_keys` (`id`),
  CONSTRAINT `fk_certs_issuer` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`),
  INDEX `ix_certificates_uid` (`certificate_uid`),
  INDEX `ix_certificates_institution` (`institution_id`),
  INDEX `ix_certificates_holder` (`holder_email`),
  INDEX `ix_certificates_roll` (`roll_number`),
  INDEX `ix_certificates_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 5. Revocations
-- ------------------------------------------------------------
CREATE TABLE `revocations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `certificate_id` INT NOT NULL UNIQUE,
  `reason` ENUM('incorrect_information', 'fraud', 'duplicate_issuance', 'administrative_error', 'other') NOT NULL,
  `reason_detail` TEXT NULL,
  `revoked_by` INT NOT NULL,
  `revoked_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_revocations_cert` FOREIGN KEY (`certificate_id`) REFERENCES `certificates` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_revocations_user` FOREIGN KEY (`revoked_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 6. Verification Logs
-- ------------------------------------------------------------
CREATE TABLE `verification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `certificate_id` INT NULL,
  `certificate_uid` VARCHAR(50) NOT NULL,
  `result` VARCHAR(50) NOT NULL,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_vlogs_cert` FOREIGN KEY (`certificate_id`) REFERENCES `certificates` (`id`) ON DELETE SET NULL,
  INDEX `ix_verification_logs_uid` (`certificate_uid`),
  INDEX `ix_verification_logs_date` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- 7. Audit Logs
-- ------------------------------------------------------------
CREATE TABLE `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actor_id` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `resource_type` VARCHAR(50) NULL,
  `resource_id` VARCHAR(100) NULL,
  `ip_address` VARCHAR(45) NULL,
  `metadata_json` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  INDEX `ix_audit_logs_action` (`action`),
  INDEX `ix_audit_logs_date` (`created_at`),
  INDEX `ix_audit_logs_actor` (`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
