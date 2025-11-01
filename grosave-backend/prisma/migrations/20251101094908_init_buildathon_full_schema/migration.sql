/*
  Warnings:

  - You are about to alter the column `timeSlots` on the `pickup_locations` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `images` on the `products` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `nutritionInfo` on the `products` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `safetyInfo` on the `products` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.
  - You are about to alter the column `storageInfo` on the `products` table. The data in that column could be lost. The data in that column will be cast from `String` to `Json`.

*/
-- AlterTable
ALTER TABLE "wallets" ADD COLUMN "lastRefillAt" DATETIME;

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ip" TEXT,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OTPAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "HouseholdApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "aadhaarLast4" TEXT,
    "incomeRange" TEXT,
    "schoolGoingChildren" INTEGER NOT NULL DEFAULT 0,
    "address" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "rejectionReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HouseholdApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provider" TEXT,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "checksum" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "HouseholdApplication" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductPriceChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "previousPrice" INTEGER NOT NULL,
    "newPrice" INTEGER NOT NULL,
    "reason" TEXT,
    "scheduledAt" DATETIME,
    "effectiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductPriceChange_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PricingPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dropToPriceAtHoursBeforeExpiry" INTEGER NOT NULL DEFAULT 24,
    "freeAtHoursBeforeExpiry" INTEGER NOT NULL DEFAULT 6,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PickupSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pickupLocationId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "slot" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "reservedCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PickupSlot_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "pickup_locations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "byUserId" TEXT,
    "meta" JSONB,
    CONSTRAINT "OrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderEvent_byUserId_fkey" FOREIGN KEY ("byUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EarnEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "sourceId" TEXT,
    "meta" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EarnEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "language" TEXT,
    "notificationsOn" BOOLEAN NOT NULL DEFAULT true,
    "preferredHubs" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ImpactStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "month" DATETIME NOT NULL,
    "kgRescued" REAL NOT NULL DEFAULT 0,
    "co2SavedKg" REAL NOT NULL DEFAULT 0,
    "rupeesSaved" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ImpactStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "model" TEXT,
    "input" JSONB,
    "output" JSONB,
    "score" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "diff" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeatureFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "data" JSONB,
    "orderId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notifications_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_notifications" ("actionUrl", "createdAt", "id", "isRead", "message", "title", "type", "userId") SELECT "actionUrl", "createdAt", "id", "isRead", "message", "title", "type", "userId" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
CREATE INDEX "notifications_userId_isRead_createdAt_idx" ON "notifications"("userId", "isRead", "createdAt");
CREATE TABLE "new_orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "coinsSpent" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "pickupLocationId" TEXT NOT NULL,
    "pickupTimeSlot" TEXT NOT NULL,
    "pickupDate" DATETIME NOT NULL,
    "pickupSlotId" TEXT,
    "verificationCode" TEXT NOT NULL,
    "reservedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "scannedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "orders_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_pickupLocationId_fkey" FOREIGN KEY ("pickupLocationId") REFERENCES "pickup_locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_pickupSlotId_fkey" FOREIGN KEY ("pickupSlotId") REFERENCES "PickupSlot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_orders" ("cancelledAt", "coinsSpent", "completedAt", "createdAt", "id", "orderNumber", "pickupDate", "pickupLocationId", "pickupTimeSlot", "productId", "quantity", "reservedAt", "status", "updatedAt", "userId", "verificationCode") SELECT "cancelledAt", "coinsSpent", "completedAt", "createdAt", "id", "orderNumber", "pickupDate", "pickupLocationId", "pickupTimeSlot", "productId", "quantity", "reservedAt", "status", "updatedAt", "userId", "verificationCode" FROM "orders";
DROP TABLE "orders";
ALTER TABLE "new_orders" RENAME TO "orders";
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE UNIQUE INDEX "orders_verificationCode_key" ON "orders"("verificationCode");
CREATE INDEX "orders_userId_status_idx" ON "orders"("userId", "status");
CREATE INDEX "orders_pickupLocationId_pickupDate_idx" ON "orders"("pickupLocationId", "pickupDate");
CREATE TABLE "new_pickup_locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "timeSlots" JSONB
);
INSERT INTO "new_pickup_locations" ("address", "city", "createdAt", "id", "isActive", "latitude", "longitude", "name", "pincode", "timeSlots", "updatedAt") SELECT "address", "city", "createdAt", "id", "isActive", "latitude", "longitude", "name", "pincode", "timeSlots", "updatedAt" FROM "pickup_locations";
DROP TABLE "pickup_locations";
ALTER TABLE "new_pickup_locations" RENAME TO "pickup_locations";
CREATE INDEX "pickup_locations_city_idx" ON "pickup_locations"("city");
CREATE INDEX "pickup_locations_pincode_idx" ON "pickup_locations"("pincode");
CREATE TABLE "new_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "images" JSONB,
    "currentPrice" INTEGER NOT NULL,
    "originalPrice" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL,
    "expiryStatus" TEXT NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "unitsAvailable" INTEGER NOT NULL,
    "nutritionInfo" JSONB,
    "storageInfo" JSONB,
    "safetyInfo" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dynamicPricingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "dropToPriceAtHoursBeforeExpiry" INTEGER,
    "freeAtHoursBeforeExpiry" INTEGER
);
INSERT INTO "new_products" ("brand", "category", "createdAt", "currentPrice", "description", "discount", "expiryDate", "expiryStatus", "id", "image", "images", "isActive", "name", "nutritionInfo", "originalPrice", "safetyInfo", "storageInfo", "unitsAvailable", "updatedAt") SELECT "brand", "category", "createdAt", "currentPrice", "description", "discount", "expiryDate", "expiryStatus", "id", "image", "images", "isActive", "name", "nutritionInfo", "originalPrice", "safetyInfo", "storageInfo", "unitsAvailable", "updatedAt" FROM "products";
DROP TABLE "products";
ALTER TABLE "new_products" RENAME TO "products";
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE INDEX "products_expiryDate_idx" ON "products"("expiryDate");
CREATE TABLE "new_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "relatedOrderId" TEXT,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_relatedOrderId_fkey" FOREIGN KEY ("relatedOrderId") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_transactions" ("amount", "balanceAfter", "createdAt", "description", "id", "relatedOrderId", "type", "userId") SELECT "amount", "balanceAfter", "createdAt", "description", "id", "relatedOrderId", "type", "userId" FROM "transactions";
DROP TABLE "transactions";
ALTER TABLE "new_transactions" RENAME TO "transactions";
CREATE INDEX "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "aadhaarLast4" TEXT,
    "incomeRange" TEXT,
    "schoolGoingChildren" INTEGER NOT NULL DEFAULT 0,
    "address" TEXT,
    "city" TEXT,
    "pincode" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "eligibilityStatus" TEXT NOT NULL DEFAULT 'pending',
    "language" TEXT,
    "notificationPrefs" JSONB,
    "referralCode" TEXT,
    "invitedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("aadhaarLast4", "address", "city", "createdAt", "eligibilityStatus", "id", "incomeRange", "isVerified", "name", "phone", "pincode", "schoolGoingChildren", "updatedAt") SELECT "aadhaarLast4", "address", "city", "createdAt", "eligibilityStatus", "id", "incomeRange", "isVerified", "name", "phone", "pincode", "schoolGoingChildren", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE INDEX "OTPAttempt_phone_idx" ON "OTPAttempt"("phone");

-- CreateIndex
CREATE INDEX "ProductPriceChange_productId_effectiveAt_idx" ON "ProductPriceChange"("productId", "effectiveAt");

-- CreateIndex
CREATE INDEX "PickupSlot_pickupLocationId_date_idx" ON "PickupSlot"("pickupLocationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PickupSlot_pickupLocationId_date_slot_key" ON "PickupSlot"("pickupLocationId", "date", "slot");

-- CreateIndex
CREATE INDEX "OrderEvent_orderId_at_idx" ON "OrderEvent"("orderId", "at");

-- CreateIndex
CREATE INDEX "EarnEvent_userId_type_createdAt_idx" ON "EarnEvent"("userId", "type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ImpactStat_userId_month_key" ON "ImpactStat"("userId", "month");

-- CreateIndex
CREATE INDEX "AIEvent_userId_type_createdAt_idx" ON "AIEvent"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureFlag_key_key" ON "FeatureFlag"("key");

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");
