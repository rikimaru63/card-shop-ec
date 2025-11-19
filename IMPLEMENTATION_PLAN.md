# Implementation Plan - Pokemon Card Shop Backend

**Date**: 2025-11-19  
**Objective**: Implement missing backend functionality for production readiness

---

## 📋 Overview

### Current State
- ✅ Frontend fully functional (cart, wishlist, UI)
- ✅ Prisma schema designed and pushed to Supabase
- ✅ NextAuth authentication configured
- ❌ No API routes for product CRUD
- ❌ Using mock data on frontend
- ❌ CSV import not functional
- ❌ No i18n implementation

### Target State
- ✅ Full CRUD API for products
- ✅ Homepage loads products from Supabase
- ✅ Admin can add/edit/delete products
- ✅ CSV bulk import working
- ✅ Multi-language support (EN/JP)

---

## 🏗️ Architecture Design

### 1. API Layer Structure

```
src/app/api/
├── products/
│   ├── route.ts              # GET all, POST create
│   └── [id]/
│       └── route.ts          # GET, PUT, DELETE single
├── admin/
│   └── products/
│       ├── route.ts          # Admin product management
│       └── import/
│           └── route.ts      # CSV bulk import
└── categories/
    └── route.ts              # GET categories
```

### 2. Data Flow

```
┌─────────────┐
│  Frontend   │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─ GET /api/products → Fetch all products
       ├─ GET /api/products/[id] → Fetch single product
       ├─ POST /api/admin/products → Create product
       ├─ PUT /api/admin/products/[id] → Update product
       ├─ DELETE /api/admin/products/[id] → Delete product
       └─ POST /api/admin/products/import → CSV import
       │
       ▼
┌─────────────┐
│  Prisma     │
│  Client     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Supabase   │
│ PostgreSQL  │
└─────────────┘
```

### 3. Database Schema (Existing)

**Product Model** - Key fields:
- `id`: Primary key (cuid)
- `sku`: Unique identifier
- `name`: Product name (English)
- `nameJa`: Japanese name
- `cardSet`: Pokemon set name
- `cardNumber`: Card number in set
- `rarity`: Enum (COMMON, RARE, SUPER_RARE, etc.)
- `condition`: Enum (MINT, NEAR_MINT, etc.)
- `price`: Decimal (Money type)
- `stock`: Integer
- `categoryId`: Foreign key to Category
- `language`: Default "EN"
- `foil`, `firstEdition`, `graded`: Booleans
- `gradingCompany`, `grade`: Optional strings

**Category Model**:
- `id`, `name`, `slug`
- Self-referential for parent/child categories

---

## 🎯 Implementation Tasks

### Phase 1: Product API (Core)
**Priority**: P0 - Critical  
**Time Estimate**: 2 hours

#### Task 1.1: GET /api/products
**File**: `src/app/api/products/route.ts`

**Algorithm**:
```typescript
1. Parse query parameters:
   - page (default: 1)
   - limit (default: 12)
   - category (optional)
   - rarity (optional filter)
   - condition (optional filter)
   - search (optional text search)
   - minPrice, maxPrice (optional range)
   - sortBy (newest, price-asc, price-desc)

2. Build Prisma query:
   - where: { published: true }
   - Apply filters from query params
   - Include: category, images (first image only)
   - orderBy: based on sortBy param
   - skip: (page - 1) * limit
   - take: limit

3. Execute parallel queries:
   - products = await prisma.product.findMany(...)
   - total = await prisma.product.count({ where: ... })

4. Return JSON:
   {
     products: [...],
     pagination: {
       page, limit, total,
       totalPages: Math.ceil(total / limit)
     }
   }

5. Error handling:
   - Try/catch with 500 status
   - Log errors for debugging
```

**Response Format**:
```typescript
{
  products: [
    {
      id: string,
      name: string,
      nameJa?: string,
      cardSet: string,
      cardNumber: string,
      rarity: string,
      condition: string,
      price: number,
      stock: number,
      image: string, // First image URL or placeholder
      category: { name: string }
    }
  ],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

#### Task 1.2: GET /api/products/[id]
**File**: `src/app/api/products/[id]/route.ts`

**Algorithm**:
```typescript
1. Extract id from params
2. Query Prisma:
   - findUnique({ where: { id } })
   - include: { category, images, reviews }
