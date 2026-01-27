-- AlterTable
ALTER TABLE "Order" ADD COLUMN "customsFee" MONEY NOT NULL DEFAULT 0;

-- AlterTable (ensure tax has default value)
ALTER TABLE "Order" ALTER COLUMN "tax" SET DEFAULT 0;
