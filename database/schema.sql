-- ============================================================
--  ORGAN DONATION SYSTEM — Database Schema
--  Compatible with MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS organ_donation;
USE organ_donation;

-- ── Recipients ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recipients (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    age             INT NOT NULL,
    gender          ENUM('M','F','Other') NOT NULL,
    blood_group     VARCHAR(5) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(100) NOT NULL UNIQUE,
    state           VARCHAR(60) NOT NULL,
    organ_needed    ENUM('Heart','Liver','Lungs','Pancreas') NOT NULL,
    emergency_name  VARCHAR(100),
    relationship    VARCHAR(50),
    emergency_phone VARCHAR(15),
    -- Heart specific
    prev_cardiac    ENUM('Yes','No'),
    ejection_frac   DECIMAL(5,2),
    -- Liver specific
    meld_score      INT,
    hla_typing      VARCHAR(30),
    -- Lungs specific
    total_lung_cap  DECIMAL(5,2),
    dlco            DECIMAL(7,2),
    fev1            DECIMAL(5,2),
    -- Pancreas specific
    pancreas_length DECIMAL(5,2),
    pancreas_width  DECIMAL(5,2),
    pancreas_thick  DECIMAL(5,2),
    insulin_levels  DECIMAL(7,2),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Heart Donors ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS heart_donors (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    age             INT NOT NULL,
    gender          ENUM('M','F','Other') NOT NULL,
    blood_group     VARCHAR(5) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(100) NOT NULL,
    state           VARCHAR(60) NOT NULL,
    organ           VARCHAR(20) DEFAULT 'Heart',
    available       ENUM('Yes','No') DEFAULT 'Yes',
    prev_cardiac    ENUM('Yes','No') NOT NULL,
    ejection_frac   DECIMAL(5,2) NOT NULL,
    emergency_name  VARCHAR(100),
    relationship    VARCHAR(50),
    emergency_phone VARCHAR(15),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Liver Donors ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS liver_donors (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    age             INT NOT NULL,
    gender          ENUM('M','F','Other') NOT NULL,
    blood_group     VARCHAR(5) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(100) NOT NULL,
    state           VARCHAR(60) NOT NULL,
    organ           VARCHAR(20) DEFAULT 'Liver',
    available       ENUM('Yes','No') DEFAULT 'Yes',
    meld_score      INT NOT NULL,
    hla_typing      VARCHAR(30) NOT NULL,
    emergency_name  VARCHAR(100),
    relationship    VARCHAR(50),
    emergency_phone VARCHAR(15),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Lung Donors ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lung_donors (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    age             INT NOT NULL,
    gender          ENUM('M','F','Other') NOT NULL,
    blood_group     VARCHAR(5) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(100) NOT NULL,
    state           VARCHAR(60) NOT NULL,
    organ           VARCHAR(20) DEFAULT 'Lungs',
    available       ENUM('Yes','No') DEFAULT 'Yes',
    total_lung_cap  DECIMAL(5,2) NOT NULL,
    dlco            DECIMAL(7,2) NOT NULL,
    fev1            DECIMAL(5,2) NOT NULL,
    emergency_name  VARCHAR(100),
    relationship    VARCHAR(50),
    emergency_phone VARCHAR(15),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Pancreas Donors ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pancreas_donors (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    age             INT NOT NULL,
    gender          ENUM('M','F','Other') NOT NULL,
    blood_group     VARCHAR(5) NOT NULL,
    phone           VARCHAR(15) NOT NULL,
    email           VARCHAR(100) NOT NULL,
    state           VARCHAR(60) NOT NULL,
    organ           VARCHAR(20) DEFAULT 'Pancreas',
    available       ENUM('Yes','No') DEFAULT 'Yes',
    pancreas_length DECIMAL(5,2) NOT NULL,
    pancreas_width  DECIMAL(5,2) NOT NULL,
    pancreas_thick  DECIMAL(5,2) NOT NULL,
    insulin_levels  DECIMAL(7,2) NOT NULL,
    emergency_name  VARCHAR(100),
    relationship    VARCHAR(50),
    emergency_phone VARCHAR(15),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
--  SEED DATA — synthetic donors
-- ============================================================
INSERT INTO heart_donors (name,age,gender,blood_group,phone,email,state,available,prev_cardiac,ejection_frac,emergency_name,relationship,emergency_phone) VALUES
('Rahul Mehta',28,'M','O+','+91 9876543210','rahul@example.com','Maharashtra','Yes','No',60,'Priya Mehta','Spouse','+91 9876543211'),
('Sneha Sharma',34,'F','A+','+91 9123456789','sneha@example.com','Delhi','Yes','No',55,'Arjun Sharma','Brother','+91 9123456790'),
('Vikram Nair',45,'M','B+','+91 9988776655','vikram@example.com','Kerala','Yes','Yes',48,'Meena Nair','Mother','+91 9988776656'),
('Anita Patel',30,'F','AB+','+91 9765432100','anita@example.com','Gujarat','Yes','No',62,'Suresh Patel','Father','+91 9765432101'),
('Karan Singh',22,'M','O-','+91 9654321098','karan@example.com','Punjab','Yes','No',58,'Simran Singh','Sister','+91 9654321099');

INSERT INTO liver_donors (name,age,gender,blood_group,phone,email,state,available,meld_score,hla_typing,emergency_name,relationship,emergency_phone) VALUES
('Priya Reddy',29,'F','A+','+91 9871234567','priya@example.com','Telangana','Yes',12,'A2-B7-DR15','Ravi Reddy','Husband','+91 9871234568'),
('Amit Kumar',38,'M','O+','+91 9812345678','amit@example.com','Bihar','Yes',8,'A1-B8-DR3','Sunita Kumar','Wife','+91 9812345679'),
('Lakshmi Rao',41,'F','B-','+91 9856789012','lakshmi@example.com','Karnataka','Yes',15,'A24-B44-DR7','Venkat Rao','Son','+91 9856789013');

INSERT INTO lung_donors (name,age,gender,blood_group,phone,email,state,available,total_lung_cap,dlco,fev1,emergency_name,relationship,emergency_phone) VALUES
('Dev Chopra',27,'M','A-','+91 9832109876','dev@example.com','Himachal Pradesh','Yes',6.2,25.5,3.8,'Rita Chopra','Mother','+91 9832109877'),
('Nisha Gupta',33,'F','O+','+91 9867890123','nisha@example.com','Uttar Pradesh','Yes',5.8,22.1,3.2,'Mohan Gupta','Father','+91 9867890124'),
('Arun Pillai',36,'M','B+','+91 9845678901','arun@example.com','Tamil Nadu','Yes',6.5,26.8,4.0,'Geetha Pillai','Sister','+91 9845678902');

-- Seed data for donors
INSERT INTO heart_donors (name, age, gender, blood_group, phone, email, state, available, ejection_frac, emergency_name, relationship, emergency_phone) VALUES
('Rahul Sharma', 45, 'M', 'A+', '+91 9876543210', 'rahul@example.com', 'Maharashtra', 'Yes', 60, 'Priya Sharma', 'Wife', '+91 9876543211'),
('Anita Desai', 32, 'F', 'O-', '+91 9123456789', 'anita@example.com', 'Karnataka', 'Yes', 55, 'Rajesh Desai', 'Husband', '+91 9123456790'),
('Karan Singh', 28, 'M', 'B+', '+91 9988776655', 'karan@example.com', 'Delhi', 'Yes', 58, 'Mandeep Singh', 'Brother', '+91 9988776656');

INSERT INTO liver_donors (name, age, gender, blood_group, phone, email, state, available, meld_score, hla_typing, emergency_name, relationship, emergency_phone) VALUES
('Sunita Gupta', 50, 'F', 'AB+', '+91 9822334455', 'sunita@example.com', 'Gujarat', 'Yes', 12, 'A1-B8-DR3', 'Aman Gupta', 'Son', '+91 9822334456'),
('Vikram Mehta', 38, 'M', 'A-', '+91 9766554433', 'vikram@example.com', 'Rajasthan', 'Yes', 15, 'A2-B7-DR15', 'Sonal Mehta', 'Wife', '+91 9766554434');

INSERT INTO lung_donors (name, age, gender, blood_group, phone, email, state, available, total_lung_cap, dlco, fev1, emergency_name, relationship, emergency_phone) VALUES
('Sanjay Rao', 55, 'M', 'O+', '+91 9544332211', 'sanjay@example.com', 'Tamil Nadu', 'Yes', 6.2, 28.5, 3.8, 'Laxmi Rao', 'Wife', '+91 9544332212');

INSERT INTO pancreas_donors (name, age, gender, blood_group, phone, email, state, available, pancreas_length, pancreas_width, pancreas_thick, insulin_levels, emergency_name, relationship, emergency_phone) VALUES
('Nisha Iyer', 29, 'F', 'B-', '+91 9433221100', 'nisha@example.com', 'Kerala', 'Yes', 15.5, 3.6, 2.2, 14.0, 'Ravi Iyer', 'Father', '+91 9433221101');

-- Seed data for recipients
INSERT INTO recipients (name, age, gender, blood_group, phone, email, state, organ_needed, ejection_frac, meld_score, hla_typing) VALUES
('Amit Patel', 40, 'M', 'A+', '+91 9000111222', 'amit@example.com', 'Gujarat', 'Heart', 35, NULL, NULL),
('Deepa Reddy', 35, 'F', 'O-', '+91 9111222333', 'deepa@example.com', 'Andhra Pradesh', 'Liver', NULL, 22, 'A2-B7-DR15'),
('John Doe', 25, 'M', 'B+', '+91 9222333444', 'john@example.com', 'Maharashtra', 'Lungs', NULL, NULL, NULL);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('donor', 'recipient', 'hospital') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed hospital user (password: hospital123)
-- Hash for 'hospital123': $2a$10$fS0I7z1y7P3o7u8Y9H9m.eu9Xk7m7z7y7P3o7u8Y9H9m.eu9Xk7m
INSERT INTO users (name, email, password_hash, role) VALUES 
('City Hospital Admin', 'admin@hospital.com', '$2a$10$fS0I7z1y7P3o7u8Y9H9m.eu9Xk7m7z7y7P3o7u8Y9H9m.eu9Xk7m', 'hospital');
