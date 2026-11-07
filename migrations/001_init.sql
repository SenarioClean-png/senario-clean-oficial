CREATE TABLE IF NOT EXISTS customer_accounts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_auth_sessions_customer (customer_id),
  INDEX idx_auth_sessions_expiry (expires_at),
  CONSTRAINT fk_auth_sessions_customer FOREIGN KEY (customer_id) REFERENCES customer_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customer_quotes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  customer_id BIGINT UNSIGNED NOT NULL,
  payload JSON NOT NULL,
  status ENUM('pending', 'contracted') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_customer_quotes_customer_created (customer_id, created_at),
  CONSTRAINT fk_customer_quotes_customer FOREIGN KEY (customer_id) REFERENCES customer_accounts(id) ON DELETE CASCADE
);