3. If not found → 404
4. Calculate avgRating from reviews
5. Return product with metadata
```

#### Task 1.3: POST /api/admin/products
**File**: `src/app/api/admin/products/route.ts`

**Algorithm**:
```typescript
1. Check authentication:
   - const session = await getServerSession()
   - if (!session || role !== ADMIN) → 401

2. Validate request body:
   - name (required)
   - price (required, > 0)
   - stock (required, >= 0)
   - categoryId (required, exists in DB)
   - Generate slug from name
   - Generate unique SKU

3. Create product:
   - await prisma.product.create({
       data: {
         ...validatedData,
         slug: generateSlug(name),
         sku: generateSKU(cardSet, cardNumber)
       }
     })

4. Return 201 with created product
```

**SKU Generation Logic**:
```typescript
function generateSKU(cardSet: string, cardNumber?: string): string {
  const setCode = cardSet
    .substring(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  
  const num = cardNumber || Date.now().toString().slice(-6)
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  
  return `PKM-${setCode}-${num}-${random}`
}

// Example: PKM-SCA-025-A3F
```

---

### Phase 2: Admin CRUD Operations
**Priority**: P0 - Critical  
**Time Estimate**: 1.5 hours

#### Task 2.1: PUT /api/admin/products/[id]
**Algorithm**:
```typescript
1. Verify admin authentication
2. Validate id exists
3. Validate update data (partial schema)
4. Update product:
   - await prisma.product.update({
       where: { id },
       data: validatedData
     })
5. Return 200 with updated product
```

#### Task 2.2: DELETE /api/admin/products/[id]
**Algorithm**:
```typescript
1. Verify admin authentication
2. Check if product exists
3. Check if product is in any active orders
   - If yes → Return 409 Conflict
   - Suggest marking as unpublished instead
4. Delete product:
   - await prisma.product.delete({ where: { id } })
   - Cascade deletes: images, tags (via schema)
5. Return 204 No Content
```

---

### Phase 3: CSV Bulk Import
**Priority**: P1 - High  
**Time Estimate**: 2 hours

#### Task 3.1: POST /api/admin/products/import
**File**: `src/app/api/admin/products/import/route.ts`

**Algorithm**:
```typescript
1. Verify admin authentication

2. Parse CSV file:
   - Use library: papaparse or csv-parse
   - Expected columns:
     * name, nameJa, cardSet, cardNumber
     * rarity, condition, price, stock
     * language, foil, firstEdition
     * graded, gradingCompany, grade
     * description

3. Validate each row:
   - Required fields present
   - Price is valid number
   - Stock is valid integer
   - Rarity/Condition match enum values

4. Check for duplicates:
   - Query existing SKUs
   - Generate unique SKUs for new products

5. Batch insert:
   - Use prisma.product.createMany()
   - OR loop with transaction for better error handling
   
6. Return result:
   {
     success: true,
     imported: 45,
     failed: 2,
     errors: [
       { row: 23, error: "Invalid price" },
       { row: 47, error: "Missing card set" }
     ]
   }
```

**CSV Template Format**:
```csv
name,nameJa,cardSet,cardNumber,rarity,condition,price,stock,language,foil,firstEdition,graded,gradingCompany,grade,description
Pikachu ex,ピカチュウex,Scarlet ex,025/165,RR,MINT,1500,10,EN,false,false,false,,,Electric-type Pokemon card
Charizard ex SAR,リザードンex SAR,Violet ex,006/078,SAR,MINT,15000,1,JP,true,false,true,PSA,10,Rare special art
```

#### Task 3.2: Update CSV Import Page
**File**: `src/app/admin/products/import/page.tsx`

**Changes**:
```typescript
1. Add actual file upload handling:
   - const formData = new FormData()
   - formData.append('file', selectedFile)

2. POST to /api/admin/products/import

3. Display results:
   - Success count
   - Failed count
   - Error list with row numbers

4. Download error CSV:
   - Filter failed rows
   - Create downloadable CSV with error column
```

---

### Phase 4: Frontend Integration
**Priority**: P0 - Critical  
**Time Estimate**: 1.5 hours

#### Task 4.1: Update Homepage Product Grid
**File**: `src/components/home/product-grid.tsx`

**Changes**:
```typescript
1. Replace mockProducts with API fetch:

useEffect(() => {
  async function fetchProducts() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy: sortBy,
        ...appliedFilters
      })
      
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      
      setProducts(data.products)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }
  
  fetchProducts()
}, [currentPage, sortBy, appliedFilters])

