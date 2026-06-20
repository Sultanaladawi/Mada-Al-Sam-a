-- SQL Script to set up Mada Hearing database tables
-- Make sure you have created the database `mada_hearing` in phpMyAdmin first, then import this file.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for audiograms
-- ----------------------------
DROP TABLE IF EXISTS `audiograms`;
CREATE TABLE `audiograms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `test_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `loss_left` FLOAT NOT NULL,
  `loss_right` FLOAT NOT NULL,
  `data` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for browser_history
-- ----------------------------
DROP TABLE IF EXISTS `browser_history`;
CREATE TABLE `browser_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `visited_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `url` VARCHAR(500) NOT NULL,
  `title` VARCHAR(250) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for lecture_notes
-- ----------------------------
DROP TABLE IF EXISTS `lecture_notes`;
CREATE TABLE `lecture_notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `saved_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `lecture_title` VARCHAR(250) NOT NULL,
  `notes` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for audio_settings
-- ----------------------------
DROP TABLE IF EXISTS `audio_settings`;
CREATE TABLE `audio_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `freq_high` FLOAT NOT NULL,
  `noise_reduction` FLOAT NOT NULL,
  `voice_enhance` FLOAT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO `audio_settings` (`freq_high`, `noise_reduction`, `voice_enhance`) VALUES (65, 80, 70);
