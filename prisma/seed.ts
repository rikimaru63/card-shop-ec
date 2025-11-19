import { PrismaClient, Rarity, Condition } from '@prisma/client'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
config({ path: path.resolve(__dirname, '../.env.local') })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')
  
  // 1. Create Pokemon Cards category
  console.log('📁 Creating categories...')
  const pokemonCategory = await prisma.category.upsert({
    where: { slug: 'pokemon-cards' },
    update: {},
    create: {
      name: 'Pokemon Cards',
      slug: 'pokemon-cards',
      description: 'Pokemon Trading Card Game cards'
    }
  })
  console.log(`✅ Created category: ${pokemonCategory.name}`)
  
  // 2. Create subcategories
  const subcategories = [
    { name: 'Booster Packs', slug: 'booster-packs', description: 'Sealed booster packs' },
    { name: 'Single Cards', slug: 'single-cards', description: 'Individual trading cards' },
    { name: 'Graded Cards', slug: 'graded-cards', description: 'PSA/BGS graded cards' },
    { name: 'Promo Cards', slug: 'promo-cards', description: 'Promotional cards' }
  ]
  
  for (const sub of subcategories) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: {
        ...sub,
        parentId: pokemonCategory.id
      }
    })
  }
  console.log(`✅ Created ${subcategories.length} subcategories`)
  
  // 3. Create sample products (12 from mock data)
  console.log('🃏 Creating products...')
  
  const products = [
    {
      sku: 'PKM-SCA-025-PIK',
      name: 'Pikachu ex',
      nameJa: 'ピカチュウex',
      slug: 'pikachu-ex-scarlet-025',
      description: 'Electric-type Pokemon ex card from Scarlet ex set. Features stunning artwork and powerful attacks.',
      cardSet: 'Scarlet ex',
      cardNumber: '025/165',
      rarity: Rarity.RARE,
      condition: Condition.NEAR_MINT,
      price: 1500,
      stock: 10,
      language: 'EN',
      foil: false,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true,
      featured: true
    },
    {
      sku: 'PKM-VIO-006-CHA',
      name: 'Charizard ex SAR',
      nameJa: 'リザードンex SAR',
      slug: 'charizard-ex-sar-violet-006',
      description: 'Ultra rare Special Art Rare Charizard ex. One of the most sought-after cards from Violet ex set.',
      cardSet: 'Violet ex',
      cardNumber: '006/078',
      rarity: Rarity.SECRET_RARE,
      condition: Condition.MINT,
      price: 15000,
      stock: 1,
      language: 'JP',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true,
      featured: true
    },
    {
      sku: 'PKM-151-150-MEW',
      name: 'Mewtwo V SR',
      nameJa: 'ミュウツーV SR',
      slug: 'mewtwo-v-sr-151-150',
      description: 'Super Rare Mewtwo V from the Pokemon 151 set. Psychic-type legendary Pokemon.',
      cardSet: 'Pokemon 151',
      cardNumber: '150/165',
      rarity: Rarity.SUPER_RARE,
      condition: Condition.NEAR_MINT,
      price: 3000,
      stock: 5,
      language: 'EN',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true
    },
    {
      sku: 'PKM-151-196-ERI',
      name: "Erika's Invitation SAR",
      nameJa: 'エリカの招待 SAR',
      slug: 'erikas-invitation-sar-151-196',
      description: 'Highly collectible Special Art Rare supporter card featuring Erika. Essential for competitive play.',
      cardSet: 'Pokemon 151',
      cardNumber: '196/165',
      rarity: Rarity.SECRET_RARE,
      condition: Condition.MINT,
      price: 8500,
      stock: 3,
      language: 'JP',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true,
      featured: true
    },
    {
      sku: 'PKM-CLA-091-ION',
      name: 'Iono SAR',
      nameJa: 'ナンジャモ SAR',
      slug: 'iono-sar-clay-burst-091',
      description: 'Popular trainer card with beautiful special art. Meta staple for competitive decks.',
      cardSet: 'Clay Burst',
      cardNumber: '091/071',
      rarity: Rarity.SECRET_RARE,
      condition: Condition.NEAR_MINT,
      price: 12000,
      stock: 2,
      language: 'JP',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true,
      featured: true
    },
    {
      sku: 'PKM-PAR-110-LUG',
      name: 'Lugia V SR',
      nameJa: 'ルギアV SR',
      slug: 'lugia-v-sr-paradigm-trigger-110',
      description: 'Super Rare Lugia V from Paradigm Trigger. Powerful colorless-type Pokemon.',
      cardSet: 'Paradigm Trigger',
      cardNumber: '110/098',
      rarity: Rarity.SUPER_RARE,
      condition: Condition.NEAR_MINT,
      price: 2800,
      stock: 8,
      language: 'JP',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true
    },
    {
      sku: 'PKM-LOS-125-GIR',
      name: 'Giratina VSTAR UR',
      nameJa: 'ギラティナVSTAR UR',
      slug: 'giratina-vstar-ur-lost-abyss-125',
      description: 'Ultra Rare Giratina VSTAR with gold finish. Extremely collectible chase card.',
      cardSet: 'Lost Abyss',
      cardNumber: '125/100',
      rarity: Rarity.ULTRA_RARE,
      condition: Condition.MINT,
      price: 5500,
      stock: 4,
      language: 'JP',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true
    },
    {
      sku: 'PKM-AST-013-GRE',
      name: 'Radiant Greninja',
      nameJa: 'かがやくゲッコウガ',
      slug: 'radiant-greninja-astral-radiance-013',
      description: 'Radiant rare Greninja. Water-type with powerful ability.',
      cardSet: 'Astral Radiance',
      cardNumber: '013/100',
      rarity: Rarity.RARE,
      condition: Condition.NEAR_MINT,
      price: 800,
      stock: 15,
      language: 'EN',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true
    },
    {
      sku: 'PKM-151-205-MEW2',
      name: 'Mew ex SAR',
      nameJa: 'ミュウex SAR',
      slug: 'mew-ex-sar-151-205',
      description: 'Legendary psychic Pokemon with stunning special artwork. One of the crown jewels of Pokemon 151.',
      cardSet: 'Pokemon 151',
      cardNumber: '205/165',
      rarity: Rarity.SECRET_RARE,
      condition: Condition.MINT,
      price: 18000,
      stock: 1,
      language: 'JP',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true,
      featured: true
    },
    {
      sku: 'PKM-VIO-101-PEN',
      name: 'Penny SAR',
      nameJa: 'ボタン SAR',
      slug: 'penny-sar-violet-101',
      description: 'Popular trainer supporter card with beautiful character art.',
      cardSet: 'Violet ex',
      cardNumber: '101/078',
      rarity: Rarity.SECRET_RARE,
      condition: Condition.NEAR_MINT,
      price: 4500,
      stock: 6,
      language: 'JP',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true
    },
    {
      sku: 'PKM-SPA-073-ADA',
      name: 'Adaman SAR',
      nameJa: 'セキ SAR',
      slug: 'adaman-sar-space-juggler-073',
      description: 'Rare trainer card from Space Juggler set featuring Adaman character.',
      cardSet: 'Space Juggler',
      cardNumber: '073/067',
      rarity: Rarity.SECRET_RARE,
      condition: Condition.MINT,
      price: 9800,
      stock: 2,
      language: 'JP',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true
    },
    {
      sku: 'PKM-INC-081-SER',
      name: 'Serena SR',
      nameJa: 'セレナ SR',
      slug: 'serena-sr-incandescent-arcana-081',
      description: 'Super Rare trainer supporter card from Incandescent Arcana.',
      cardSet: 'Incandescent Arcana',
      cardNumber: '081/068',
      rarity: Rarity.SUPER_RARE,
      condition: Condition.NEAR_MINT,
      price: 6200,
      stock: 4,
      language: 'JP',
      foil: true,
      firstEdition: false,
      graded: false,
      categoryId: pokemonCategory.id,
      published: true
    }
  ]
  
  let createdCount = 0
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product
    })
    createdCount++
    console.log(`  ✓ Created: ${product.name} (${product.sku})`)
  }
  
  console.log(`\n✅ Successfully created ${createdCount} products`)
  console.log(`\n🎉 Database seed completed!`)
  console.log(`\n📊 Summary:`)
  console.log(`   - Categories: ${1 + subcategories.length}`)
  console.log(`   - Products: ${createdCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
