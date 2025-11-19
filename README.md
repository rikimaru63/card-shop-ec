# CardShop - Premium Trading Cards E-Commerce Platform

## 🎴 Overview

A modern, full-featured e-commerce platform for trading cards built with Next.js 14, TypeScript, and Tailwind CSS. Optimized for the US market with plans for global expansion.

**🚀 Live Demo**: [https://card-shop-62huby7y3-ands-projects-f981bf46.vercel.app](https://card-shop-62huby7y3-ands-projects-f981bf46.vercel.app)

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
- **Styling**: Tailwind CSS + Shadcn/UI
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Payments**: Wise API (integration ready)
- **Image Optimization**: Next.js Image
- **Deployment**: Vercel

## ✨ Features

### Customer Features
- ✅ **Product Catalog**: Browse extensive trading card inventory with advanced filtering
- ✅ **Smart Search**: Real-time search with category and attribute filters
- ✅ **Shopping Cart**: Persistent cart with Zustand state management
- ✅ **Wishlist**: Save favorite items for later
- ✅ **Checkout**: Multi-step checkout process with Wise payment integration ready
- ✅ **User Authentication**: Secure sign-in with email/password or Google OAuth
- ✅ **Responsive Design**: Optimized for all device sizes
- ✅ **Modern UI**: Clean, white-based design with color psychology principles

### Admin Features
- ✅ **Dashboard**: Real-time statistics and insights
- ✅ **Product Management**: Add, edit, and manage inventory
- ✅ **Order Management**: Track and process orders
- ✅ **Stock Alerts**: Low inventory notifications
- ✅ **Analytics**: Sales and performance metrics

### Technical Features
- ✅ **Performance**: Optimized with Next.js Image and lazy loading
- ✅ **Authentication**: NextAuth.js with Supabase integration
- ✅ **Database**: PostgreSQL with Prisma ORM
- ✅ **SEO**: Complete meta tags and Schema.org structured data
- ✅ **State Management**: Zustand for cart and wishlist
- ✅ **UI Components**: Shadcn/UI component library

### Planned Features
- 🔄 Complete Wise payment integration
- 🔄 Email notification system  
- 🔄 Product review system
- 🔄 Multi-language support (Japanese)
- 🔄 Advanced analytics dashboard
- 🔄 Customer support chat

## 🗂️ Project Structure

```
card-shop-ec/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── cart/              # Shopping cart
│   │   ├── checkout/          # Checkout flow
│   │   ├── products/          # Product pages
│   │   ├── search/            # Search page
│   │   └── wishlist/          # Wishlist
│   ├── components/            # React components
│   │   ├── common/            # Shared components
│   │   ├── home/              # Homepage components
│   │   ├── layout/            # Layout components
│   │   ├── products/          # Product components
│   │   └── ui/                # Shadcn UI components
│   ├── lib/                   # Utilities
│   │   ├── supabase/          # Supabase clients
│   │   ├── prisma.ts          # Prisma client
│   │   ├── seo.ts             # SEO utilities
│   │   └── utils.ts           # Helper functions
│   ├── store/                 # Zustand stores
│   │   ├── cart-store.ts      # Cart state
│   │   └── wishlist-store.ts  # Wishlist state
│   └── styles/                # Global styles
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static assets
└── package.json
```

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Frikimaru63%2Fcard-shop-ec&env=DATABASE_URL&envDescription=PostgreSQL%20connection%20string&envLink=https%3A%2F%2Fvercel.com%2Fdocs%2Fstores%2Fpostgres)

### Environment Variables

Required environment variables for production:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="your-supabase-project-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-nextauth-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Wise API (when implemented)
WISE_API_KEY="your-wise-api-key"
WISE_PROFILE_ID="your-wise-profile-id"
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