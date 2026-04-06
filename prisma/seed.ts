import { PrismaClient } from '@prisma/client'
import { siteConfig } from '../src/lib/config/site'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  for (const cat of siteConfig.dbCategories) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
      },
    })
    console.log('Created category:', category.name)
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