2. Add loading state:
   - Skeleton cards while loading
   - Error state if fetch fails

3. Wire up pagination:
   - Update currentPage on button click
   - Use pagination.totalPages from API

4. Wire up filters:
   - Apply filters triggers new fetch
```

#### Task 4.2: Update Product Detail Page
**File**: `src/app/products/[id]/page.tsx`

**Changes**:
```typescript
1. Fetch single product:
   const product = await fetch(`/api/products/${params.id}`)

2. Display all product details:
   - Full description
   - All images (carousel)
   - Reviews section
   - Related products

3. Add to cart integration:
   - Already have useCartStore hook
   - Just needs real product data
```

#### Task 4.3: Update Admin Product List
**File**: `src/app/admin/products/page.tsx`

**Changes**:
```typescript
1. Fetch products from API:
   - GET /api/admin/products
   - Include unpublished products

2. Implement delete:
   - DELETE /api/admin/products/[id]
   - Confirm dialog
   - Refresh list after delete

3. Implement edit:
   - Navigate to /admin/products/edit/[id]
   - Pre-populate form with existing data
```

#### Task 4.4: Update Admin New Product Form
**File**: `src/app/admin/products/new/page.tsx`

**Changes**:
```typescript
1. Update handleSubmit to use real API:
   - Already POSTs to /api/admin/products
   - Just needs API to exist

2. Add image upload:
   - File input for images
   - Upload to Supabase Storage
   - Store URLs in ProductImage table

3. Add validation:
   - Client-side validation before submit
   - Display server errors

4. Add success/error toast:
   - Show confirmation on success
   - Display errors clearly
```

---

### Phase 5: Internationalization (i18n)
**Priority**: P1 - High  
**Time Estimate**: 3 hours

#### Task 5.1: Install next-intl
```bash
npm install next-intl
```

#### Task 5.2: Setup i18n Configuration
**File**: `src/i18n/request.ts`

```typescript
import { getRequestConfig } from 'next-intl/server'
 
export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../../messages/${locale}.json`)).default
}))
```

#### Task 5.3: Create Translation Files
**Files**: 
- `messages/en.json`
- `messages/ja.json`

**Structure**:
```json
{
  "common": {
    "addToCart": "Add to Cart",
    "addToWishlist": "Add to Wishlist",
    "price": "Price",
    "stock": "In Stock"
  },
  "product": {
    "rarity": "Rarity",
    "condition": "Condition",
    "cardSet": "Card Set",
    "cardNumber": "Card Number"
  },
  "admin": {
    "addProduct": "Add Product",
    "editProduct": "Edit Product",
    "deleteProduct": "Delete Product"
  }
}
```

#### Task 5.4: Update Middleware
**File**: `src/middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware'
 
export default createMiddleware({
  locales: ['en', 'ja'],
  defaultLocale: 'en'
})
 
export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

#### Task 5.5: Update Components
**Pattern**:
```typescript
import { useTranslations } from 'next-intl'

