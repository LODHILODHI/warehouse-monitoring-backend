-- Migration script to update users table role ENUM
-- Run this SQL script if you encounter "Data truncated for column 'role'" error

-- Update the role ENUM to include permanent_secretary
ALTER TABLE users 
MODIFY COLUMN role ENUM('super_admin', 'inspector', 'permanent_secretary') 
NOT NULL DEFAULT 'inspector';

-- Verify the change
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'role';
