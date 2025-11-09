# Card Shop EC - International Trading Card Marketplace

## 🎴 Overview

A modern, high-performance e-commerce platform designed specifically for international trading card sales, optimized for the US market with plans for global expansion.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (or use Supabase/Neon for free hosting)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rikimaru63/card-shop-ec.git
cd card-shop-ec
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **State Management**: Zustand
- **Payment**: Wise API Integration
- **Search**: Algolia (planned)
- **Image Storage**: Cloudinary
- **Deployment**: Vercel

## 📦 Features

### Current Features
- ✅ Modern, responsive design
- ✅ Database schema for large-scale inventory
- ✅ Card-specific attributes (condition, rarity, grading)
- ✅ Multi-language support structure

### Planned Features
- 🔄 Product management system
- 🔄 Shopping cart & checkout
- 🔄 Wise payment integration
- 🔄 Admin dashboard
- 🔄 Advanced search & filtering
- 🔄 User accounts & wishlists
- 🔄 Inventory management
- 🔄 Price tracking
- 🔄 Multi-currency support

## 🗂️ Project Structure

```
card-shop-ec/
├── src/
│   ├── app/            # Next.js App Router pages
│   ├── components/     # React components
│   │   └── ui/        # Shadcn UI components
│   ├── lib/           # Utility functions
│   ├── hooks/         # Custom React hooks
│   ├── types/         # TypeScript type definitions
│   └── styles/        # Global styles
├── prisma/
│   └── schema.prisma  # Database schema
├── public/            # Static assets
└── package.json       # Dependencies
```

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frikimaru63%2Fcard-shop-ec&env=DATABASE_URL&envDescription=PostgreSQL%20connection%20string&envLink=https%3A%2F%2Fvercel.com%2Fdocs%2Fstores%2Fpostgres)

### Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth (when implemented)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret"

# Wise API (when implemented)
WISE_API_KEY="your-key"
WISE_PROFILE_ID="your-profile"

# Cloudinary (when implemented)
CLOUDINARY_CLOUD_NAME="your-name"
CLOUDINARY_API_KEY="your-key"
CLOUDINARY_API_SECRET="your-secret"
```

## 📊 Database Schema

The database is optimized for large-scale trading card inventory management with:
- Products with card-specific attributes
- Categories with hierarchical structure
- User management with role-based access
- Order & payment tracking
- Cart & wishlist functionality
- Review system

## 🔧 Development

### Database Commands
```bash
npx prisma studio     # Open Prisma Studio
npx prisma db push    # Push schema changes
npx prisma generate   # Generate Prisma Client
```

### Code Quality
```bash
npm run lint          # Run ESLint
npm run build         # Build for production
```

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Contact

For questions or support, please open an issue on GitHub.

---

Built with ❤️ for the trading card community