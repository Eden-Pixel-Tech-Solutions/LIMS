-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: May 07, 2026 at 09:56 PM
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
(11, 'MAIN LAB', 'Lab', 'A', 2, NULL, 1, 'Available', '2026-05-07 21:43:42', 11),
(12, 'panimalar', 'Lab', '1', 2, NULL, 1, 'Available', '2026-05-07 21:44:33', 8),
(14, 'hello Lab', 'Lab', 'A WING', 0, NULL, 1, 'Available', '2026-05-07 21:46:17', 10),
(15, 'vanakam lab', 'Lab', 'A', 1, NULL, 1, 'Available', '2026-05-07 21:47:09', 9);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `infrastructure`
--
ALTER TABLE `infrastructure`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_infra_branch` (`branch_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `infrastructure`
--
ALTER TABLE `infrastructure`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `infrastructure`
--
ALTER TABLE `infrastructure`
  ADD CONSTRAINT `fk_infra_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
