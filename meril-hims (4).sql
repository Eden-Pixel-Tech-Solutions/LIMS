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

--
-- Dumping data for table `inventory_payments`
--

INSERT INTO `inventory_payments` (`id`, `payment_number`, `vendor_id`, `invoice_id`, `amount`, `payment_method`, `reference_no`, `paid_by`, `paid_at`, `created_at`) VALUES
(1, 'PAY-20260430-001', 3, 3, 50000.00, 'CASH', '', 1, '2026-04-30 05:31:15', '2026-04-30 05:31:15'),
(2, 'PAY-20260502-001', 5, 2, 200000.00, 'BANK', '', 1, '2026-05-02 04:34:59', '2026-05-02 04:34:59');

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

--
-- Dumping data for table `inventory_po_items`
--

INSERT INTO `inventory_po_items` (`id`, `po_id`, `pr_item_id`, `item_id`, `quantity`, `unit_price`, `subtotal`) VALUES
(1, 1, 1, 1, 20, 12.00, 240.00),
(2, 2, 2, 1, 60, 12.00, 720.00),
(3, 3, 3, 8, 120, 120.00, 14400.00),
(4, 4, 4, 5, 120, 100.00, 12000.00);

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

--
-- Dumping data for table `inventory_pr_items`
--

INSERT INTO `inventory_pr_items` (`id`, `pr_id`, `item_id`, `quantity`, `remarks`) VALUES
(1, 2, 1, 20, ''),
(2, 3, 1, 60, ''),
(3, 4, 8, 120, ''),
(4, 5, 5, 120, '');

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

--
-- Dumping data for table `inventory_purchase_orders`
--

INSERT INTO `inventory_purchase_orders` (`id`, `po_number`, `vendor_id`, `status`, `expected_delivery_date`, `total_amount`, `created_by`, `created_at`, `updated_at`, `remarks`) VALUES
(1, 'PO-20260429-001', 4, 'DRAFT', '2026-05-01', 240.00, 1, '2026-04-29 12:37:58', '2026-04-29 12:37:58', NULL),
(2, 'PO-20260429-002', 4, 'DRAFT', '2026-05-09', 720.00, 1, '2026-04-29 13:41:48', '2026-04-29 13:41:48', NULL),
(3, 'PO-20260430-001', 5, 'DRAFT', '2026-05-08', 14400.00, 1, '2026-04-30 03:47:11', '2026-04-30 03:47:11', NULL),
(4, 'PO-20260502-001', 5, 'DRAFT', '2026-05-28', 12000.00, 1, '2026-05-02 04:35:59', '2026-05-02 04:35:59', NULL);

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

--
-- Dumping data for table `inventory_purchase_requisitions`
--

INSERT INTO `inventory_purchase_requisitions` (`id`, `pr_number`, `branch_id`, `status`, `requested_by`, `approved_by`, `created_at`, `updated_at`) VALUES
(2, 'PR-20260429-001', 1, 'PO_CREATED', 1, 1, '2026-04-29 12:37:42', '2026-04-29 12:37:58'),
(3, 'PR-20260429-002', 1, 'PO_CREATED', 1, 1, '2026-04-29 13:41:20', '2026-04-29 13:41:48'),
(4, 'PR-20260430-001', 1, 'PO_CREATED', 1, 1, '2026-04-30 03:46:55', '2026-04-30 03:47:11'),
(5, 'PR-20260502-001', 3, 'PO_CREATED', 1, 1, '2026-05-02 04:35:32', '2026-05-02 04:35:59');

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

--
-- Dumping data for table `inventory_stock_transfers`
--

INSERT INTO `inventory_stock_transfers` (`id`, `transfer_number`, `from_branch_id`, `to_branch_id`, `status`, `notes`, `created_by`, `approved_by`, `created_at`, `updated_at`) VALUES
(1, 'TRF-20260429-001', 1, 7, 'COMPLETED', '', 1, 1, '2026-04-29 12:40:43', '2026-04-29 12:46:04'),
(2, 'TRF-20260429-002', 1, 5, 'COMPLETED', '', 1, 1, '2026-04-29 13:42:41', '2026-04-29 13:43:19'),
(3, 'TRF-20260502-001', 1, 3, 'COMPLETED', '', 1, 1, '2026-05-02 04:38:06', '2026-05-02 04:38:26');

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

--
-- Dumping data for table `inventory_stock_transfer_items`
--

