CREATE USER IF NOT EXISTS 'appuser'@'localhost' IDENTIFIED BY 'app_pass123';
GRANT ALL PRIVILEGES ON lostfound.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;
