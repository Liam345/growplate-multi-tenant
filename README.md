# GrowPlate - Multi-Tenant Restaurant Management Platform

A modern, multi-tenant restaurant management platform built with Remix, TypeScript, and PostgreSQL.

## Features

- 🏢 **Multi-Tenant Architecture** - Each restaurant gets their own domain
- 🍽️ **Menu Management** - Full-featured menu creation and management
- 📱 **Order Management** - Real-time order processing and tracking
- 🎯 **Loyalty System** - Customer loyalty points and rewards
- 🔐 **Authentication** - JWT-based auth with role-based access
- 💳 **Payment Processing** - Stripe integration for secure payments
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS

## Tech Stack

### Frontend
- **Framework**: Remix (React + TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: Zustand

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with full-text search
- **Cache**: Redis
- **Authentication**: JWT with bcrypt
- **Payments**: Stripe

### Development
- **TypeScript**: Strict mode configuration
- **Testing**: Jest + Playwright
- **Code Quality**: ESLint + Prettier
- **Build**: Remix build system

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- Redis 6+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd growplate-multi-tenant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   # Create PostgreSQL database
   createdb growplate_dev
   
   # Run migrations (coming in TASK-002)
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Visit [http://localhost:3000](http://localhost:3000)

### Development Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm start               # Start production server

# Code Quality
npm run typecheck       # Run TypeScript checks
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues
npm run format          # Format with Prettier

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:e2e        # Run E2E tests
```

## Project Structure

```
app/
├── components/          # Reusable UI components
│   ├── ui/              # Basic components (Button, Input, etc.)
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── routes/              # Remix routes
│   ├── _index.tsx       # Homepage
│   ├── admin/           # Admin dashboard routes
│   ├── menu/            # Public menu routes
│   ├── order/           # Customer ordering routes
│   └── api/             # API resource routes
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── store/               # State management
├── styles/              # CSS files
└── types/               # TypeScript types
```

## Multi-Tenant Architecture

Each restaurant operates as a separate tenant with:
- **Domain-based routing**: `restaurant1.com`, `restaurant2.com`
- **Shared database**: Row-level tenant isolation
- **Feature flags**: Per-tenant feature configuration
- **Stripe Connect**: Multi-tenant payment processing

## Development Phases

- [x] **Phase 1**: Foundation & Tenant Management ← **Current**
- [ ] **Phase 2**: Menu Management System
- [ ] **Phase 3**: Order Management & Payments
- [ ] **Phase 4**: Loyalty System

## API Documentation

API documentation will be available at `/docs` once implemented.

## Contributing

1. Follow the TypeScript and ESLint configurations
2. Write tests for new features
3. Use conventional commit messages
4. Ensure all tests pass before submitting

## License

This project is proprietary software for restaurant management.

---

Built with ❤️ using Remix and modern web technologies.