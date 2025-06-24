# Finance Tracker

A comprehensive personal and family finance management application built with Next.js 15, featuring mobile-first design, real-time collaboration, and intelligent financial insights.

## 🌟 Features

### 💰 Core Financial Management
- **Transaction Tracking**: Quick expense and income entry with smart categorization
- **Category Management**: Customizable categories with business/personal separation
- **Budget Management**: Monthly, weekly, and yearly budgets with real-time alerts
- **Goal Tracking**: Savings goals, debt payoff plans, and spending limits with progress visualization
- **Data Export**: PDF reports and CSV exports for tax preparation and analysis

### 👨‍👩‍👧‍👦 Family Collaboration
- **Family Groups**: Shared financial management for households
- **Role-Based Permissions**: Admin, member, and viewer access levels
- **Shared Budgets**: Collaborative budget planning and tracking
- **Family Dashboard**: Consolidated financial overview for all family members

### 📱 Mobile-First Experience
- **Responsive Design**: Optimized for mobile devices with touch-friendly interface
- **Quick Entry**: Floating action button for rapid transaction logging
- **Voice Input**: Speech-to-text for transaction descriptions
- **Offline Support**: Works seamlessly without internet connection

### 🤖 Smart Features
- **AI-Powered Categorization**: Automatic transaction categorization
- **Duplicate Detection**: Intelligent duplicate transaction identification
- **Budget Alerts**: Proactive spending notifications and warnings
- **Smart Suggestions**: Category and merchant auto-completion

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with mobile-first approach
- **UI Components**: Radix UI with shadcn/ui components
- **State Management**: React Context API with SWR for server state
- **TypeScript**: Strict type checking with comprehensive interfaces

### Backend & Database
- **Database**: PostgreSQL with Supabase integration
- **Caching**: Redis with Upstash for performance optimization
- **Authentication**: Clerk for secure user management
- **API**: RESTful API routes with Next.js App Router

### Development & Testing
- **Package Manager**: pnpm for fast, efficient dependency management
- **Testing**: Jest with React Testing Library (270+ tests, 85%+ coverage)
- **Linting**: ESLint with strict TypeScript configuration
- **CI/CD**: GitHub Actions with automated testing and deployment

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- PostgreSQL database
- Redis instance (optional, for caching)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Manumac86/finance-tracker.git
   cd finance-tracker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/finance_tracker"
   
   # Authentication (Clerk)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
   CLERK_SECRET_KEY="sk_..."
   
   # Redis (optional)
   REDIS_URL="redis://localhost:6379"
   
   # Supabase (if using)
   NEXT_PUBLIC_SUPABASE_URL="https://..."
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   pnpm db:migrate
   
   # Seed with sample data (optional)
   pnpm db:seed
   ```

5. **Start Development Server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📋 Available Scripts

```bash
# Development
pnpm dev          # Start development server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript type checking

# Testing
pnpm test         # Run all tests
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Run tests with coverage report

# Database
pnpm db:migrate   # Run database migrations
pnpm db:seed      # Seed database with sample data
pnpm db:reset     # Reset database and reseed
```

## 🏗️ Architecture

### Database Design
- **PostgreSQL**: Primary database with JSONB for flexibility
- **Redis**: Caching layer for improved performance
- **Optimized Queries**: Proper indexing and query optimization

### Key Patterns
- **Mobile-First**: Responsive design prioritizing mobile experience
- **Real-Time Updates**: SWR for automatic data synchronization
- **Type Safety**: Comprehensive TypeScript coverage
- **Error Boundaries**: Graceful error handling throughout the app
- **Performance**: Optimized bundle sizes and lazy loading

## 🧪 Testing

The project maintains high test coverage with comprehensive testing strategies:

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint and data flow testing  
- **E2E Tests**: Critical user journey validation (planned)
- **Coverage**: 85%+ test coverage maintained

Run tests:
```bash
pnpm test                    # All tests
pnpm test:coverage          # With coverage report
pnpm test __tests__/budgets/ # Specific test directory
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
pnpm build
pnpm start
```

## 📱 Mobile Support

The application is optimized for mobile devices with:
- Touch-friendly interface design
- Quick transaction entry workflows
- Responsive layouts for all screen sizes
- Progressive Web App (PWA) capabilities (planned)

## 🔒 Security

- **Authentication**: Secure user management with Clerk
- **Authorization**: Role-based access control for family features
- **Data Protection**: Encrypted sensitive data storage
- **Input Validation**: Comprehensive client and server-side validation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, please open an issue on GitHub or contact the development team.

## 🗺️ Roadmap

See [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md) for detailed project roadmap and upcoming features.

### Upcoming Features
- **E2E Testing**: Comprehensive end-to-end testing with Playwright
- **Investment Tracking**: Portfolio management and net worth calculation
- **AI Insights**: Advanced financial analytics and recommendations
- **Bank Integration**: Automatic transaction import from financial institutions
- **Mobile App**: Native iOS and Android applications

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.