INSERT INTO `inventory_stock_transfer_items` (`id`, `transfer_id`, `item_id`, `batch_id`, `quantity`) VALUES
(1, 1, 1, 3, 120),
(2, 2, 1, 4, 40),
(3, 3, 8, 7, 200);

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

--
-- Dumping data for table `inventory_supplier_invoices`
--

INSERT INTO `inventory_supplier_invoices` (`id`, `invoice_number`, `vendor_id`, `po_id`, `grn_id`, `invoice_date`, `due_date`, `total_amount`, `paid_amount`, `status`, `created_at`, `updated_at`) VALUES
(1, 'IBV-20261212434', 4, NULL, NULL, '2026-04-17', '2026-05-23', 100000.00, 0.00, 'PENDING', '2026-04-30 05:29:58', '2026-04-30 05:29:58'),
(2, 'INV-12121212', 5, NULL, NULL, '2026-04-25', '2026-04-30', 200000.00, 200000.00, 'PAID', '2026-04-30 05:30:20', '2026-05-02 04:34:59'),
(3, 'IV-1292329', 3, NULL, NULL, '2026-04-30', '2026-05-02', 50000.00, 50000.00, 'PAID', '2026-04-30 05:31:04', '2026-04-30 05:31:15');

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

--
-- Dumping data for table `inventory_supplier_ledger`
--

INSERT INTO `inventory_supplier_ledger` (`id`, `vendor_id`, `type`, `reference_id`, `debit`, `credit`, `balance`, `created_at`) VALUES
(1, 4, 'INVOICE', 1, 100000.00, 0.00, 100000.00, '2026-04-30 05:29:58'),
(2, 5, 'INVOICE', 2, 200000.00, 0.00, 200000.00, '2026-04-30 05:30:20'),
(3, 3, 'INVOICE', 3, 50000.00, 0.00, 50000.00, '2026-04-30 05:31:04'),
(4, 3, 'PAYMENT', 1, 0.00, 50000.00, 0.00, '2026-04-30 05:31:15'),
(5, 5, 'PAYMENT', 2, 0.00, 200000.00, 0.00, '2026-05-02 04:34:59');

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

--
-- Dumping data for table `inventory_test_mapping`
--

INSERT INTO `inventory_test_mapping` (`id`, `test_id`, `item_id`, `quantity_required`) VALUES
(1, 4, 1, 5.00);

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

--
-- Dumping data for table `inventory_transactions`
--

INSERT INTO `inventory_transactions` (`id`, `item_id`, `batch_id`, `type`, `quantity`, `reference_type`, `reference_id`, `remarks`, `created_by`, `created_at`, `branch_id`, `test_id`) VALUES
(1, 1, 3, 'OUT', 120, 'Transfer', 'TRF-20260429-001', 'Dispatched transfer to other branch', 1, '2026-04-29 12:46:02', 1, NULL),
(2, 1, 5, 'IN', 120, 'Transfer', 'TRF-20260429-001', 'Received transfer from other branch', 1, '2026-04-29 12:46:04', 7, NULL),
(3, 1, 4, 'OUT', 40, 'Transfer', 'TRF-20260429-002', 'Dispatched transfer to other branch', 1, '2026-04-29 13:43:03', 1, NULL),
(4, 1, 6, 'IN', 40, 'Transfer', 'TRF-20260429-002', 'Received transfer from other branch', 1, '2026-04-29 13:43:19', 5, NULL),
(5, 8, 7, 'OUT', 200, 'Transfer', 'TRF-20260502-001', 'Dispatched transfer to other branch', 1, '2026-05-02 04:38:19', 1, NULL),
(6, 8, 8, 'IN', 200, 'Transfer', 'TRF-20260502-001', 'Received transfer from other branch', 1, '2026-05-02 04:38:26', 3, NULL);

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
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `serial_number` varchar(100) DEFAULT NULL,
  `interface_type` varchar(20) DEFAULT NULL,
  `port_ip` varchar(255) DEFAULT NULL,
  `baud_rate` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lab_machines`
--

INSERT INTO `lab_machines` (`id`, `lab_id`, `machine_id`, `name`, `model`, `manufacturer`, `status`, `created_at`, `updated_at`, `serial_number`, `interface_type`, `port_ip`, `baud_rate`) VALUES
(4, 8, 'ANAL-001', 'Semi Automatic Biochemistry Analyser', 'Merilyzer CliniQuant Micro', 'Meril', 'Active', '2026-04-30 03:14:40', '2026-04-30 03:14:40', NULL, NULL, NULL, NULL),
(5, 8, 'ANAL-002', '3 part Hematology Analyser', 'Merilyzer CelQuant Edge', 'Meril', 'Active', '2026-04-30 03:15:11', '2026-04-30 03:15:11', NULL, NULL, NULL, NULL),
(6, 8, 'ANAL-003', '5 Part Hematology Analyser', 'Merilyzer CelQuant 5 Plus', 'Meril', 'Active', '2026-04-30 03:15:37', '2026-04-30 03:15:37', NULL, NULL, NULL, NULL),
(7, 9, 'ANAL004', '5 Part Hematology Analyser', 'Merilyzer CelQuant 5 Plus', 'Meril', 'Active', '2026-04-30 03:16:03', '2026-04-30 03:16:03', NULL, NULL, NULL, NULL),
(8, 8, 'RANC-CH-MAC-8112', 'RANC-CH-MAC-8112', 'CliniQuant Micro', 'Meril', 'Active', '2026-05-03 13:35:46', '2026-05-03 13:35:46', 'Sn-1239', 'USB', '/dev/tty.usbserial-FTB6SPL3', 9600),
(9, 8, 'RANC-CH-MAC-9865', 'RANC-CH-MAC-9865', 'CliniQuant Micro', 'Meril', 'Active', '2026-05-03 13:40:06', '2026-05-03 13:40:06', 'Sn-12345', 'USB', '/dev/tty.usbserial-FTB6SPL3', 9600),
(10, 8, 'RANC-CH-MAC-3814', 'RANC-CH-MAC-3814', 'CelQuant Edge', 'Meril', 'Active', '2026-05-03 15:34:02', '2026-05-03 15:34:02', 'SN-C1234567890', 'USB', '/dev/tty.usbserial-FTB6SPL3', 115200);

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
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `analyzer_name` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lab_tests`
--

