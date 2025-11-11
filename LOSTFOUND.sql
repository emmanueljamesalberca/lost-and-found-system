CREATE DATABASE IF NOT EXISTS lostfound;

-- allow the API container to connect
CREATE USER IF NOT EXISTS 'appuser'@'%' IDENTIFIED BY 'app_pass123';
GRANT ALL PRIVILEGES ON lostfound.* TO 'appuser'@'%';
FLUSH PRIVILEGES;

USE lostfound;

CREATE TABLE IF NOT EXISTS items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url VARCHAR(512),
  location_found VARCHAR(255) NOT NULL,
  date_found DATE NOT NULL,
  status ENUM('lost','found','returned') DEFAULT 'lost',
  -- optional claim metadata (shown by UI if present)
  claimed_by VARCHAR(255),
  claimed_note VARCHAR(255),
  claimed_at TIMESTAMP NULL,
  claimed_by_admin VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
