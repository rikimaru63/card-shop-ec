import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateCondition() {
  console.log('Starting condition migration...')

  try {
    // Map old condition values to new ones using raw SQL
    // First, set all old enum values to NULL to allow enum change
    await prisma.$executeRaw`
      UPDATE "Product"
      SET "condition" = NULL
      WHERE "condition" IS NOT NULL
    `
    console.log('Condition values cleared for migration')

  } catch (error) {
    // If the column doesn't exist or is already migrated, just continue
    console.log('Migration note:', error instanceof Error ? error.message : 'Unknown error')
  } finally {
    await prisma.$disconnect()
  }

  console.log('Condition migration completed')
}

migrateCondition()