function Component() {
  const t = useTranslations('product')
  
  return <button>{t('addToCart')}</button>
}
```

---

## 🗄️ Database Initialization

### Task 6: Seed Initial Data

**File**: `prisma/seed.ts`

```typescript
import { PrismaClient, Rarity, Condition } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Create Pokemon Cards category
  const pokemonCategory = await prisma.category.upsert({
    where: { slug: 'pokemon-cards' },
    update: {},
    create: {
      name: 'Pokemon Cards',
      slug: 'pokemon-cards',
      description: 'Trading card game cards'
    }
  })

  // 2. Create subcategories
  const subcategories = [
    { name: 'Booster Packs', slug: 'booster-packs' },
    { name: 'Single Cards', slug: 'single-cards' },
    { name: 'Graded Cards', slug: 'graded-cards' },
    { name: 'Promo Cards', slug: 'promo-cards' }
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

  // 3. Create sample products (12 from mock data)
  const sampleProducts = [
    {
      sku: 'PKM-SCA-025-A3F',
      name: 'Pikachu ex',
      nameJa: 'ピカチュウex',
      slug: 'pikachu-ex-scarlet-025',
      cardSet: 'Scarlet ex',
      cardNumber: '025/165',
      rarity: Rarity.RARE,
      condition: Condition.NEAR_MINT,
      price: 1500,
      stock: 10,
      language: 'EN',
      categoryId: pokemonCategory.id
    },
    // ... (add all 12 products)
  ]

  for (const product of sampleProducts) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product
    })
  }

  console.log('✅ Database seeded successfully')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

**Run seed**:
```bash
npx prisma db seed
```

---

## 📦 Required Dependencies

```json
{
  "dependencies": {
    "papaparse": "^5.4.1",
    "next-intl": "^3.4.0"
  },
  "devDependencies": {
    "@types/papaparse": "^5.3.14"
  }
}
```

---

## ✅ Implementation Checklist

### Phase 1: Core API (P0)
- [ ] Create `/api/products` route (GET all)
- [ ] Create `/api/products/[id]` route (GET single)
- [ ] Create `/api/admin/products` route (POST create)
- [ ] Test API with Postman/curl
- [ ] Update frontend to use real API

### Phase 2: Admin CRUD (P0)
- [ ] Implement PUT `/api/admin/products/[id]`
- [ ] Implement DELETE `/api/admin/products/[id]`
- [ ] Update admin product list page
- [ ] Update admin new product form
- [ ] Create admin edit product form

### Phase 3: CSV Import (P1)
- [ ] Install papaparse
- [ ] Create `/api/admin/products/import` route
- [ ] Update CSV import page UI
- [ ] Test with sample CSV file
- [ ] Add error handling and reporting

### Phase 4: Frontend Integration (P0)
- [ ] Update homepage product grid
- [ ] Add loading/error states
- [ ] Wire up filters and pagination
- [ ] Update product detail page
- [ ] Test cart/wishlist with real data

### Phase 5: i18n (P1)
- [ ] Install next-intl
- [ ] Create translation files (en.json, ja.json)
- [ ] Setup middleware
- [ ] Update all components with useTranslations
- [ ] Test language switching

### Phase 6: Database (P0)
- [ ] Create seed script
- [ ] Run seed to populate initial data
- [ ] Verify data in Supabase dashboard
- [ ] Test queries in Prisma Studio

---

## 🧪 Testing Strategy

### Unit Tests
- API route handlers (Jest + Supertest)
- Utility functions (SKU generation, slug generation)
- Validation logic

### Integration Tests
- Full CRUD cycle for products
- CSV import with various file formats
- Authentication/authorization checks

### E2E Tests
- User adds product to cart
- Admin creates/edits/deletes product
- Admin imports CSV file
- Language switching

---

## 🚀 Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Database migrated in production
- [ ] Seed data loaded
- [ ] API routes tested in production
- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring (Vercel Analytics)

---

## 📊 Success Metrics

1. **API Performance**
   - GET /api/products < 300ms
   - POST /api/admin/products < 500ms
   - CSV import 100 products < 5s

2. **User Experience**
   - Homepage load < 2s
   - Product detail page < 1.5s
   - Add to cart instant feedback

3. **Admin Efficiency**
   - Add single product < 1 min
   - Import 100 products < 2 min
   - Edit product < 30s

---

## 🔄 Implementation Order

```
Day 1 (4-5 hours):
1. Phase 1: Product API routes
2. Phase 6: Database seeding
3. Phase 4.1: Update homepage

Day 2 (4-5 hours):
4. Phase 2: Admin CRUD operations
5. Phase 4.3-4.4: Admin UI integration
6. Phase 3: CSV Import

Day 3 (3-4 hours):
7. Phase 5: i18n implementation
8. Testing and bug fixes
9. Documentation and deployment
```

---

**Total Estimated Time**: 11-14 hours  
**Recommended Approach**: Implement in order, test each phase before moving to next

