-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: Apr 29, 2026 at 12:00 PM
-- Server version: 8.0.44
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `meril-hims`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int NOT NULL,
  `reg_no` varchar(50) NOT NULL,
  `department` varchar(100) NOT NULL,
  `doctor` varchar(100) DEFAULT NULL,
  `priority` varchar(50) DEFAULT 'Routine',
  `appt_date` date NOT NULL,
  `appt_time` time DEFAULT NULL,
  `reason` text,
  `status` varchar(50) DEFAULT 'Scheduled',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billing`
--

CREATE TABLE `billing` (
  `id` int NOT NULL,
  `reg_no` varchar(50) NOT NULL,
  `invoice_items` json DEFAULT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billing_packages`
--

CREATE TABLE `billing_packages` (
  `id` int NOT NULL,
  `package_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `description` text,
  `items` json NOT NULL,
  `discount_percent` decimal(5,2) DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bills`
--

CREATE TABLE `bills` (
  `id` int NOT NULL,
  `bill_number` varchar(50) NOT NULL,
  `patient_id` int NOT NULL,
  `patient_name` varchar(200) DEFAULT NULL,
  `patient_phone` varchar(20) DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_amount` decimal(10,2) DEFAULT '0.00',
  `net_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `paid_amount` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('Pending','Partial','Paid','Cancelled') DEFAULT 'Pending',
  `payment_method` enum('Cash','Card','UPI','Insurance','Other') DEFAULT 'Cash',
  `bill_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `lab_barcode` varchar(50) DEFAULT NULL,
  `lab_qr_code` text,
  `notes` text,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT '1'
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bills`
--

INSERT INTO `bills` (`id`, `bill_number`, `patient_id`, `patient_name`, `patient_phone`, `total_amount`, `discount_amount`, `net_amount`, `paid_amount`, `payment_status`, `payment_method`, `bill_date`, `lab_barcode`, `lab_qr_code`, `notes`, `status`, `created_at`, `updated_at`, `branch_id`) VALUES
(1, 'BILL-MOJQBSRQ-8UZ', 3, 'Steve Jerald', '9025740156', 815.00, 0.00, 815.00, 0.00, 'Pending', 'Cash', '2026-04-29 07:24:24', 'LAB-MAIN-COMPLETEBLOODCO-55AW-54NJ', 'data:image/png;base64,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', 'Pending', 'Active', '2026-04-29 07:24:24', '2026-04-29 07:24:24', 1);

-- --------------------------------------------------------

--
-- Table structure for table `bill_items`
--

CREATE TABLE `bill_items` (
  `id` int NOT NULL,
  `bill_id` int NOT NULL,
  `service_type` enum('Appointment','Laboratory','Pharmacy','Other') NOT NULL,
  `service_id` int DEFAULT NULL,
  `service_name` varchar(200) NOT NULL,
  `service_code` varchar(50) DEFAULT NULL,
  `lab_id` int DEFAULT NULL,
  `lab_barcode` varchar(100) DEFAULT NULL,
  `sample_id` varchar(50) DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` enum('Pending','Collected','In Progress','Test Done','Completed','Active','Inactive') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bill_items`
--

INSERT INTO `bill_items` (`id`, `bill_id`, `service_type`, `service_id`, `service_name`, `service_code`, `lab_id`, `lab_barcode`, `sample_id`, `quantity`, `unit_price`, `total_price`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Other', NULL, 'Registration Fee', NULL, NULL, NULL, NULL, 1, 15.00, 15.00, 'Pending', '2026-04-29 07:24:24', '2026-04-29 07:24:24'),
(2, 1, 'Laboratory', 4, 'Complete Blood Count', NULL, 8, 'LAB-MAIN-COMPLETEBLOODCO-55AW-54NJ', 'LAB-20260429-0001', 1, 800.00, 800.00, 'Completed', '2026-04-29 07:24:24', '2026-04-29 07:38:06');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int NOT NULL,
  `district_id` int NOT NULL,
  `branch_name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT 'General Lab',
  `branch_level` varchar(50) DEFAULT 'Center',
  `parent_branch_id` int DEFAULT NULL,
  `hospital_code` varchar(50) NOT NULL,
  `address` text,
  `contact_number` varchar(50) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `district_id`, `branch_name`, `category`, `branch_level`, `parent_branch_id`, `hospital_code`, `address`, `contact_number`, `status`, `created_at`) VALUES
(1, 1, 'Ranchi Central Hub', 'General Hospital', 'Center', NULL, 'RANC-CH', 'Kanta Toli Chowk, Purulia Rd, 10b, Purulia Rd, Kantatoli, Chowk, Ranchi, Jharkhand 834001', NULL, 'Active', '2026-04-29 07:14:28'),
(3, 35, 'Chatra Lab', 'Govt Diagnostic Lab', 'Center', 1, 'CL', 'skjd\n', '1212312', 'Active', '2026-04-29 07:16:38'),
(5, 1, 'Sub center', 'Primary Health Center', 'Center', 1, 'SUB', '12', '12', 'Active', '2026-04-29 07:19:16'),
(6, 1, 'single', 'Primary Health Center', 'Center', 5, 'SINGLE', '23', '23', 'Active', '2026-04-29 07:19:43'),
(7, 44, 'sample 3', 'Community Health Center', 'Center', 1, 'ASQ', 'q', 'q', 'Active', '2026-04-29 07:20:24');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) DEFAULT NULL,
  `description` text,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `code`, `description`, `is_active`, `created_at`) VALUES
(1, 'General Medicine', 'GM', 'General medical services and primary care', 1, '2026-04-09 23:07:38'),
(2, 'Cardiology', 'CARD', 'Heart and cardiovascular system', 1, '2026-04-09 23:07:38'),
(3, 'Orthopedics', 'ORTHO', 'Bones, joints, and musculoskeletal system', 1, '2026-04-09 23:07:38'),
(4, 'Pediatrics', 'PEDS', 'Medical care for infants, children, and adolescents', 1, '2026-04-09 23:07:38'),
(5, 'Gynecology', 'GYN', 'Female reproductive health', 1, '2026-04-09 23:07:38'),
(6, 'Dermatology', 'DERM', 'Skin, hair, and nail conditions', 1, '2026-04-09 23:07:38'),
(7, 'Neurology', 'NEURO', 'Brain and nervous system', 1, '2026-04-09 23:07:38'),
(8, 'Radiology', 'RAD', 'Medical imaging and diagnostics', 1, '2026-04-09 23:07:38'),
(9, 'Laboratory', 'LAB', 'Clinical laboratory services', 1, '2026-04-09 23:07:38'),
(10, 'Dental', 'DENT', 'Oral health and dental care', 1, '2026-04-09 23:07:38'),
(11, 'Ophthalmology', 'OPTH', 'Eye care and vision', 1, '2026-04-09 23:07:38'),
(12, 'ENT', 'ENT', 'Ear, nose, and throat', 1, '2026-04-09 23:07:38'),
(13, 'Urology', 'URO', 'Urinary system and male reproductive organs', 1, '2026-04-09 23:07:38'),
(14, 'Oncology', 'ONCO', 'Cancer treatment and care', 1, '2026-04-09 23:07:38'),
(15, 'Psychiatry', 'PSYCH', 'Mental health and behavioral disorders', 1, '2026-04-09 23:07:38'),
(16, 'Emergency', 'ER', 'Emergency medical services', 1, '2026-04-09 23:07:38'),
(17, 'ICU', 'ICU', 'Intensive Care Unit', 1, '2026-04-09 23:07:38'),
(18, 'Surgery', 'SURG', 'Surgical services', 1, '2026-04-09 23:07:38'),
(19, 'Anesthesiology', 'ANES', 'Anesthesia and pain management', 1, '2026-04-09 23:07:38'),
(20, 'Physiotherapy', 'PHYSIO', 'Physical therapy and rehabilitation', 1, '2026-04-09 23:07:38'),
(21, 'sample', 'sa', NULL, 1, '2026-04-09 23:10:32');

-- --------------------------------------------------------

--
-- Table structure for table `districts`
--

CREATE TABLE `districts` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `state` varchar(100) DEFAULT 'Jharkhand',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `districts`
--

INSERT INTO `districts` (`id`, `name`, `state`, `created_at`) VALUES
(1, 'Ranchi', 'Jharkhand', '2026-04-29 06:07:58'),
(26, 'Dhanbad', 'Jharkhand', '2026-04-29 06:09:13'),
(27, 'Bokaro', 'Jharkhand', '2026-04-29 06:09:13'),
(28, 'East Singhbhum', 'Jharkhand', '2026-04-29 06:09:13'),
(29, 'West Singhbhum', 'Jharkhand', '2026-04-29 06:09:13'),
(30, 'Seraikela Kharsawan', 'Jharkhand', '2026-04-29 06:09:13'),
(31, 'Hazaribagh', 'Jharkhand', '2026-04-29 06:09:13'),
(32, 'Ramgarh', 'Jharkhand', '2026-04-29 06:09:13'),
(33, 'Giridih', 'Jharkhand', '2026-04-29 06:09:13'),
(34, 'Koderma', 'Jharkhand', '2026-04-29 06:09:13'),
(35, 'Chatra', 'Jharkhand', '2026-04-29 06:09:13'),
(36, 'Palamu', 'Jharkhand', '2026-04-29 06:09:13'),
(37, 'Latehar', 'Jharkhand', '2026-04-29 06:09:13'),
(38, 'Garhwa', 'Jharkhand', '2026-04-29 06:09:13'),
(39, 'Lohardaga', 'Jharkhand', '2026-04-29 06:09:13'),
(40, 'Gumla', 'Jharkhand', '2026-04-29 06:09:13'),
(41, 'Simdega', 'Jharkhand', '2026-04-29 06:09:13'),
(42, 'Khunti', 'Jharkhand', '2026-04-29 06:09:13'),
(43, 'Deoghar', 'Jharkhand', '2026-04-29 06:09:13'),
(44, 'Dumka', 'Jharkhand', '2026-04-29 06:09:13'),
(45, 'Godda', 'Jharkhand', '2026-04-29 06:09:13'),
(46, 'Jamtara', 'Jharkhand', '2026-04-29 06:09:13'),
(47, 'Sahebganj', 'Jharkhand', '2026-04-29 06:09:13'),
(48, 'Pakur', 'Jharkhand', '2026-04-29 06:09:13');

-- --------------------------------------------------------

--
-- Table structure for table `duty_schedules`
--

CREATE TABLE `duty_schedules` (
  `id` int NOT NULL,
  `doctor_id` int NOT NULL,
  `room_id` int NOT NULL,
  `duty_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `notes` text,
  `status` varchar(50) DEFAULT 'Scheduled',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `facility_categories`
--

CREATE TABLE `facility_categories` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `facility_categories`
--

INSERT INTO `facility_categories` (`id`, `name`, `created_at`) VALUES
(1, 'Primary Health Center', '2026-04-29 06:34:22'),
(2, 'District Hospital', '2026-04-29 06:34:22'),
(3, 'Community Health Center', '2026-04-29 06:34:22'),
(4, 'Govt Diagnostic Lab', '2026-04-29 06:34:22');

-- --------------------------------------------------------

--
-- Table structure for table `goods_receipts`
--

CREATE TABLE `goods_receipts` (
  `id` int NOT NULL,
  `grn_number` varchar(50) NOT NULL,
  `po_id` int DEFAULT NULL,
  `vendor_id` int NOT NULL,
  `receipt_date` date NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `subtotal` decimal(10,2) DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `received_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `notes` text,
  `branch_id` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `goods_receipt_items`
--

CREATE TABLE `goods_receipt_items` (
  `id` int NOT NULL,
  `grn_id` int NOT NULL,
  `po_item_id` int DEFAULT NULL,
  `item_id` int NOT NULL,
  `quantity_received` decimal(10,2) NOT NULL,
  `quantity_damaged` decimal(10,2) DEFAULT '0.00',
  `unit_cost` decimal(10,2) NOT NULL,
  `total_cost` decimal(10,2) NOT NULL,
  `batch_number` varchar(100) DEFAULT NULL,
  `lot_number` varchar(100) DEFAULT NULL,
  `manufacturing_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `hospital_settings`
--

CREATE TABLE `hospital_settings` (
  `id` int NOT NULL,
  `hospital_name` varchar(255) DEFAULT 'MERIL HIMS',
  `logo_url` longtext,
  `address` text,
  `phone` varchar(50) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `smtp_host` varchar(255) DEFAULT '',
  `smtp_port` int DEFAULT '587',
  `smtp_user` varchar(255) DEFAULT '',
  `smtp_pass` varchar(255) DEFAULT '',
  `smtp_from_name` varchar(255) DEFAULT 'HIMS Procurement'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `hospital_settings`
--

INSERT INTO `hospital_settings` (`id`, `hospital_name`, `logo_url`, `address`, `phone`, `website`, `email`, `updated_at`, `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_from_name`) VALUES
(1, 'Rela Hospital - Multispeciality Hospital', 'data:image/webp;base64,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', 'DR. RELA INSTITUTE & MEDICAL CENTER, \n7, CLC Works Rd, Nagappa Nagar, \nChromepet, Chennai, \nTamil Nadu 600044', '9025740156', 'rela.com', 'stevejerald632@gmail.com', '2026-04-20 10:17:18', '', 587, 'stevejerald632@gmail.com', 'yifk zyee tnlk lhjz', 'Rela LIS');

-- --------------------------------------------------------

--
-- Table structure for table `infrastructure`
--

CREATE TABLE `infrastructure` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('Room','Ward','Lab','Pharmacy') NOT NULL,
  `block` varchar(100) DEFAULT NULL,
  `floor` int DEFAULT NULL,
  `capacity` int DEFAULT NULL,
  `machines_count` int NOT NULL DEFAULT '1',
  `status` enum('Available','Occupied','Maintenance') DEFAULT 'Available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `infrastructure`
--

INSERT INTO `infrastructure` (`id`, `name`, `type`, `block`, `floor`, `capacity`, `machines_count`, `status`, `created_at`, `branch_id`) VALUES
(8, 'Main ', 'Lab', 'l', 0, NULL, 1, 'Available', '2026-04-19 13:29:26', 1),
(9, 'Sub Lab', 'Lab', 'B wing', 5, NULL, 1, 'Available', '2026-04-19 19:31:45', 1);

-- --------------------------------------------------------

--
-- Table structure for table `inventory_batches`
--

CREATE TABLE `inventory_batches` (
  `id` int NOT NULL,
  `item_id` int NOT NULL,
  `batch_number` varchar(100) NOT NULL,
  `lot_number` varchar(100) DEFAULT NULL,
  `manufacturing_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `vendor_id` int DEFAULT NULL,
  `quantity_received` decimal(10,2) NOT NULL DEFAULT '0.00',
  `quantity_available` decimal(10,2) NOT NULL DEFAULT '0.00',
  `quantity_reserved` decimal(10,2) NOT NULL DEFAULT '0.00',
  `quantity_damaged` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unit_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `grn_id` int DEFAULT NULL,
  `status` enum('Active','Quarantine','Expired','Empty') DEFAULT 'Active',
  `open_vial_date` date DEFAULT NULL,
  `stability_days` int DEFAULT NULL,
  `branch_id` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` int NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(200) NOT NULL,
  `category` enum('Reagents','Consumables','Test Kits','Calibrators','Controls','Glassware','General Lab Supplies') NOT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `manufacturer` varchar(200) DEFAULT NULL,
  `unit` enum('ml','liter','test','box','pack','piece','mg','g','kg') NOT NULL,
  `min_stock_level` decimal(10,2) NOT NULL DEFAULT '0.00',
  `reorder_level` decimal(10,2) NOT NULL DEFAULT '0.00',
  `storage_condition` varchar(200) DEFAULT NULL,
  `cost_price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `selling_cost` decimal(10,2) NOT NULL DEFAULT '0.00',
  `expiry_required` tinyint(1) DEFAULT '0',
  `lot_tracking` tinyint(1) DEFAULT '0',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_item_master`
--

CREATE TABLE `inventory_item_master` (
  `id` int NOT NULL,
  `item_code` varchar(50) NOT NULL,
  `item_name` varchar(200) NOT NULL,
  `category` enum('Consumable','Reagent','Equipment') NOT NULL,
  `unit` varchar(50) NOT NULL,
  `min_stock_level` int DEFAULT '0',
  `reorder_level` int DEFAULT '0',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lead_time_days` int DEFAULT '3',
  `safety_stock_buffer` int DEFAULT '20',
  `preferred_vendor_id` int DEFAULT NULL,
  `estimated_cost` decimal(10,2) DEFAULT '0.00',
  `default_vendor_id` int DEFAULT NULL,
  `delivery_lead_time_days` int DEFAULT '3',
  `unit_price` decimal(12,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_payments`
--

CREATE TABLE `inventory_payments` (
  `id` int NOT NULL,
  `payment_number` varchar(100) NOT NULL,
  `vendor_id` int NOT NULL,
  `invoice_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` enum('CASH','BANK','UPI','CHEQUE') NOT NULL,
  `reference_no` varchar(100) DEFAULT NULL,
  `paid_by` int DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_po_items`
--

CREATE TABLE `inventory_po_items` (
  `id` int NOT NULL,
  `po_id` int NOT NULL,
  `pr_item_id` int DEFAULT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_pr_items`
--

CREATE TABLE `inventory_pr_items` (
  `id` int NOT NULL,
  `pr_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity` int NOT NULL,
  `remarks` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_purchase_orders`
--

CREATE TABLE `inventory_purchase_orders` (
  `id` int NOT NULL,
  `po_number` varchar(50) NOT NULL,
  `vendor_id` int NOT NULL,
  `status` enum('DRAFT','ISSUED','COMPLETED','CANCELLED') DEFAULT 'DRAFT',
  `expected_delivery_date` date DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT '0.00',
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `remarks` text
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_purchase_requisitions`
--

CREATE TABLE `inventory_purchase_requisitions` (
  `id` int NOT NULL,
  `pr_number` varchar(50) NOT NULL,
  `branch_id` int NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED','PO_CREATED') DEFAULT 'PENDING',
  `requested_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_purchase_suggestions`
--

CREATE TABLE `inventory_purchase_suggestions` (
  `id` int NOT NULL,
  `item_id` int NOT NULL,
  `vendor_id` int DEFAULT NULL,
  `suggested_qty` int NOT NULL,
  `estimated_cost` decimal(10,2) DEFAULT '0.00',
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_stock`
--

CREATE TABLE `inventory_stock` (
  `id` int NOT NULL,
  `item_id` int NOT NULL,
  `current_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `available_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `reserved_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `consumed_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `expired_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `damaged_stock` decimal(10,2) NOT NULL DEFAULT '0.00',
  `department_id` int DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_stock_transfers`
--

CREATE TABLE `inventory_stock_transfers` (
  `id` int NOT NULL,
  `transfer_number` varchar(50) NOT NULL,
  `from_branch_id` int NOT NULL,
  `to_branch_id` int NOT NULL,
  `status` enum('PENDING','APPROVED','IN_TRANSIT','COMPLETED','CANCELLED') DEFAULT 'PENDING',
  `notes` text,
  `created_by` int DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_stock_transfer_items`
--

CREATE TABLE `inventory_stock_transfer_items` (
  `id` int NOT NULL,
  `transfer_id` int NOT NULL,
  `item_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `quantity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_supplier_invoices`
--

CREATE TABLE `inventory_supplier_invoices` (
  `id` int NOT NULL,
  `invoice_number` varchar(100) NOT NULL,
  `vendor_id` int NOT NULL,
  `po_id` int DEFAULT NULL,
  `grn_id` int DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `paid_amount` decimal(12,2) DEFAULT '0.00',
  `status` enum('PENDING','PARTIAL','PAID') DEFAULT 'PENDING',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_supplier_ledger`
--

CREATE TABLE `inventory_supplier_ledger` (
  `id` int NOT NULL,
  `vendor_id` int NOT NULL,
  `type` enum('INVOICE','PAYMENT') NOT NULL,
  `reference_id` int NOT NULL,
  `debit` decimal(12,2) DEFAULT '0.00',
  `credit` decimal(12,2) DEFAULT '0.00',
  `balance` decimal(12,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_test_mapping`
--

CREATE TABLE `inventory_test_mapping` (
  `id` int NOT NULL,
  `test_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity_required` decimal(10,2) NOT NULL DEFAULT '1.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_transactions`
--

CREATE TABLE `inventory_transactions` (
  `id` int NOT NULL,
  `item_id` int NOT NULL,
  `batch_id` int NOT NULL,
  `type` enum('IN','OUT','ADJUSTMENT') NOT NULL,
  `quantity` int NOT NULL,
  `reference_type` varchar(50) DEFAULT 'Manual',
  `reference_id` varchar(100) DEFAULT NULL,
  `remarks` text,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT NULL,
  `test_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lab_categories`
--

CREATE TABLE `lab_categories` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lab_categories`
--

INSERT INTO `lab_categories` (`id`, `name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Hematology', 'Complete blood count and related tests', 'Active', '2026-04-14 22:59:04', '2026-04-14 22:59:04'),
(2, 'Biochemistry', 'Chemical analysis of blood and body fluids', 'Active', '2026-04-14 22:59:04', '2026-04-14 22:59:04'),
(3, 'Microbiology', 'Culture and sensitivity tests', 'Active', '2026-04-14 22:59:04', '2026-04-14 22:59:04'),
(4, 'Serology', 'Antibody and antigen detection', 'Active', '2026-04-14 22:59:04', '2026-04-14 22:59:04'),
(5, 'Histopathology', 'Tissue examination', 'Active', '2026-04-14 22:59:04', '2026-04-14 22:59:04'),
(6, 'Immunology', 'Immune system tests', 'Active', '2026-04-14 22:59:04', '2026-04-14 22:59:04'),
(7, 'Endocrinology', 'Hormone tests', 'Active', '2026-04-14 22:59:04', '2026-04-14 22:59:04'),
(8, 'Toxicology', 'Drug and toxin analysis', 'Active', '2026-04-14 22:59:04', '2026-04-14 22:59:04');

-- --------------------------------------------------------

--
-- Table structure for table `lab_machines`
--

CREATE TABLE `lab_machines` (
  `id` int NOT NULL,
  `lab_id` int NOT NULL,
  `machine_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `model` varchar(100) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `status` enum('Active','Inactive','Maintenance') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lab_tests`
--

CREATE TABLE `lab_tests` (
  `id` int NOT NULL,
  `test_code` varchar(50) NOT NULL,
  `test_name` varchar(200) NOT NULL,
  `category_id` int NOT NULL,
  `lab_id` int DEFAULT NULL,
  `sample_type` varchar(100) NOT NULL,
  `tube_color` varchar(50) DEFAULT NULL,
  `storage_conditions` text,
  `methodology` text,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lab_tests`
--

INSERT INTO `lab_tests` (`id`, `test_code`, `test_name`, `category_id`, `lab_id`, `sample_type`, `tube_color`, `storage_conditions`, `methodology`, `status`, `price`, `created_at`, `updated_at`) VALUES
(4, 'CBC', 'Complete Blood Count', 1, 8, 'Blood', 'Purple', '', '', 'Active', 800.00, '2026-04-19 13:30:21', '2026-04-19 13:30:21');

-- --------------------------------------------------------

--
-- Table structure for table `lab_test_parameters`
--

CREATE TABLE `lab_test_parameters` (
  `id` int NOT NULL,
  `test_id` int NOT NULL,
  `parameter_code` varchar(10) DEFAULT NULL,
  `parameter_name` varchar(200) NOT NULL,
  `parameter_unit` varchar(50) DEFAULT NULL,
  `result_type` enum('numeric','text','select') DEFAULT 'numeric',
  `min_value` decimal(10,2) DEFAULT NULL,
  `max_value` decimal(10,2) DEFAULT NULL,
  `men_min_value` decimal(10,2) DEFAULT NULL,
  `men_max_value` decimal(10,2) DEFAULT NULL,
  `women_min_value` decimal(10,2) DEFAULT NULL,
  `women_max_value` decimal(10,2) DEFAULT NULL,
  `kids_min_value` decimal(10,2) DEFAULT NULL,
  `kids_max_value` decimal(10,2) DEFAULT NULL,
  `use_demographic_ranges` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT '0',
  `is_calculated` tinyint(1) DEFAULT '0',
  `formula` text,
  `options` text,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lab_test_parameters`
--

INSERT INTO `lab_test_parameters` (`id`, `test_id`, `parameter_code`, `parameter_name`, `parameter_unit`, `result_type`, `min_value`, `max_value`, `men_min_value`, `men_max_value`, `women_min_value`, `women_max_value`, `kids_min_value`, `kids_max_value`, `use_demographic_ranges`, `display_order`, `is_calculated`, `formula`, `options`, `status`, `created_at`, `updated_at`) VALUES
(23, 3, 'PLT', 'Platelet Count', '10^3/µL', 'numeric', 150.00, 450.00, 150.00, 450.00, 150.00, 450.00, 150.00, 450.00, 0, 7, 0, NULL, NULL, 'Active', '2026-04-15 11:51:44', '2026-04-15 11:51:44'),
(22, 3, 'MCHC', 'Mean Corpuscular Hemoglobin Concentration', 'g/dL', 'numeric', 32.00, 36.00, 32.00, 36.00, 32.00, 36.00, 32.00, 36.00, 0, 6, 1, '(HB * 100) / PCV', NULL, 'Active', '2026-04-15 11:51:44', '2026-04-15 11:51:44'),
(21, 3, 'MCH', 'Mean Corpuscular Hemoglobin', 'pg', 'numeric', 27.00, 33.00, 27.00, 33.00, 27.00, 33.00, 27.00, 33.00, 0, 5, 1, '(HB * 10) / RBC', NULL, 'Active', '2026-04-15 11:51:44', '2026-04-15 11:51:44'),
(20, 3, 'MCV', 'Mean Corpuscular Volume', 'fL', 'numeric', 80.00, 100.00, 80.00, 100.00, 80.00, 100.00, 80.00, 100.00, 0, 4, 0, NULL, NULL, 'Active', '2026-04-15 11:51:44', '2026-04-15 11:51:44'),
(19, 3, 'PCV', 'Hematocrit', '%', 'numeric', 36.00, 53.00, 41.00, 53.00, 36.00, 46.00, 35.00, 45.00, 1, 3, 0, NULL, NULL, 'Active', '2026-04-15 11:51:44', '2026-04-15 11:51:44'),
(18, 3, 'WBC', 'White Blood Cell Count', '10^3/µL', 'numeric', 4.00, 11.00, 4.00, 11.00, 4.00, 11.00, 4.00, 11.00, 0, 2, 0, NULL, NULL, 'Active', '2026-04-15 11:51:44', '2026-04-15 11:51:44'),
(17, 3, 'RBC', 'Red Blood Cell Count', '10^6/µL', 'numeric', 4.00, 6.00, 4.70, 6.10, 4.20, 5.40, 4.00, 5.50, 1, 1, 0, NULL, NULL, 'Active', '2026-04-15 11:51:44', '2026-04-15 11:51:44'),
(16, 3, 'HB', 'Hemoglobin', 'g/dL', 'numeric', 13.50, 17.50, 13.50, 17.50, 12.00, 15.50, 11.50, 15.50, 1, 1, 0, NULL, NULL, 'Active', '2026-04-15 11:51:44', '2026-04-15 11:51:44'),
(30, 4, 'CTRL', 'Control Line Validity', '', 'select', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, 0, 5, 0, NULL, 'Valid,Invalid', 'Active', '2026-04-15 11:52:38', '2026-04-15 11:52:38'),
(29, 4, 'RES', 'Overall Interpretation', '', 'select', 0.00, 0.00, NULL, NULL, NULL, NULL, NULL, NULL, 0, 4, 0, NULL, 'Positive,Negative,Indeterminate', 'Active', '2026-04-15 11:52:38', '2026-04-15 11:52:38'),
(28, 4, 'HPA', 'Salmonella Paratyphi H Antigen Titer', 'titer', 'numeric', -0.18, 1.00, NULL, NULL, NULL, NULL, NULL, NULL, 0, 3, 0, NULL, NULL, 'Active', '2026-04-15 11:52:38', '2026-04-15 11:52:38'),
(27, 4, 'OPA', 'Salmonella Paratyphi O Antigen Titer', 'titer', 'numeric', 0.00, 1.00, NULL, NULL, NULL, NULL, NULL, NULL, 0, 2, 0, NULL, NULL, 'Active', '2026-04-15 11:52:38', '2026-04-15 11:52:38'),
(26, 4, 'HAG', 'Salmonella Typhi H Antigen Titer', 'titer', 'numeric', 0.00, 1.00, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, NULL, NULL, 'Active', '2026-04-15 11:52:38', '2026-04-15 11:52:38'),
(25, 4, 'OAG', 'Salmonella Typhi O Antigen Titer', 'titer', 'numeric', 0.00, 1.00, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, NULL, NULL, 'Active', '2026-04-15 11:52:38', '2026-04-15 11:52:38'),
(24, 3, 'RDW', 'Red Cell Distribution Width', '%', 'numeric', 11.50, 14.50, 11.50, 14.50, 11.50, 14.50, 11.50, 14.50, 0, 8, 0, NULL, NULL, 'Active', '2026-04-15 11:51:44', '2026-04-15 11:51:44'),
(42, 1, 'IGGT', 'IgG Antibody Level', 'IU/mL', 'numeric', 0.00, 200.00, 0.00, 200.00, 0.00, 200.00, 0.00, 200.00, 0, 5, 0, NULL, NULL, 'Active', '2026-04-15 12:45:32', '2026-04-15 12:45:32'),
(41, 1, 'IGMT', 'IgM Antibody Level', 'IU/mL', 'numeric', 0.00, 200.00, 0.00, 200.00, 0.00, 200.00, 0.00, 200.00, 0, 4, 0, NULL, NULL, 'Active', '2026-04-15 12:45:32', '2026-04-15 12:45:32'),
(40, 1, 'HRES', 'H Antigen Result', '', 'select', 0.00, 1.00, 0.00, 1.00, 0.00, 1.00, 0.00, 1.00, 0, 3, 0, NULL, 'Positive,Negative', 'Active', '2026-04-15 12:45:32', '2026-04-15 12:45:32'),
(39, 1, 'ORES', 'O Antigen Result', '', 'select', 0.00, 1.00, 0.00, 1.00, 0.00, 1.00, 0.00, 1.00, 0, 2, 0, NULL, 'Positive,Negative', 'Active', '2026-04-15 12:45:32', '2026-04-15 12:45:32'),
(38, 1, 'HAG', 'H Antigen Titer', 'titer', 'numeric', 0.00, 1280.00, 0.00, 1280.00, 0.00, 1280.00, 0.00, 1280.00, 0, 1, 0, NULL, NULL, 'Active', '2026-04-15 12:45:32', '2026-04-15 12:45:32'),
(37, 1, 'OAG', 'O Antigen Titer', 'titer', 'numeric', 0.00, 1280.00, 0.00, 1280.00, 0.00, 1280.00, 0.00, 1280.00, 0, 1, 0, NULL, NULL, 'Active', '2026-04-15 12:45:32', '2026-04-15 12:45:32'),
(43, 2, 'HB', 'Hemoglobin', 'g/dL', 'numeric', 13.50, 17.50, 13.50, 17.50, 12.00, 15.50, 11.50, 15.50, 1, 1, 0, NULL, NULL, 'Active', '2026-04-16 17:20:12', '2026-04-16 17:20:12'),
(44, 2, 'RBC', 'Red Blood Cell Count', '10^6/µL', 'numeric', 4.50, 5.90, 4.50, 5.90, 4.00, 5.20, 4.00, 5.50, 1, 1, 0, NULL, NULL, 'Active', '2026-04-16 17:20:12', '2026-04-16 17:20:12'),
(45, 2, 'WBC', 'White Blood Cell Count', '10^3/µL', 'numeric', 4.00, 11.00, 4.00, 11.00, 4.00, 11.00, 4.00, 11.00, 0, 2, 0, NULL, NULL, 'Active', '2026-04-16 17:20:12', '2026-04-16 17:20:12'),
(46, 2, 'PCV', 'Hematocrit (PCV)', '%', 'numeric', 41.00, 53.00, 41.00, 53.00, 36.00, 46.00, 35.00, 45.00, 1, 3, 0, NULL, NULL, 'Active', '2026-04-16 17:20:12', '2026-04-16 17:20:12'),
(47, 2, 'MCV', 'Mean Corpuscular Volume', 'fL', 'numeric', 80.00, 100.00, 80.00, 100.00, 80.00, 100.00, 80.00, 100.00, 0, 4, 0, NULL, NULL, 'Active', '2026-04-16 17:20:12', '2026-04-16 17:20:12'),
(48, 2, 'MCH', 'Mean Corpuscular Hemoglobin', 'pg', 'numeric', 27.00, 33.00, 27.00, 33.00, 27.00, 33.00, 27.00, 33.00, 0, 5, 1, '(HB * 10) / RBC', NULL, 'Active', '2026-04-16 17:20:12', '2026-04-16 17:20:12'),
(49, 2, 'MCHC', 'Mean Corpuscular Hemoglobin Concentration', 'g/dL', 'numeric', 32.00, 36.00, 32.00, 36.00, 32.00, 36.00, 32.00, 36.00, 0, 6, 1, '(HB * 100) / PCV', NULL, 'Active', '2026-04-16 17:20:12', '2026-04-16 17:20:12'),
(50, 2, 'PLT', 'Platelet Count', '10^3/µL', 'numeric', 150.00, 450.00, 150.00, 450.00, 150.00, 450.00, 150.00, 450.00, 0, 7, 0, NULL, NULL, 'Active', '2026-04-16 17:20:12', '2026-04-16 17:20:12'),
(51, 3, 'TC', 'Total Cholesterol', 'mg/dL', 'numeric', 125.00, 200.00, 125.00, 200.00, 125.00, 200.00, 125.00, 200.00, 0, 1, 0, NULL, NULL, 'Active', '2026-04-17 09:17:07', '2026-04-17 09:17:07'),
(52, 3, 'TG', 'Triglycerides', 'mg/dL', 'numeric', 0.00, 150.00, 0.00, 150.00, 0.00, 150.00, 0.00, 150.00, 0, 1, 0, NULL, NULL, 'Active', '2026-04-17 09:17:07', '2026-04-17 09:17:07'),
(53, 3, 'HDL', 'High Density Lipoprotein Cholesterol', 'mg/dL', 'numeric', 40.00, 60.00, 40.00, 60.00, 50.00, 70.00, 45.00, 65.00, 1, 2, 0, NULL, NULL, 'Active', '2026-04-17 09:17:07', '2026-04-17 09:17:07'),
(54, 3, 'LDL', 'Low Density Lipoprotein Cholesterol', 'mg/dL', 'numeric', 0.00, 100.00, 0.00, 100.00, 0.00, 100.00, 0.00, 100.00, 0, 3, 1, '(TC - HDL - (TG/5))', NULL, 'Active', '2026-04-17 09:17:07', '2026-04-17 09:17:07'),
(55, 3, 'VLDL', 'Very Low Density Lipoprotein Cholesterol', 'mg/dL', 'numeric', 5.00, 40.00, 5.00, 40.00, 5.00, 40.00, 5.00, 40.00, 0, 4, 1, '(TG/5)', NULL, 'Active', '2026-04-17 09:17:07', '2026-04-17 09:17:07'),
(56, 3, 'NHDL', 'Non-HDL Cholesterol', 'mg/dL', 'numeric', 80.00, 160.00, 80.00, 160.00, 80.00, 160.00, 80.00, 160.00, 0, 5, 1, '(TC - HDL)', NULL, 'Active', '2026-04-17 09:17:07', '2026-04-17 09:17:07'),
(57, 3, 'LPA', 'Lipoprotein(a)', 'mg/dL', 'numeric', 0.00, 30.00, 0.00, 30.00, 0.00, 30.00, 0.00, 30.00, 0, 6, 0, NULL, NULL, 'Active', '2026-04-17 09:17:07', '2026-04-17 09:17:07'),
(58, 3, 'APOA', 'Apolipoprotein A1', 'mg/dL', 'numeric', 120.00, 160.00, 120.00, 160.00, 120.00, 160.00, 120.00, 160.00, 0, 7, 0, NULL, NULL, 'Active', '2026-04-17 09:17:07', '2026-04-17 09:17:07'),
(59, 3, 'APOB', 'Apolipoprotein B', 'mg/dL', 'numeric', 80.00, 120.00, 80.00, 120.00, 80.00, 120.00, 80.00, 120.00, 0, 8, 0, NULL, NULL, 'Active', '2026-04-17 09:17:07', '2026-04-17 09:17:07'),
(60, 4, 'HB', 'Hemoglobin', 'g/dL', 'numeric', 13.50, 17.50, 13.50, 17.50, 12.00, 15.50, 11.50, 15.50, 1, 1, 0, NULL, NULL, 'Active', '2026-04-19 13:30:21', '2026-04-19 13:30:21'),
(61, 4, 'RBC', 'Red Blood Cell Count', '10^6/µL', 'numeric', 4.50, 5.90, 4.70, 6.10, 4.20, 5.40, 4.00, 5.50, 1, 1, 0, NULL, NULL, 'Active', '2026-04-19 13:30:21', '2026-04-19 13:30:21'),
(62, 4, 'WBC', 'White Blood Cell Count', '10^3/µL', 'numeric', 4.00, 11.00, 4.00, 11.00, 4.00, 11.00, 5.00, 15.00, 1, 2, 0, NULL, NULL, 'Active', '2026-04-19 13:30:21', '2026-04-19 13:30:21'),
(63, 4, 'PCV', 'Hematocrit', '%', 'numeric', 38.00, 50.00, 40.00, 54.00, 36.00, 48.00, 35.00, 45.00, 1, 3, 0, NULL, NULL, 'Active', '2026-04-19 13:30:21', '2026-04-19 13:30:21'),
(64, 4, 'MCV', 'Mean Corpuscular Volume', 'fL', 'numeric', 80.00, 100.00, 80.00, 100.00, 80.00, 100.00, 78.00, 92.00, 1, 4, 0, NULL, NULL, 'Active', '2026-04-19 13:30:21', '2026-04-19 13:30:21'),
(65, 4, 'MCH', 'Mean Corpuscular Hemoglobin', 'pg', 'numeric', 27.00, 33.00, 27.00, 33.00, 27.00, 33.00, 26.00, 34.00, 1, 5, 1, '(HB * 10) / RBC', NULL, 'Active', '2026-04-19 13:30:21', '2026-04-19 13:30:21'),
(66, 4, 'MCHC', 'Mean Corpuscular Hemoglobin Concentration', 'g/dL', 'numeric', 32.00, 36.00, 32.00, 36.00, 32.00, 36.00, 32.00, 36.00, 1, 6, 1, '(HB * 100) / PCV', NULL, 'Active', '2026-04-19 13:30:21', '2026-04-19 13:30:21'),
(67, 4, 'PLT', 'Platelet Count', '10^3/µL', 'numeric', 150.00, 400.00, 150.00, 400.00, 150.00, 400.00, 150.00, 450.00, 1, 7, 0, NULL, NULL, 'Active', '2026-04-19 13:30:21', '2026-04-19 13:30:21');

-- --------------------------------------------------------

--
-- Table structure for table `lab_test_result`
--

CREATE TABLE `lab_test_result` (
  `id` int NOT NULL,
  `bill_item_id` int DEFAULT NULL,
  `patient_id` int DEFAULT NULL,
  `sample_id` varchar(50) NOT NULL,
  `machine_no` varchar(50) DEFAULT NULL,
  `test_id` int DEFAULT NULL,
  `test_name` varchar(200) DEFAULT NULL,
  `results_json` json NOT NULL,
  `tested_by` int DEFAULT NULL,
  `verified_by` int DEFAULT NULL,
  `tested_at` timestamp NULL DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `status` enum('Pending','Test Done','Verified','Approved') DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lab_test_result`
--

INSERT INTO `lab_test_result` (`id`, `bill_item_id`, `patient_id`, `sample_id`, `machine_no`, `test_id`, `test_name`, `results_json`, `tested_by`, `verified_by`, `tested_at`, `verified_at`, `notes`, `status`, `created_at`, `updated_at`, `branch_id`) VALUES
(1, 123, 3, 'LAB-20260429-0001', 'MANUAL', 10, NULL, '[{\"unit\": \"titer\", \"result_flag\": \"normal\", \"parameter_id\": 1, \"result_value\": \"1:160\", \"parameter_name\": \"H Antigen Titer\", \"reference_range\": \"0-1280\"}, {\"unit\": \"titer\", \"result_flag\": \"high\", \"parameter_id\": 2, \"result_value\": \"1:320\", \"parameter_name\": \"O Antigen Titer\", \"reference_range\": \"0-1280\"}, {\"unit\": \"\", \"result_flag\": \"normal\", \"parameter_id\": 3, \"result_value\": \"Positive\", \"parameter_name\": \"O Antigen Result\", \"reference_range\": \"\"}, {\"unit\": \"\", \"result_flag\": \"normal\", \"parameter_id\": 4, \"result_value\": \"Negative\", \"parameter_name\": \"H Antigen Result\", \"reference_range\": \"\"}, {\"unit\": \"IU/mL\", \"result_flag\": \"normal\", \"parameter_id\": 5, \"result_value\": \"45\", \"parameter_name\": \"IgM Antibody Level\", \"reference_range\": \"0-200\"}, {\"unit\": \"IU/mL\", \"result_flag\": \"normal\", \"parameter_id\": 6, \"result_value\": \"120\", \"parameter_name\": \"IgG Antibody Level\", \"reference_range\": \"0-200\"}]', 1, 1, '2026-04-29 07:37:49', '2026-04-29 07:38:07', NULL, 'Approved', '2026-04-29 07:37:48', '2026-04-29 07:38:06', 1);

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int NOT NULL,
  `reg_no` varchar(50) NOT NULL,
  `reg_date` date NOT NULL,
  `is_new_born` tinyint(1) DEFAULT '0',
  `photo_base64` longtext,
  `title` varchar(20) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `aadhar_number` varchar(50) DEFAULT NULL,
  `abha_id` varchar(50) DEFAULT NULL,
  `marital_status` varchar(50) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `education_level` varchar(100) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `citizen` varchar(50) DEFAULT NULL,
  `email_id` varchar(100) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `file_required` tinyint(1) DEFAULT '0',
  `address` varchar(255) DEFAULT NULL,
  `suburb` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `country` varchar(50) DEFAULT NULL,
  `postal_code` varchar(50) DEFAULT NULL,
  `postal_address_check` tinyint(1) DEFAULT '0',
  `kin_same_address` tinyint(1) DEFAULT '0',
  `kin_name` varchar(100) DEFAULT NULL,
  `kin_relation` varchar(50) DEFAULT NULL,
  `kin_telephone` varchar(20) DEFAULT NULL,
  `kin_address` varchar(255) DEFAULT NULL,
  `kin_suburb` varchar(100) DEFAULT NULL,
  `kin_city` varchar(100) DEFAULT NULL,
  `kin_country` varchar(50) DEFAULT NULL,
  `kin_code` varchar(50) DEFAULT NULL,
  `payer_type` varchar(100) DEFAULT NULL,
  `insurance_provider` varchar(100) DEFAULT NULL,
  `policy_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `reg_no`, `reg_date`, `is_new_born`, `photo_base64`, `title`, `first_name`, `middle_name`, `last_name`, `dob`, `gender`, `aadhar_number`, `abha_id`, `marital_status`, `occupation`, `language`, `education_level`, `religion`, `citizen`, `email_id`, `telephone`, `file_required`, `address`, `suburb`, `city`, `country`, `postal_code`, `postal_address_check`, `kin_same_address`, `kin_name`, `kin_relation`, `kin_telephone`, `kin_address`, `kin_suburb`, `kin_city`, `kin_country`, `kin_code`, `payer_type`, `insurance_provider`, `policy_number`, `created_at`, `branch_id`) VALUES
(1, 'REG-38126', '2026-04-29', 0, NULL, '', 'Bhaskar', '', 'Sekar', '1979-06-25', 'Male', NULL, NULL, '', '', '', '', '', '', '', '8925386821', 0, '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', '', '', '', '2026-04-29 03:45:45', 1),
(2, 'REG-59523', '2026-04-29', 0, NULL, '', 'Sibyll', '', 'Dominic R', '2005-05-12', 'Male', NULL, NULL, '', '', '', '', '', '', '', '7810027381', 0, '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', '', '', '', '2026-04-29 03:46:28', 1),
(3, 'REG-18146', '2026-04-29', 0, NULL, '', 'Steve', '', 'Jerald', '2005-10-16', 'Male', NULL, NULL, '', '', '', '', '', '', '', '9025740156', 0, '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', '', '', '', '2026-04-29 03:46:57', 1);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_orders`
--

CREATE TABLE `purchase_orders` (
  `id` int NOT NULL,
  `po_number` varchar(50) NOT NULL,
  `pr_id` int DEFAULT NULL,
  `vendor_id` int NOT NULL,
  `order_date` date NOT NULL,
  `expected_delivery` date DEFAULT NULL,
  `delivery_location` int DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax_amount` decimal(10,2) DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `terms_conditions` text,
  `status` enum('Draft','Sent','Partially Received','Fully Received','Cancelled') DEFAULT 'Draft',
  `created_by` int NOT NULL,
  `branch_id` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_order_items`
--

CREATE TABLE `purchase_order_items` (
  `id` int NOT NULL,
  `po_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity_ordered` decimal(10,2) NOT NULL,
  `quantity_received` decimal(10,2) DEFAULT '0.00',
  `quantity_damaged` decimal(10,2) DEFAULT '0.00',
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_requisitions`
--

CREATE TABLE `purchase_requisitions` (
  `id` int NOT NULL,
  `pr_number` varchar(50) NOT NULL,
  `department_id` int DEFAULT NULL,
  `requested_by` int NOT NULL,
  `request_date` date NOT NULL,
  `required_date` date DEFAULT NULL,
  `priority` enum('Low','Normal','High','Urgent') DEFAULT 'Normal',
  `total_amount` decimal(10,2) DEFAULT '0.00',
  `status` enum('Draft','Submitted','Approved','Rejected','Converted to PO') DEFAULT 'Draft',
  `notes` text,
  `branch_id` int DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_requisition_items`
--

CREATE TABLE `purchase_requisition_items` (
  `id` int NOT NULL,
  `pr_id` int NOT NULL,
  `item_id` int NOT NULL,
  `quantity_requested` decimal(10,2) NOT NULL,
  `quantity_approved` decimal(10,2) DEFAULT NULL,
  `unit_price` decimal(10,2) DEFAULT NULL,
  `total_price` decimal(10,2) DEFAULT NULL,
  `notes` text,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sample_containers`
--

CREATE TABLE `sample_containers` (
  `id` int NOT NULL,
  `container_name` varchar(100) NOT NULL,
  `tube_color` varchar(50) DEFAULT NULL,
  `volume_ml` decimal(5,2) DEFAULT NULL,
  `additives` text,
  `storage_temperature` varchar(50) DEFAULT NULL,
  `special_instructions` text,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sample_containers`
--

INSERT INTO `sample_containers` (`id`, `container_name`, `tube_color`, `volume_ml`, `additives`, `storage_temperature`, `special_instructions`, `status`, `created_at`) VALUES
(1, 'EDTA Tube', 'Purple', 3.00, 'EDTA (K2/K3)', '2-8°C', NULL, 'Active', '2026-04-14 22:59:04'),
(2, 'Clot Activator Tube', 'Red', 5.00, 'Clot activator', 'Room Temperature', NULL, 'Active', '2026-04-14 22:59:04'),
(3, 'Heparin Tube', 'Green', 5.00, 'Lithium Heparin', '2-8°C', NULL, 'Active', '2026-04-14 22:59:04'),
(4, 'Fluoride Tube', 'Grey', 2.00, 'Sodium Fluoride', '2-8°C', NULL, 'Active', '2026-04-14 22:59:04'),
(5, 'Citrate Tube', 'Blue', 2.70, 'Sodium Citrate', '2-8°C', NULL, 'Active', '2026-04-14 22:59:04'),
(6, 'Plain Tube', 'No color', 10.00, 'No additives', 'Room Temperature', NULL, 'Active', '2026-04-14 22:59:04'),
(7, 'EDTA Tube', 'Lavender Top', 5.00, '', '', '', 'Active', '2026-04-15 09:33:11');

-- --------------------------------------------------------

--
-- Table structure for table `sample_types`
--

CREATE TABLE `sample_types` (
  `id` int NOT NULL,
  `type_name` varchar(100) NOT NULL,
  `description` text,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `sample_types`
--

INSERT INTO `sample_types` (`id`, `type_name`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Blood', 'Whole blood sample', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06'),
(2, 'Serum', 'Blood serum sample', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06'),
(3, 'Plasma', 'Blood plasma sample', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06'),
(4, 'Urine', 'Urine sample', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06'),
(5, 'Stool', 'Stool sample', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06'),
(6, 'CSF', 'Cerebrospinal fluid', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06'),
(7, 'Saliva', 'Saliva sample', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06'),
(8, 'Tissue', 'Biopsy tissue sample', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06'),
(9, 'Swab', 'Nasal/throat swab', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06'),
(10, 'Sputum', 'Sputum sample', 'Active', '2026-04-15 03:17:06', '2026-04-15 03:17:06');

-- --------------------------------------------------------

--
-- Table structure for table `stock_transfers`
--

CREATE TABLE `stock_transfers` (
  `id` int NOT NULL,
  `transfer_number` varchar(50) NOT NULL,
  `from_department` int NOT NULL,
  `to_department` int NOT NULL,
  `transfer_date` date NOT NULL,
  `status` enum('Pending','In Transit','Received','Cancelled') DEFAULT 'Pending',
  `requested_by` int NOT NULL,
  `approved_by` int DEFAULT NULL,
  `received_by` int DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_transfer_items`
--

CREATE TABLE `stock_transfer_items` (
  `id` int NOT NULL,
  `transfer_id` int NOT NULL,
  `item_id` int NOT NULL,
  `batch_id` int DEFAULT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `received_quantity` decimal(10,2) DEFAULT '0.00',
  `damaged_quantity` decimal(10,2) DEFAULT '0.00',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` varchar(20) NOT NULL,
  `department` varchar(50) NOT NULL,
  `staff_id` varchar(50) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `branch_id` int DEFAULT '1',
  `role_level` enum('Central','Sub-Central','Branch') DEFAULT 'Branch'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `phone`, `role`, `department`, `staff_id`, `password`, `created_at`, `branch_id`, `role_level`) VALUES
(1, 'Central', 'Head', 'central@mail.com', NULL, 'admin', 'cardiology', NULL, '$2a$10$HdUurOEbxJ2bZqOeWEK1S.Acw4ECU8YArfiWAVLw9AJ/dHwUae0Bm', '2026-04-29 07:14:28', 1, 'Central'),
(2, 'Sample', '1', 'Sub@mail.com', NULL, 'admin', 'emergency', NULL, '$2a$10$sDM5o3b9BYraHBEnyavqz.EY4mrujspYCJDAfDk8c7Pnq54tDEEHe', '2026-04-29 07:21:08', 5, 'Sub-Central'),
(3, 'single', 'user', 'single@mail.com', NULL, 'admin', 'administration', NULL, '$2a$10$VT8IujIwfvVCNPI8iBuVheULrUbrvf0DAhyEEdc7VjbonC2bkg4qK', '2026-04-29 07:22:00', 6, 'Sub-Central'),
(4, 'sample 3', '3', '3@mail.com', NULL, 'admin', 'emergency', NULL, '$2a$10$H8wuaXJITKSk6.PJdG9fy.AapqBngY9Imc6tXDTqL3R9YbXFs2Z/u', '2026-04-29 07:23:40', 7, 'Sub-Central'),
(5, 'Steve', 'Jerald', 'steve@mail.com', NULL, 'admin', 'emergency', NULL, '$2a$10$lcND.gb.tCOcQRJkXYnoZ.wsDv2ngz4JzE9cG0Qo4Yan/VPWt8bq2', '2026-04-29 11:45:36', 1, 'Central'),
(6, 'as', 'as', 'jewame2218@hacknapp.com', NULL, 'admin', 'emergency', NULL, '$2a$10$O.kJ8IhwIUWWhxB8FsEF2OnolxAbhsgAZnd6ZtWCKjPjrdlz/YXb2', '2026-04-29 11:50:07', 3, 'Sub-Central');

-- --------------------------------------------------------

--
-- Table structure for table `vendors`
--

CREATE TABLE `vendors` (
  `id` int NOT NULL,
  `vendor_code` varchar(50) NOT NULL,
  `vendor_name` varchar(200) NOT NULL,
  `contact_person` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` text,
  `tax_id` varchar(50) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT NULL,
  `lead_time_days` int DEFAULT '7',
  `bank_name` varchar(100) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `status` enum('Active','Inactive','Blacklisted') DEFAULT 'Active',
  `rating` decimal(3,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `vendors`
--

INSERT INTO `vendors` (`id`, `vendor_code`, `vendor_name`, `contact_person`, `phone`, `email`, `address`, `tax_id`, `payment_terms`, `lead_time_days`, `bank_name`, `account_number`, `ifsc_code`, `status`, `rating`, `created_at`, `updated_at`) VALUES
(1, 'IVND001', 'Acme Corp', 'John Doe', '1234567890', 'john@acme.com', '123 Acme Way, City', '', '', 7, '', '', '', 'Active', 0.00, '2026-04-19 14:21:25', '2026-04-19 14:21:25'),
(2, 'IVND002', 'JB', 'Steve', '9025740156', 'steve632@gmail.com', 'C-3, Ground Floor, Durgalakshmi Appt, Revathy Flats, Anna Nagar 10th Cross Street, Pammal, Chennai-600075\n', '89812', '', 7, 'indian Bank', '12982939b 239', 'IDID', 'Active', 0.00, '2026-04-19 14:22:16', '2026-04-19 14:22:16'),
(3, 'IVND003', 'Senthil Enterprises', 'Paramesh', '9952746925', 'paramashsenthil7@gmail.com', 'C-3, Pammal', '134 12111', '', 7, 'Indian Bank', '1212112', 'IDFC', 'Active', 0.00, '2026-04-20 08:56:14', '2026-04-20 13:02:11'),
(4, 'IVND004', 'JB Dealers', 'Bhaskar S', '8925386821', 'bhaskar.sekar@merillife.com', 'C-3, Ground Floor, Durgalakshmi Appt, Revathy Flats, Anna Nagar 10th Cross Street, Pammal, Chennai-600075', '1212121', '', 7, 'Indian Bank', '121', '112', 'Active', 0.00, '2026-04-20 09:25:22', '2026-04-20 09:36:42'),
(5, 'IVND005', 'Dominic Surgicals', 'Sibyll', '7810027381', 'sibylldominic@gmail.com', 'C-3, Ground Floor, Durgalakshmi Appt, Revathy Flats, Anna Nagar 10th Cross Street, Pammal, Chennai-600075', '12111', '', 7, 'Indian Bank', '1200 1289', 'IDFC', 'Active', 0.00, '2026-04-20 09:48:16', '2026-04-20 09:48:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reg_no` (`reg_no`);

--
-- Indexes for table `billing`
--
ALTER TABLE `billing`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reg_no` (`reg_no`);

--
-- Indexes for table `billing_packages`
--
ALTER TABLE `billing_packages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `package_id` (`package_id`);

--
-- Indexes for table `bills`
--
ALTER TABLE `bills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `bill_number` (`bill_number`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `payment_status` (`payment_status`),
  ADD KEY `fk_bill_branch` (`branch_id`);

--
-- Indexes for table `bill_items`
--
ALTER TABLE `bill_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bill_id` (`bill_id`),
  ADD KEY `lab_id` (`lab_id`),
  ADD KEY `sample_id` (`sample_id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `hospital_code` (`hospital_code`),
  ADD KEY `district_id` (`district_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `districts`
--
ALTER TABLE `districts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `duty_schedules`
--
ALTER TABLE `duty_schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `room_id` (`room_id`);

--
-- Indexes for table `facility_categories`
--
ALTER TABLE `facility_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `goods_receipts`
--
ALTER TABLE `goods_receipts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `grn_number` (`grn_number`),
  ADD KEY `po_id` (`po_id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `received_by` (`received_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `status` (`status`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `goods_receipt_items`
--
ALTER TABLE `goods_receipt_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `grn_id` (`grn_id`);

--
-- Indexes for table `hospital_settings`
--
ALTER TABLE `hospital_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `infrastructure`
--
ALTER TABLE `infrastructure`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_infra_branch` (`branch_id`);

--
-- Indexes for table `inventory_batches`
--
ALTER TABLE `inventory_batches`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `batch_number` (`batch_number`),
  ADD KEY `expiry_date` (`expiry_date`),
  ADD KEY `status` (`status`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `item_code` (`item_code`),
  ADD KEY `category` (`category`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `inventory_item_master`
--
ALTER TABLE `inventory_item_master`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `item_code` (`item_code`),
  ADD KEY `fk_item_vendor` (`preferred_vendor_id`);

--
-- Indexes for table `inventory_payments`
--
ALTER TABLE `inventory_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `payment_number` (`payment_number`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `invoice_id` (`invoice_id`);

--
-- Indexes for table `inventory_po_items`
--
ALTER TABLE `inventory_po_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `po_id` (`po_id`),
  ADD KEY `pr_item_id` (`pr_item_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `inventory_pr_items`
--
ALTER TABLE `inventory_pr_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pr_id` (`pr_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `inventory_purchase_orders`
--
ALTER TABLE `inventory_purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `po_number` (`po_number`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `inventory_purchase_requisitions`
--
ALTER TABLE `inventory_purchase_requisitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pr_number` (`pr_number`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `inventory_purchase_suggestions`
--
ALTER TABLE `inventory_purchase_suggestions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `inventory_stock`
--
ALTER TABLE `inventory_stock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_item_dept` (`item_id`,`department_id`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `inventory_stock_transfers`
--
ALTER TABLE `inventory_stock_transfers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transfer_number` (`transfer_number`),
  ADD KEY `from_branch_id` (`from_branch_id`),
  ADD KEY `to_branch_id` (`to_branch_id`);

--
-- Indexes for table `inventory_stock_transfer_items`
--
ALTER TABLE `inventory_stock_transfer_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `transfer_id` (`transfer_id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `batch_id` (`batch_id`);

--
-- Indexes for table `inventory_supplier_invoices`
--
ALTER TABLE `inventory_supplier_invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `inventory_supplier_ledger`
--
ALTER TABLE `inventory_supplier_ledger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `vendor_id` (`vendor_id`);

--
-- Indexes for table `inventory_test_mapping`
--
ALTER TABLE `inventory_test_mapping`
  ADD PRIMARY KEY (`id`),
  ADD KEY `test_id` (`test_id`),
  ADD KEY `item_id` (`item_id`);

--
-- Indexes for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `fk_inv_trans_test` (`test_id`),
  ADD KEY `fk_inventory_trans_branch` (`branch_id`);

--
-- Indexes for table `lab_categories`
--
ALTER TABLE `lab_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `lab_machines`
--
ALTER TABLE `lab_machines`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_machine_id` (`lab_id`,`machine_id`),
  ADD KEY `lab_id` (`lab_id`);

--
-- Indexes for table `lab_tests`
--
ALTER TABLE `lab_tests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `test_code` (`test_code`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `lab_id` (`lab_id`);

--
-- Indexes for table `lab_test_parameters`
--
ALTER TABLE `lab_test_parameters`
  ADD PRIMARY KEY (`id`),
  ADD KEY `test_id` (`test_id`);

--
-- Indexes for table `lab_test_result`
--
ALTER TABLE `lab_test_result`
  ADD PRIMARY KEY (`id`),
  ADD KEY `bill_item_id` (`bill_item_id`),
  ADD KEY `sample_id` (`sample_id`),
  ADD KEY `machine_no` (`machine_no`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `fk_lab_result_branch` (`branch_id`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reg_no` (`reg_no`),
  ADD KEY `fk_patient_branch` (`branch_id`);

--
-- Indexes for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `po_number` (`po_number`),
  ADD KEY `pr_id` (`pr_id`),
  ADD KEY `vendor_id` (`vendor_id`),
  ADD KEY `delivery_location` (`delivery_location`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `status` (`status`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `po_id` (`po_id`);

--
-- Indexes for table `purchase_requisitions`
--
ALTER TABLE `purchase_requisitions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `pr_number` (`pr_number`),
  ADD KEY `requested_by` (`requested_by`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `status` (`status`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `purchase_requisition_items`
--
ALTER TABLE `purchase_requisition_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `pr_id` (`pr_id`);

--
-- Indexes for table `sample_containers`
--
ALTER TABLE `sample_containers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `sample_types`
--
ALTER TABLE `sample_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `type_name` (`type_name`);

--
-- Indexes for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `transfer_number` (`transfer_number`),
  ADD KEY `from_department` (`from_department`),
  ADD KEY `to_department` (`to_department`),
  ADD KEY `requested_by` (`requested_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `received_by` (`received_by`);

--
-- Indexes for table `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `item_id` (`item_id`),
  ADD KEY `batch_id` (`batch_id`),
  ADD KEY `transfer_id` (`transfer_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_user_branch` (`branch_id`);

--
-- Indexes for table `vendors`
--
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `vendor_code` (`vendor_code`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `billing`
--
ALTER TABLE `billing`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `billing_packages`
--
ALTER TABLE `billing_packages`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `bills`
--
ALTER TABLE `bills`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `bill_items`
--
ALTER TABLE `bill_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `districts`
--
ALTER TABLE `districts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `duty_schedules`
--
ALTER TABLE `duty_schedules`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `facility_categories`
--
ALTER TABLE `facility_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `goods_receipts`
--
ALTER TABLE `goods_receipts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `goods_receipt_items`
--
ALTER TABLE `goods_receipt_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `hospital_settings`
--
ALTER TABLE `hospital_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `infrastructure`
--
ALTER TABLE `infrastructure`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `inventory_batches`
--
ALTER TABLE `inventory_batches`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_items`
--
ALTER TABLE `inventory_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_item_master`
--
ALTER TABLE `inventory_item_master`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_payments`
--
ALTER TABLE `inventory_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_po_items`
--
ALTER TABLE `inventory_po_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_pr_items`
--
ALTER TABLE `inventory_pr_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_purchase_orders`
--
ALTER TABLE `inventory_purchase_orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_purchase_requisitions`
--
ALTER TABLE `inventory_purchase_requisitions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_purchase_suggestions`
--
ALTER TABLE `inventory_purchase_suggestions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_stock`
--
ALTER TABLE `inventory_stock`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_stock_transfers`
--
ALTER TABLE `inventory_stock_transfers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_stock_transfer_items`
--
ALTER TABLE `inventory_stock_transfer_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_supplier_invoices`
--
ALTER TABLE `inventory_supplier_invoices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_supplier_ledger`
--
ALTER TABLE `inventory_supplier_ledger`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_test_mapping`
--
ALTER TABLE `inventory_test_mapping`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lab_categories`
--
ALTER TABLE `lab_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `lab_machines`
--
ALTER TABLE `lab_machines`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `lab_tests`
--
ALTER TABLE `lab_tests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `lab_test_parameters`
--
ALTER TABLE `lab_test_parameters`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `lab_test_result`
--
ALTER TABLE `lab_test_result`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_requisitions`
--
ALTER TABLE `purchase_requisitions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_requisition_items`
--
ALTER TABLE `purchase_requisition_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sample_containers`
--
ALTER TABLE `sample_containers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `sample_types`
--
ALTER TABLE `sample_types`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `vendors`
--
ALTER TABLE `vendors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`reg_no`) REFERENCES `patients` (`reg_no`) ON DELETE CASCADE;

--
-- Constraints for table `billing`
--
ALTER TABLE `billing`
  ADD CONSTRAINT `billing_ibfk_1` FOREIGN KEY (`reg_no`) REFERENCES `patients` (`reg_no`) ON DELETE CASCADE;

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`district_id`) REFERENCES `districts` (`id`);

--
-- Constraints for table `goods_receipts`
--
ALTER TABLE `goods_receipts`
  ADD CONSTRAINT `fk_grn_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `goods_receipts_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `goods_receipts_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `goods_receipts_ibfk_3` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `goods_receipts_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `goods_receipt_items`
--
ALTER TABLE `goods_receipt_items`
  ADD CONSTRAINT `goods_receipt_items_ibfk_1` FOREIGN KEY (`grn_id`) REFERENCES `goods_receipts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `goods_receipt_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `infrastructure`
--
ALTER TABLE `infrastructure`
  ADD CONSTRAINT `fk_infra_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

--
-- Constraints for table `inventory_batches`
--
ALTER TABLE `inventory_batches`
  ADD CONSTRAINT `fk_inventory_batch_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `inventory_batches_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_batches_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_item_master`
--
ALTER TABLE `inventory_item_master`
  ADD CONSTRAINT `fk_item_vendor` FOREIGN KEY (`preferred_vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_payments`
--
ALTER TABLE `inventory_payments`
  ADD CONSTRAINT `inventory_payments_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `inventory_payments_ibfk_2` FOREIGN KEY (`invoice_id`) REFERENCES `inventory_supplier_invoices` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `inventory_po_items`
--
ALTER TABLE `inventory_po_items`
  ADD CONSTRAINT `inventory_po_items_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `inventory_purchase_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_po_items_ibfk_2` FOREIGN KEY (`pr_item_id`) REFERENCES `inventory_pr_items` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `inventory_po_items_ibfk_3` FOREIGN KEY (`item_id`) REFERENCES `inventory_item_master` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `inventory_pr_items`
--
ALTER TABLE `inventory_pr_items`
  ADD CONSTRAINT `inventory_pr_items_ibfk_1` FOREIGN KEY (`pr_id`) REFERENCES `inventory_purchase_requisitions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_pr_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_item_master` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `inventory_purchase_orders`
--
ALTER TABLE `inventory_purchase_orders`
  ADD CONSTRAINT `inventory_purchase_orders_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `inventory_purchase_requisitions`
--
ALTER TABLE `inventory_purchase_requisitions`
  ADD CONSTRAINT `inventory_purchase_requisitions_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `infrastructure` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `inventory_purchase_suggestions`
--
ALTER TABLE `inventory_purchase_suggestions`
  ADD CONSTRAINT `inventory_purchase_suggestions_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_item_master` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_purchase_suggestions_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_stock`
--
ALTER TABLE `inventory_stock`
  ADD CONSTRAINT `inventory_stock_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_stock_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `infrastructure` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_stock_transfers`
--
ALTER TABLE `inventory_stock_transfers`
  ADD CONSTRAINT `inventory_stock_transfers_ibfk_1` FOREIGN KEY (`from_branch_id`) REFERENCES `infrastructure` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `inventory_stock_transfers_ibfk_2` FOREIGN KEY (`to_branch_id`) REFERENCES `infrastructure` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `inventory_stock_transfer_items`
--
ALTER TABLE `inventory_stock_transfer_items`
  ADD CONSTRAINT `inventory_stock_transfer_items_ibfk_1` FOREIGN KEY (`transfer_id`) REFERENCES `inventory_stock_transfers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_stock_transfer_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_item_master` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `inventory_stock_transfer_items_ibfk_3` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `inventory_supplier_invoices`
--
ALTER TABLE `inventory_supplier_invoices`
  ADD CONSTRAINT `inventory_supplier_invoices_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `inventory_supplier_ledger`
--
ALTER TABLE `inventory_supplier_ledger`
  ADD CONSTRAINT `inventory_supplier_ledger_ibfk_1` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `inventory_test_mapping`
--
ALTER TABLE `inventory_test_mapping`
  ADD CONSTRAINT `inventory_test_mapping_ibfk_1` FOREIGN KEY (`test_id`) REFERENCES `lab_tests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inventory_test_mapping_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_item_master` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  ADD CONSTRAINT `fk_inv_trans_test` FOREIGN KEY (`test_id`) REFERENCES `lab_tests` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_inventory_trans_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `inventory_transactions_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_item_master` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `inventory_transactions_ibfk_2` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `lab_machines`
--
ALTER TABLE `lab_machines`
  ADD CONSTRAINT `lab_machines_ibfk_1` FOREIGN KEY (`lab_id`) REFERENCES `infrastructure` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lab_test_result`
--
ALTER TABLE `lab_test_result`
  ADD CONSTRAINT `fk_lab_result_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `fk_patient_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);

--
-- Constraints for table `purchase_orders`
--
ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `fk_po_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `purchase_orders_ibfk_3` FOREIGN KEY (`delivery_location`) REFERENCES `infrastructure` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_orders_ibfk_4` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `purchase_order_items`
--
ALTER TABLE `purchase_order_items`
  ADD CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`po_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_order_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `purchase_requisitions`
--
ALTER TABLE `purchase_requisitions`
  ADD CONSTRAINT `fk_pr_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_requisitions_ibfk_1` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `purchase_requisitions_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `infrastructure` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `purchase_requisition_items`
--
ALTER TABLE `purchase_requisition_items`
  ADD CONSTRAINT `purchase_requisition_items_ibfk_1` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `purchase_requisition_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE RESTRICT;

--
-- Constraints for table `stock_transfers`
--
ALTER TABLE `stock_transfers`
  ADD CONSTRAINT `stock_transfers_ibfk_1` FOREIGN KEY (`from_department`) REFERENCES `infrastructure` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `stock_transfers_ibfk_2` FOREIGN KEY (`to_department`) REFERENCES `infrastructure` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `stock_transfers_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `stock_transfers_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `stock_transfers_ibfk_5` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `stock_transfer_items`
--
ALTER TABLE `stock_transfer_items`
  ADD CONSTRAINT `stock_transfer_items_ibfk_1` FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `stock_transfer_items_ibfk_2` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `stock_transfer_items_ibfk_3` FOREIGN KEY (`batch_id`) REFERENCES `inventory_batches` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_user_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
