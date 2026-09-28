-- ============================================================
-- Campus Events — Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS event_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE event_db;

-- ------------------------------------------------------------
-- Roles
-- ------------------------------------------------------------
CREATE TABLE roles (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(20) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role_id       INT           NOT NULL DEFAULT 1,
  avatar_url    VARCHAR(500)  DEFAULT NULL,
  created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Categories
-- ------------------------------------------------------------
CREATE TABLE categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  icon VARCHAR(50) DEFAULT NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Events
-- ------------------------------------------------------------
CREATE TABLE events (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200)  NOT NULL,
  description  TEXT          NOT NULL,
  category_id  INT           NOT NULL,
  organizer_id INT           NOT NULL,
  venue        VARCHAR(200)  NOT NULL,
  event_date   DATE          NOT NULL,
  start_time   TIME          NOT NULL,
  end_time     TIME          DEFAULT NULL,
  banner_url   VARCHAR(500)  DEFAULT NULL,
  capacity     INT           NOT NULL DEFAULT 100,
  is_outdoor   TINYINT(1)    DEFAULT 0,
  latitude     DECIMAL(10,7) DEFAULT NULL,
  longitude    DECIMAL(10,7) DEFAULT NULL,
  status       ENUM('draft','published','cancelled') DEFAULT 'published',
  created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id)  REFERENCES categories(id),
  FOREIGN KEY (organizer_id) REFERENCES users(id),
  INDEX idx_events_date     (event_date),
  INDEX idx_events_status   (status),
  INDEX idx_events_category (category_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Registrations  (unique per user + event)
-- ------------------------------------------------------------
CREATE TABLE registrations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT  NOT NULL,
  event_id      INT  NOT NULL,
  status        ENUM('registered','cancelled') DEFAULT 'registered',
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  UNIQUE INDEX idx_reg_user_event (user_id, event_id),
  INDEX idx_reg_event (event_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- Attendance
-- ------------------------------------------------------------
CREATE TABLE attendance (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  registration_id INT NOT NULL,
  marked_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  marked_by       INT NOT NULL,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by)       REFERENCES users(id),
  UNIQUE INDEX idx_att_registration (registration_id)
) ENGINE=InnoDB;
