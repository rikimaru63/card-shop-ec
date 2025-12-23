import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Pokemon Cards category
  const pokemonCategory = await prisma.category.upsert({
    where: { slug: 'pokemon-cards' },
    update: {},
    create: {
      name: 'ポケモンカード',
      slug: 'pokemon-cards',
      description: 'ポケモンカードゲームのシングルカード、BOX、パックなど',
    },
  })
  console.log('Created category:', pokemonCategory.name)

  // Create One Piece Cards category
  const onepieceCategory = await prisma.category.upsert({
    where: { slug: 'onepiece-cards' },
    update: {},
    create: {
      name: 'ワンピースカード',
      slug: 'onepiece-cards',
      description: 'ワンピースカードゲームのシングルカード、BOX、パックなど',
    },
  })
  console.log('Created category:', onepieceCategory.name)

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
