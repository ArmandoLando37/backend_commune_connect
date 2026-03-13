-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(500) NULL,
    `role` ENUM('ADMIN', 'MAIRE', 'ADJOINT_MAIRE', 'SECRETAIRE_COMMUNAL', 'ARCHIVISTE', 'ETAT_CIVIL', 'TRESORERIE', 'PERCEPTEUR', 'REGISSEUR') NOT NULL DEFAULT 'ETAT_CIVIL',
    `proposedRole` ENUM('ADMIN', 'MAIRE', 'ADJOINT_MAIRE', 'SECRETAIRE_COMMUNAL', 'ARCHIVISTE', 'ETAT_CIVIL', 'TRESORERIE', 'PERCEPTEUR', 'REGISSEUR') NULL,
    `status` ENUM('EN_ATTENTE', 'ACTIF', 'SUSPENDU', 'REJETE') NOT NULL DEFAULT 'EN_ATTENTE',
    `suspensionMotif` TEXT NULL,
    `suspensionFin` DATETIME(3) NULL,
    `emailVerifiedAt` DATETIME(3) NULL,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `objet` VARCHAR(300) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `fichier` VARCHAR(500) NULL,
    `tags` VARCHAR(500) NULL,
    `statut` ENUM('BROUILLON', 'SOUMIS', 'MODIFIE', 'ARCHIVE', 'SIGNALE') NOT NULL DEFAULT 'BROUILLON',
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `publishedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapport_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rapportId` INTEGER NOT NULL,
    `role` ENUM('ADMIN', 'MAIRE', 'ADJOINT_MAIRE', 'SECRETAIRE_COMMUNAL', 'ARCHIVISTE', 'ETAT_CIVIL', 'TRESORERIE', 'PERCEPTEUR', 'REGISSEUR') NOT NULL,

    UNIQUE INDEX `rapport_roles_rapportId_role_key`(`rapportId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapport_stars` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rapportId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rapport_stars_rapportId_userId_key`(`rapportId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapport_reads` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rapportId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `readAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rapport_reads_rapportId_userId_key`(`rapportId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapport_mentions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rapportId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `rapport_mentions_rapportId_userId_key`(`rapportId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapport_versions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rapportId` INTEGER NOT NULL,
    `objet` VARCHAR(300) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(100) NOT NULL,
    `notifiableId` INTEGER NOT NULL,
    `data` JSON NOT NULL,
    `readAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NULL,
    `action` VARCHAR(100) NOT NULL,
    `model` VARCHAR(100) NULL,
    `modelId` INTEGER NULL,
    `metadata` JSON NULL,
    `ipAddress` VARCHAR(45) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warnings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rapportId` INTEGER NOT NULL,
    `adminId` INTEGER NOT NULL,
    `message` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rapports` ADD CONSTRAINT `rapports_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapport_roles` ADD CONSTRAINT `rapport_roles_rapportId_fkey` FOREIGN KEY (`rapportId`) REFERENCES `rapports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapport_stars` ADD CONSTRAINT `rapport_stars_rapportId_fkey` FOREIGN KEY (`rapportId`) REFERENCES `rapports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapport_stars` ADD CONSTRAINT `rapport_stars_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapport_reads` ADD CONSTRAINT `rapport_reads_rapportId_fkey` FOREIGN KEY (`rapportId`) REFERENCES `rapports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapport_reads` ADD CONSTRAINT `rapport_reads_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapport_mentions` ADD CONSTRAINT `rapport_mentions_rapportId_fkey` FOREIGN KEY (`rapportId`) REFERENCES `rapports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapport_mentions` ADD CONSTRAINT `rapport_mentions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapport_versions` ADD CONSTRAINT `rapport_versions_rapportId_fkey` FOREIGN KEY (`rapportId`) REFERENCES `rapports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `rapport_versions` ADD CONSTRAINT `rapport_versions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_notifiableId_fkey` FOREIGN KEY (`notifiableId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warnings` ADD CONSTRAINT `warnings_rapportId_fkey` FOREIGN KEY (`rapportId`) REFERENCES `rapports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warnings` ADD CONSTRAINT `warnings_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
