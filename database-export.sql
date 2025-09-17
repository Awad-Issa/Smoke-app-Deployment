-- MySQL Database Schema for Smoke Purchasing Platform
-- Generated from Prisma Schema

SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables if they exist
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `supermarkets`;
DROP TABLE IF EXISTS `supermarket_requests`;

-- Create supermarkets table
CREATE TABLE `supermarkets` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING', 'ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table
CREATE TABLE `users` (
  `id` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `role` ENUM('SUPER_ADMIN', 'DISTRIBUTOR', 'SUPERMARKET') NOT NULL,
  `supermarket_id` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_supermarket_id_fkey` (`supermarket_id`),
  CONSTRAINT `users_supermarket_id_fkey` FOREIGN KEY (`supermarket_id`) REFERENCES `supermarkets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create products table
CREATE TABLE `products` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `price` DOUBLE NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `distributor_id` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `image` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `products_distributor_id_fkey` (`distributor_id`),
  CONSTRAINT `products_distributor_id_fkey` FOREIGN KEY (`distributor_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create orders table
CREATE TABLE `orders` (
  `id` VARCHAR(191) NOT NULL,
  `supermarket_id` VARCHAR(191) NOT NULL,
  `distributor_id` VARCHAR(191) NOT NULL,
  `status` ENUM('PENDING', 'SHIPPED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `total` DOUBLE NOT NULL DEFAULT 0,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `orders_supermarket_id_fkey` (`supermarket_id`),
  CONSTRAINT `orders_supermarket_id_fkey` FOREIGN KEY (`supermarket_id`) REFERENCES `supermarkets` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create order_items table
CREATE TABLE `order_items` (
  `id` VARCHAR(191) NOT NULL,
  `order_id` VARCHAR(191) NOT NULL,
  `product_id` VARCHAR(191) NOT NULL,
  `quantity` INT NOT NULL,
  `price` DOUBLE NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_fkey` (`order_id`),
  KEY `order_items_product_id_fkey` (`product_id`),
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create supermarket_requests table (optional - for the old flow)
CREATE TABLE `supermarket_requests` (
  `id` VARCHAR(191) NOT NULL,
  `supermarket_name` VARCHAR(191) NOT NULL,
  `contact_email` VARCHAR(191) NOT NULL,
  `contact_phone` VARCHAR(191) NULL,
  `address` VARCHAR(191) NULL,
  `business_license` VARCHAR(191) NULL,
  `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  `notes` TEXT NULL,
  `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewed_at` DATETIME(3) NULL,
  `reviewed_by` VARCHAR(191) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Insert initial data
-- Super Admin User (password: admin123)
INSERT INTO `users` (`id`, `email`, `password`, `role`, `supermarket_id`, `created_at`, `updated_at`) VALUES
('admin-user-id-001', 'admin@smokeapp.com', '$2b$10$Yjajhzdz3LNumSJqPoXkiOAtpg/zjaQ.uyV0D7a0l3QaA6HmCkRom', 'SUPER_ADMIN', NULL, NOW(), NOW());

-- Distributor User (password: distributor123)
INSERT INTO `users` (`id`, `email`, `password`, `role`, `supermarket_id`, `created_at`, `updated_at`) VALUES
('distributor-user-id-001', 'distributor@smokeapp.com', '$2b$10$u2Xp0BvCry776E4Z/Bl8/.Vb/XozmVb7xmOJnOJQMZ9VvBxrv/DHe', 'DISTRIBUTOR', NULL, NOW(), NOW());

-- Sample Supermarket
INSERT INTO `supermarkets` (`id`, `name`, `status`, `created_at`, `updated_at`) VALUES
('sample-supermarket-id', 'Sample Supermarket', 'ACTIVE', NOW(), NOW());

-- Supermarket User (password: supermarket123)
INSERT INTO `users` (`id`, `email`, `password`, `role`, `supermarket_id`, `created_at`, `updated_at`) VALUES
('supermarket-user-id-001', 'supermarket@smokeapp.com', '$2b$10$uy71TGZZ.zAFG9.F0V9JgOdwQCySGhdAaRXt3ZbHAIvWaQO0b//Ja', 'SUPERMARKET', 'sample-supermarket-id', NOW(), NOW());

-- Sample Products
INSERT INTO `products` (`id`, `name`, `price`, `stock`, `distributor_id`, `description`, `image`, `created_at`, `updated_at`) VALUES
('product-001', 'Premium Cigarettes Pack', 12.99, 100, 'distributor-user-id-001', 'Premium quality cigarettes', NULL, NOW(), NOW()),
('product-002', 'Classic Cigarettes Pack', 10.50, 150, 'distributor-user-id-001', 'Classic cigarettes for everyday use', NULL, NOW(), NOW()),
('product-003', 'Light Cigarettes Pack', 9.25, 80, 'distributor-user-id-001', 'Light cigarettes with reduced tar', NULL, NOW(), NOW()),
('product-004', 'Menthol Cigarettes Pack', 10.00, 120, 'distributor-user-id-001', 'Refreshing menthol cigarettes', NULL, NOW(), NOW());