INSERT INTO `lab_tests` (`id`, `test_code`, `test_name`, `category_id`, `lab_id`, `sample_type`, `tube_color`, `storage_conditions`, `methodology`, `status`, `price`, `created_at`, `updated_at`, `analyzer_name`) VALUES
(1, 'KF', 'Kidney Function', 2, 8, 'Blood', 'Purple', '', '', 'Active', 120.00, '2026-05-03 14:30:51', '2026-05-03 14:30:51', 'CliniQuant Micro'),
(2, 'CBC', 'Complete Blood Cholestrol', 1, 8, 'Blood', 'Purple', '', '', 'Active', 1200.00, '2026-05-03 15:28:23', '2026-05-03 15:28:23', 'CelQuant Edge');

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
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `machine_parameter_code` varchar(100) DEFAULT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `lab_test_parameters`
--

INSERT INTO `lab_test_parameters` (`id`, `test_id`, `parameter_code`, `parameter_name`, `parameter_unit`, `result_type`, `min_value`, `max_value`, `men_min_value`, `men_max_value`, `women_min_value`, `women_max_value`, `kids_min_value`, `kids_max_value`, `use_demographic_ranges`, `display_order`, `is_calculated`, `formula`, `options`, `status`, `created_at`, `updated_at`, `machine_parameter_code`) VALUES
(1, 1, NULL, 'UREA', 'mg/dL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, NULL, NULL, 'Active', '2026-05-03 14:30:51', '2026-05-03 14:30:51', '12'),
(2, 1, NULL, 'URIC-ACID', 'mg/dL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, NULL, NULL, 'Active', '2026-05-03 14:30:51', '2026-05-03 14:30:51', '13'),
(3, 1, NULL, 'CREAT', 'mg/dL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 2, 0, NULL, NULL, 'Active', '2026-05-03 14:30:51', '2026-05-03 14:30:51', '19'),
(4, 2, NULL, 'WBC', '10^3/µL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '6690-2'),
(5, 2, NULL, 'RBC', '10^6/µL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '789-8'),
(6, 2, NULL, 'HGB', 'g/dL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 2, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '718-7'),
(7, 2, NULL, 'MCHC', 'g/dL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 3, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '786-4'),
(8, 2, NULL, 'MCH', 'pg', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 4, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '785-6'),
(9, 2, NULL, 'HCT', '%', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 5, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '4544-3'),
(10, 2, NULL, 'RDW-CV', '%', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 6, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '788-0'),
(11, 2, NULL, 'RDW-SD', 'fL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 7, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '70-5'),
(12, 2, NULL, 'PLT', '10^3/µL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 8, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '777-3'),
(13, 2, NULL, 'PCT', '%', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 9, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '10002'),
(14, 2, NULL, 'PDW', 'fL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 10, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '32207-3'),
(15, 2, NULL, 'MPV', 'fL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 11, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '32623-1'),
(16, 2, NULL, 'Lymph#', '10^3/µL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 12, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '731-0'),
(17, 2, NULL, 'Lymph%', '%', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 13, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '736-9'),
(18, 2, NULL, 'Mid#', '10^3/µL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 14, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '10027'),
(19, 2, NULL, 'Gran%', '%', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 15, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '10030'),
(20, 2, NULL, 'Gran#', '10^3/µL', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 16, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '10028'),
(21, 2, NULL, 'Mid%', '%', 'numeric', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 17, 0, NULL, NULL, 'Active', '2026-05-03 15:28:23', '2026-05-03 15:28:23', '10029');

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
(1, 2, 4, 'LAB-20260503-0001', 'RANC-CH-MAC-3814', NULL, 'CelQuant Edge', '[{\"unit\": \"10^9/L\", \"result_value\": \"0.0\", \"parameter_name\": \"WBC\", \"reference_range\": \"4.0-10.0\"}, {\"unit\": \"10^9/L\", \"result_value\": \"***.*\", \"parameter_name\": \"Lymph#\", \"reference_range\": \"0.6-4.1\"}, {\"unit\": \"10^9/L\", \"result_value\": \"***.*\", \"parameter_name\": \"Mid#\", \"reference_range\": \"0.1-1.8\"}, {\"unit\": \"10^9/L\", \"result_value\": \"***.*\", \"parameter_name\": \"Gran#\", \"reference_range\": \"2.0-7.8\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"Lymph%\", \"reference_range\": \"20.0-40.0\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"Mid%\", \"reference_range\": \"1.0-15.0\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"Gran%\", \"reference_range\": \"50.0-70.0\"}, {\"unit\": \"10^12/L\", \"result_value\": \"0.00\", \"parameter_name\": \"RBC\", \"reference_range\": \"3.50-5.50\"}, {\"unit\": \"g/dL\", \"result_value\": \"0.0\", \"parameter_name\": \"HGB\", \"reference_range\": \"11.0-16.0\"}, {\"unit\": \"%\", \"result_value\": \"0.0\", \"parameter_name\": \"HCT\", \"reference_range\": \"36.0-48.0\"}, {\"unit\": \"pg\", \"result_value\": \"***.*\", \"parameter_name\": \"MCH\", \"reference_range\": \"26.0-32.0\"}, {\"unit\": \"g/dL\", \"result_value\": \"0.0\", \"parameter_name\": \"MCHC\", \"reference_range\": \"32.0-36.0\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"RDW-CV\", \"reference_range\": \"11.5-14.5\"}, {\"unit\": \"10^9/L\", \"result_value\": \"0\", \"parameter_name\": \"PLT\", \"reference_range\": \"100-300\"}, {\"unit\": \"fL\", \"result_value\": \"**.*\", \"parameter_name\": \"MPV\", \"reference_range\": \"7.4-10.4\"}, {\"unit\": \"\", \"result_value\": \"**.*\", \"parameter_name\": \"PDW\", \"reference_range\": \"10.0-17.0\"}, {\"unit\": \"%\", \"result_value\": \"0.000\", \"parameter_name\": \"PCT\", \"reference_range\": \"0.100-0.280\"}]', NULL, 1, '2026-05-03 15:52:48', '2026-05-03 15:53:23', NULL, 'Approved', '2026-05-03 15:52:48', '2026-05-03 15:53:23', 1),
(2, 4, 1, 'LAB-20260503-0002', 'RANC-CH-MAC-3814', NULL, 'CelQuant Edge', '[{\"unit\": \"10^9/L\", \"result_value\": \"0.0\", \"parameter_name\": \"WBC\", \"reference_range\": \"4.0-10.0\"}, {\"unit\": \"10^9/L\", \"result_value\": \"***.*\", \"parameter_name\": \"Lymph#\", \"reference_range\": \"0.6-4.1\"}, {\"unit\": \"10^9/L\", \"result_value\": \"***.*\", \"parameter_name\": \"Mid#\", \"reference_range\": \"0.1-1.8\"}, {\"unit\": \"10^9/L\", \"result_value\": \"***.*\", \"parameter_name\": \"Gran#\", \"reference_range\": \"2.0-7.8\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"Lymph%\", \"reference_range\": \"20.0-40.0\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"Mid%\", \"reference_range\": \"1.0-15.0\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"Gran%\", \"reference_range\": \"50.0-70.0\"}, {\"unit\": \"10^12/L\", \"result_value\": \"0.00\", \"parameter_name\": \"RBC\", \"reference_range\": \"3.50-5.50\"}, {\"unit\": \"g/dL\", \"result_value\": \"0.0\", \"parameter_name\": \"HGB\", \"reference_range\": \"11.0-16.0\"}, {\"unit\": \"%\", \"result_value\": \"0.0\", \"parameter_name\": \"HCT\", \"reference_range\": \"36.0-48.0\"}, {\"unit\": \"pg\", \"result_value\": \"***.*\", \"parameter_name\": \"MCH\", \"reference_range\": \"26.0-32.0\"}, {\"unit\": \"g/dL\", \"result_value\": \"0.0\", \"parameter_name\": \"MCHC\", \"reference_range\": \"32.0-36.0\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"RDW-CV\", \"reference_range\": \"11.5-14.5\"}, {\"unit\": \"10^9/L\", \"result_value\": \"0\", \"parameter_name\": \"PLT\", \"reference_range\": \"100-300\"}, {\"unit\": \"fL\", \"result_value\": \"**.*\", \"parameter_name\": \"MPV\", \"reference_range\": \"7.4-10.4\"}, {\"unit\": \"\", \"result_value\": \"**.*\", \"parameter_name\": \"PDW\", \"reference_range\": \"10.0-17.0\"}, {\"unit\": \"%\", \"result_value\": \"0.000\", \"parameter_name\": \"PCT\", \"reference_range\": \"0.100-0.280\"}]', NULL, 1, '2026-05-03 15:57:05', '2026-05-03 15:57:40', NULL, 'Approved', '2026-05-03 15:57:04', '2026-05-03 15:57:40', 1),
(3, 6, 2, 'LAB-20260503-0003', 'RANC-CH-MAC-9865', NULL, 'URIC-ACID', '[{\"unit\": \"mg/dL\", \"result_value\": \"0.00\", \"parameter_name\": \"URIC-ACID\", \"reference_range\": \"2.50 - 7.20\"}]', NULL, NULL, '2026-05-03 16:04:35', NULL, NULL, 'Test Done', '2026-05-03 16:04:34', '2026-05-03 16:04:34', 1),
(4, 8, 3, 'LAB-20260504-0001', 'RANC-CH-MAC-9865', NULL, 'URIC-ACID', '[{\"unit\": \"mg/dL\", \"result_value\": \"0.00\", \"parameter_name\": \"UREA\", \"reference_range\": \"13.00 - 45.00\"}]', NULL, NULL, '2026-05-04 02:29:53', NULL, NULL, 'Test Done', '2026-05-04 02:25:52', '2026-05-04 02:29:53', 1),
(5, 10, 2, 'LAB-20260504-0002', 'RANC-CH-MAC-3814', NULL, 'CelQuant Edge', '[{\"unit\": \"10^9/L\", \"result_value\": \"0.0\", \"parameter_name\": \"WBC\", \"reference_range\": \"4.0-10.0\"}, {\"unit\": \"10^9/L\", \"result_value\": \"***.*\", \"parameter_name\": \"Lymph#\", \"reference_range\": \"0.6-4.1\"}, {\"unit\": \"10^9/L\", \"result_value\": \"***.*\", \"parameter_name\": \"Mid#\", \"reference_range\": \"0.1-1.8\"}, {\"unit\": \"10^9/L\", \"result_value\": \"***.*\", \"parameter_name\": \"Gran#\", \"reference_range\": \"2.0-7.8\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"Lymph%\", \"reference_range\": \"20.0-40.0\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"Mid%\", \"reference_range\": \"1.0-15.0\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"Gran%\", \"reference_range\": \"50.0-70.0\"}, {\"unit\": \"10^12/L\", \"result_value\": \"0.00\", \"parameter_name\": \"RBC\", \"reference_range\": \"3.50-5.50\"}, {\"unit\": \"g/dL\", \"result_value\": \"0.0\", \"parameter_name\": \"HGB\", \"reference_range\": \"11.0-16.0\"}, {\"unit\": \"%\", \"result_value\": \"0.0\", \"parameter_name\": \"HCT\", \"reference_range\": \"36.0-48.0\"}, {\"unit\": \"pg\", \"result_value\": \"***.*\", \"parameter_name\": \"MCH\", \"reference_range\": \"26.0-32.0\"}, {\"unit\": \"g/dL\", \"result_value\": \"0.0\", \"parameter_name\": \"MCHC\", \"reference_range\": \"32.0-36.0\"}, {\"unit\": \"%\", \"result_value\": \"***.*\", \"parameter_name\": \"RDW-CV\", \"reference_range\": \"11.5-14.5\"}, {\"unit\": \"10^9/L\", \"result_value\": \"0\", \"parameter_name\": \"PLT\", \"reference_range\": \"100-300\"}, {\"unit\": \"fL\", \"result_value\": \"**.*\", \"parameter_name\": \"MPV\", \"reference_range\": \"7.4-10.4\"}, {\"unit\": \"\", \"result_value\": \"**.*\", \"parameter_name\": \"PDW\", \"reference_range\": \"10.0-17.0\"}, {\"unit\": \"%\", \"result_value\": \"0.000\", \"parameter_name\": \"PCT\", \"reference_range\": \"0.100-0.280\"}]', NULL, 1, '2026-05-04 02:31:18', '2026-05-04 06:16:30', NULL, 'Approved', '2026-05-04 02:31:17', '2026-05-04 06:16:30', 1),
(6, 39, 5, 'LAB-20260504-0003', 'COM13', 1, 'Kidney Function', '[{\"unit\": \"mg/dL\", \"result_value\": \"0\", \"parameter_name\": \"UREA\", \"reference_range\": \"\"}, {\"unit\": \"mg/dL\", \"result_value\": \"0.00\", \"parameter_name\": \"URIC-ACID\", \"reference_range\": \"2.50 - 7.20\"}, {\"unit\": \"mg/dL\", \"result_value\": \"0\", \"parameter_name\": \"CREAT\", \"reference_range\": \"\"}]', NULL, NULL, '2026-05-04 19:00:46', NULL, NULL, 'Test Done', '2026-05-04 19:00:44', '2026-05-04 19:00:46', 1),
(7, 41, 5, 'LAB-20260504-0004', 'COM13', 1, 'Kidney Function', '[{\"unit\": \"mg/dL\", \"result_value\": \"0\", \"parameter_name\": \"UREA\", \"reference_range\": \"\"}, {\"unit\": \"mg/dL\", \"result_value\": \"0.00\", \"parameter_name\": \"URIC-ACID\", \"reference_range\": \"2.50 - 7.20\"}, {\"unit\": \"mg/dL\", \"result_value\": \"0\", \"parameter_name\": \"CREAT\", \"reference_range\": \"\"}]', NULL, NULL, '2026-05-04 19:14:12', NULL, NULL, 'Test Done', '2026-05-04 19:14:10', '2026-05-04 19:14:12', 1),
(8, 43, 4, 'LAB-20260504-0005', 'COM13', 1, 'Kidney Function', '[{\"unit\": \"mg/dL\", \"result_value\": \"0\", \"parameter_name\": \"UREA\", \"reference_range\": \"\"}, {\"unit\": \"mg/dL\", \"result_value\": \"0.00\", \"parameter_name\": \"URIC-ACID\", \"reference_range\": \"2.50 - 7.20\"}, {\"unit\": \"mg/dL\", \"result_value\": \"0\", \"parameter_name\": \"CREAT\", \"reference_range\": \"\"}]', NULL, 1, '2026-05-04 19:15:02', '2026-05-05 03:10:43', NULL, 'Approved', '2026-05-04 19:15:00', '2026-05-05 03:10:43', 1),
(9, 44, 3, 'LAB-20260504-0007', 'RANC-CH-MAC-9865', NULL, 'URIC-ACID', '[{\"unit\": \"mg/dL\", \"result_value\": \"0.00\", \"parameter_name\": \"URIC-ACID\", \"reference_range\": \"2.50 - 7.20\"}]', NULL, 1, '2026-05-04 20:58:45', '2026-05-05 09:24:30', NULL, 'Approved', '2026-05-04 20:58:44', '2026-05-05 09:24:30', 1),
(10, 47, 5, 'LAB-20260504-0008', 'RANC-CH-MAC-9865', NULL, 'URIC-ACID', '[{\"unit\": \"mg/dL\", \"result_value\": \"0.00\", \"parameter_name\": \"URIC-ACID\", \"reference_range\": \"2.50 - 7.20\"}]', NULL, 1, '2026-05-05 04:50:59', '2026-05-05 06:38:32', NULL, 'Approved', '2026-05-05 04:50:58', '2026-05-05 06:38:32', 1),
(11, 61, 6, 'LAB-20260505-0007', 'RANC-CH-MAC-9865', NULL, 'URIC-ACID', '[{\"unit\": \"mg/dL\", \"result_value\": \"0.00\", \"parameter_name\": \"URIC-ACID\", \"reference_range\": \"2.50 - 7.20\"}]', NULL, 1, '2026-05-05 07:41:17', '2026-05-05 07:41:51', NULL, 'Approved', '2026-05-05 07:41:16', '2026-05-05 07:41:51', 1);

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
(1, 'REG-38126', '2026-04-29', 0, NULL, '', 'Bhaskar', '', 'Sekar', '1979-06-25', 'Male', '0909 8787 7676', NULL, '', '', '', '', '', '', '', '8925386821', 0, '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', '', '', '', '2026-04-29 03:45:45', 1),
(2, 'REG-59523', '2026-04-29', 0, NULL, '', 'Sibyll', '', 'Dominic R', '2005-05-12', 'Male', NULL, NULL, '', '', '', '', '', '', '', '7810027381', 0, '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', '', '', '', '2026-04-29 03:46:28', 1),
(3, 'REG-18146', '2026-04-29', 0, NULL, '', 'Steve', '', 'Jerald', '2005-10-16', 'Male', '1234 4567 1234', NULL, '', '', '', '', '', '', '', '9025740156', 0, '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', '', '', '', '2026-04-29 03:46:57', 1),
(4, 'REG-33125', '2026-05-02', 0, NULL, '', 'Vasanth', '', 'Sandeep', '2005-12-07', 'Male', '9087 7861 1298', NULL, '', '', '', '', '', '', '', '9345995944', 0, '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', '', '', '', '2026-05-02 23:53:47', 1),
(5, 'REG-20190', '2026-05-03', 0, NULL, '', 'Sentil', '', 'paramesh', '1212-12-12', 'Male', '2324 3435 4546', NULL, '', '', '', '', '', '', '', '9952746925', 0, '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', '', '', '', '2026-05-03 00:06:16', 1),
(6, 'REG-58951', '2026-05-05', 0, NULL, 'Mr.', 'Gaurav', '', 'Aggarwal', '1982-07-22', 'Male', '234512120987', NULL, '', '', '', '', '', '', '', '9311863506', 0, '', '', '', '', '', 0, 0, '', '', '', '', '', '', '', '', '', '', '', '2026-05-05 06:34:24', 1);

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
(6, 'as', 'as', 'jewame2218@hacknapp.com', NULL, 'admin', 'emergency', NULL, '$2a$10$O.kJ8IhwIUWWhxB8FsEF2OnolxAbhsgAZnd6ZtWCKjPjrdlz/YXb2', '2026-04-29 11:50:07', 3, 'Sub-Central'),
(7, 'lab', 'tech', 'lab-tech@mail.com', NULL, 'lab_tech', 'emergency', NULL, '$2a$10$8KF7DpqmuSvgQUg76PNG6.ZnHO1HF8C.ufWwMWdcmd/U/9dT9DlMq', '2026-04-30 02:14:45', 1, 'Branch'),
(8, 'Lab', 'Doc', 'lab-doc@mail.com', NULL, 'lab_doctor', 'emergency', NULL, '$2a$10$Ui7bz/VFazJ46G9b3WX1s.r7llktHQtNNq2p9llHPKuTAWhbRcCMW', '2026-04-30 02:19:55', 1, 'Branch'),
(9, 'Recp', 'user', 'recp@mail.com', NULL, 'receptionist', 'emergency', NULL, '$2a$10$1pK39ZM9jdITBwv7IR7ryeGVxT0067bSOu9zArMAWE.UInOiJEmei', '2026-04-30 02:21:39', 1, 'Branch'),
(10, 'sam', 'issac', 'doc@mail.com', NULL, 'Doctor', 'Emergency', 'DOC-5271', 'password123', '2026-05-04 15:28:14', 1, 'Branch'),
(11, 'main', 'doc', 'hello@mail.com', NULL, 'Doctor', 'Cardiology', 'DOC-4839', 'password123', '2026-05-04 16:01:35', 1, 'Branch');

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
-- Indexes for table `consultations`
--
ALTER TABLE `consultations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `patient_reg_no` (`patient_reg_no`),
  ADD KEY `doctor_id` (`doctor_id`);

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
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `doctor_lab_orders`
--
ALTER TABLE `doctor_lab_orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `patient_reg_no` (`patient_reg_no`),
  ADD KEY `test_id` (`test_id`),
  ADD KEY `status` (`status`);

--
-- Indexes for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  ADD PRIMARY KEY (`id`);

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
  ADD KEY `fk_inventory_purchase_requisitions_branch_id_branches` (`branch_id`);

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
  ADD KEY `fk_inventory_stock_transfers_from_branch_id_branches` (`from_branch_id`),
  ADD KEY `fk_inventory_stock_transfers_to_branch_id_branches` (`to_branch_id`);

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
  ADD UNIQUE KEY `serial_number` (`serial_number`),
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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `bill_items`
--
ALTER TABLE `bill_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=62;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `consultations`
--
ALTER TABLE `consultations`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `doctor_lab_orders`
--
ALTER TABLE `doctor_lab_orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `doctor_schedules`
--
ALTER TABLE `doctor_schedules`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `inventory_items`
--
ALTER TABLE `inventory_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `inventory_item_master`
--
ALTER TABLE `inventory_item_master`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `inventory_payments`
--
ALTER TABLE `inventory_payments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `inventory_po_items`
--
ALTER TABLE `inventory_po_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `inventory_pr_items`
--
ALTER TABLE `inventory_pr_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `inventory_purchase_orders`
--
ALTER TABLE `inventory_purchase_orders`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `inventory_purchase_requisitions`
--
ALTER TABLE `inventory_purchase_requisitions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `inventory_stock_transfer_items`
--
ALTER TABLE `inventory_stock_transfer_items`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `inventory_supplier_invoices`
--
ALTER TABLE `inventory_supplier_invoices`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `inventory_supplier_ledger`
--
ALTER TABLE `inventory_supplier_ledger`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `inventory_test_mapping`
--
ALTER TABLE `inventory_test_mapping`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `inventory_transactions`
--
ALTER TABLE `inventory_transactions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `lab_categories`
--
ALTER TABLE `lab_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `lab_machines`
--
ALTER TABLE `lab_machines`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `lab_tests`
--
ALTER TABLE `lab_tests`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `lab_test_parameters`
--
ALTER TABLE `lab_test_parameters`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `lab_test_result`
--
ALTER TABLE `lab_test_result`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

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
  ADD CONSTRAINT `fk_inventory_batches_item` FOREIGN KEY (`item_id`) REFERENCES `inventory_item_master` (`id`) ON DELETE CASCADE,
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
  ADD CONSTRAINT `fk_inventory_purchase_requisitions_branch_id_branches` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT;

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
  ADD CONSTRAINT `fk_inventory_stock_department_id_branches` FOREIGN KEY (`department_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `inventory_stock_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_stock_transfers`
--
ALTER TABLE `inventory_stock_transfers`
  ADD CONSTRAINT `fk_inventory_stock_transfers_from_branch_id_branches` FOREIGN KEY (`from_branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_inventory_stock_transfers_to_branch_id_branches` FOREIGN KEY (`to_branch_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT;

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
  ADD CONSTRAINT `fk_lab_machines_infra` FOREIGN KEY (`lab_id`) REFERENCES `infrastructure` (`id`) ON DELETE CASCADE;

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
  ADD CONSTRAINT `fk_purchase_orders_delivery_location_branches` FOREIGN KEY (`delivery_location`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`pr_id`) REFERENCES `purchase_requisitions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `purchase_orders_ibfk_2` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT,
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
  ADD CONSTRAINT `fk_purchase_requisitions_department_id_branches` FOREIGN KEY (`department_id`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `purchase_requisitions_ibfk_1` FOREIGN KEY (`requested_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT;

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
  ADD CONSTRAINT `fk_stock_transfers_from_department_branches` FOREIGN KEY (`from_department`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
  ADD CONSTRAINT `fk_stock_transfers_to_department_branches` FOREIGN KEY (`to_department`) REFERENCES `branches` (`id`) ON DELETE RESTRICT,
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
