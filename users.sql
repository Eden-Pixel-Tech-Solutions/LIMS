-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: localhost:8889
-- Generation Time: May 07, 2026 at 09:57 PM
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
(11, 'main', 'doc', 'hello@mail.com', NULL, 'Doctor', 'Cardiology', 'DOC-4839', 'password123', '2026-05-04 16:01:35', 1, 'Branch'),
(12, 'Kavya', 'Raman', 'kavya.raman.pallavaram.hr@testmail.com', NULL, 'receptionist', 'emergency', NULL, '$2a$10$MuwLtft3BWWKukgJpju88ufu1ChyYJ6GSosIT3UcWu/IhJcpnuxSK', '2026-05-07 21:18:01', 9, 'Branch'),
(13, 'Arvind', 'Rajan', 'arvind.rajan@knthgodda.in', NULL, 'receptionist', 'radiology', NULL, '$2a$10$GvREf7GcW0.Zv7giWUT9M.yHv1Tv9trmJMeOCbq/D9mkIoFd5ahVW', '2026-05-07 21:18:06', 10, 'Branch'),
(14, 'Priya', 'Sharma', 'priya.sharma.wsb@jhhealth.in', NULL, 'receptionist', 'cardiology', NULL, '$2a$10$4t8bX4B4fAK3LCeItnNDB.BOxeds8qR18aX9sbz5YcTNwVUusw252', '2026-05-07 21:18:08', 11, 'Branch'),
(15, 'Priya', 'Sharma', 'reception.anakaputhur@chc.test', NULL, 'receptionist', 'orthopedics', NULL, '$2a$10$26pCshXtm38P2ed6IY3YP.0dxp1Cay57muK.8dXEFj8xpHAmyk1ZS', '2026-05-07 21:18:16', 8, 'Branch'),
(16, 'ghjvh', 'bjb', 'labtech.anakaputhur@chc.test', NULL, 'lab_tech', 'administration', NULL, '$2a$10$VY0gDsGZoLFvPi74aCYrDumEdPs6unc6TiTpiyzblkdg2/oBgeFw6', '2026-05-07 21:28:21', 8, 'Branch'),
(17, 'bj', 'v', 'john@mail.com', NULL, 'lab_tech', 'orthopedics', NULL, '$2a$10$sYJBNQ/UUKhFX3wZ4iWQm.kydWU9fJ5k//Q7oSzpkoRvCDRECsXYu', '2026-05-07 21:30:28', 8, 'Branch'),
(18, 'Ravi', 'Kumar', 'ravi.kumar.lab.wsb@jhhealth.in', NULL, 'lab_tech', 'cardiology', NULL, '$2a$10$PkxOJAv4LwreckSLYAlNpeD.Kd7ccK8IfrkVN5NX8eYr6LLp8Z8SK', '2026-05-07 21:31:14', 11, 'Branch'),
(19, 'Priya', 'Kannan', 'priya.kannan@knthlab.in', NULL, 'lab_tech', 'radiology', NULL, '$2a$10$E2on7tuQn2GObrm7vulQ7OK3xDkj2bENkJZm0kJL47q0z/QPeNmTG', '2026-05-07 21:32:37', 10, 'Branch'),
(20, 'Pallavarm', 'Admin', 'pallavaram@ad,in.com', NULL, 'admin', 'emergency', NULL, '$2a$10$Z2gHer13KhFIm3Rt5d/Ri.zytcCRs3J7S.NE/6dXo3Uk7uW0/zDay', '2026-05-07 21:35:33', 9, 'Sub-Central'),
(21, 'SIBYLL', 'DOMINIC', 'avadi@admin.com', NULL, 'admin', 'cardiology', NULL, '$2a$10$y58A3ezDsqA9dDnHnoWtRuz.bb.EhNAZKj82MIV8iyVWx2T5qjJqu', '2026-05-07 21:35:49', 11, 'Sub-Central'),
(22, 'anagai', 'hha', 'anakaputhur@mail.com', NULL, 'admin', 'administration', NULL, '$2a$10$OULGl6ROSzOmPYJUV8biQOk9buzbh4Kcao8E9d8jHoB18SnLGA2nC', '2026-05-07 21:35:51', 8, 'Sub-Central'),
(23, 'pallavaram', 'admin', 'pallavaram@admin.com', NULL, 'admin', 'radiology', NULL, '$2a$10$dM8TJRiIeZfo8hXHySHLTuRyGSm4l/XPe/QSkIR6fV9HiX.Om9ePa', '2026-05-07 21:36:27', 9, 'Sub-Central'),
(24, 'Kumbakonam', 'Admin', 'kmb@admin.com', NULL, 'admin', 'radiology', NULL, '$2a$10$4xwPZsswT8RVxwuMrF8BSeyrKkNFo.xnrk46tq/UxyosmsC3HWzju', '2026-05-07 21:36:53', 10, 'Sub-Central');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_user_branch` (`branch_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_user_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
