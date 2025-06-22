<div align="center">

# 🏃‍♂️ WellRun

**Run well, live well.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbryant24hao%2Fruntracker-pro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)

*A modern, intelligent running companion that transforms your fitness journey into measurable progress.*

[🚀 Live Demo](https://runtracker-pro.vercel.app/) • [📱 Mobile Test](https://runtracker-pro.vercel.app/mobile-test) • [🐛 Report Bug](https://github.com/bryant24hao/runtracker-pro/issues) • [💡 Request Feature](https://github.com/bryant24hao/runtracker-pro/issues)

</div>

---

## ✨ Features

### 🎯 **Smart Goal Management**
- Set personalized running targets (distance, time, frequency)
- Real-time progress tracking with visual analytics
- Intelligent goal recommendations based on your history

### 📊 **Comprehensive Activity Logging**
- Detailed run tracking (pace, distance, duration, location)
- Photo attachments for memorable routes
- Smart data recognition from screenshots and manual input

### 📱 **Mobile-First Experience**
- Native iOS-style interface for seamless mobile usage
- Progressive Web App (PWA) capabilities
- Responsive design that works on any device

### 🍎 **Apple Ecosystem Integration**
- Import workouts from Apple Health and Fitness
- Seamless data synchronization
- Native iOS app support via Capacitor

### 📈 **Powerful Analytics**
- Personal best tracking and achievements
- Trend analysis and performance insights
- Beautiful data visualizations

---

## 🖥️ Screenshots

<div align="center">

### 📱 Mobile Experience
| Dashboard | Goal Tracking | Activity Logging |
|-----------|---------------|------------------|
| ![Dashboard](https://via.placeholder.com/250x500/3b82f6/ffffff?text=Dashboard) | ![Goals](https://via.placeholder.com/250x500/10b981/ffffff?text=Goals) | ![Activities](https://via.placeholder.com/250x500/f59e0b/ffffff?text=Activities) |

### 💻 Desktop Experience
![Desktop View](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Desktop+Dashboard)

</div>

---

## 🚀 Quick Start

### 🐳 One-Click Deploy

Deploy WellRun to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fbryant24hao%2Fruntracker-pro)

### 💻 Local Development

```bash
# Clone the repository
git clone https://github.com/bryant24hao/runtracker-pro.git
cd runtracker-pro

# Install dependencies
npm install
# or
pnpm install
# or
yarn install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Framer Motion |
| **Database** | PostgreSQL (Neon), SQLite (local) |
| **Authentication** | NextAuth.js |
| **Deployment** | Vercel, Docker, Railway |
| **Mobile** | PWA, Capacitor (iOS) |

</div>

---

## 📱 Mobile Support

WellRun is designed mobile-first with specific optimizations for different platforms:

### iOS Safari
- Native iOS UI components and animations
- Optimized touch interactions
- PWA installation support

### Android Chrome
- Material Design influences
- Chrome Web App features
- Offline capability

### Debug Pages
- [Mobile Test Page](https://runtracker-pro.vercel.app/mobile-test) - Device compatibility check
- [Safari Test Page](https://runtracker-pro.vercel.app/safari-test) - iOS-specific debugging

---

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://user:password@host:port/database"

# NextAuth Configuration (if using authentication)
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"

# Optional: Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

### Database Setup

#### Option 1: Neon PostgreSQL (Recommended)

1. Sign up at [Neon](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

#### Option 2: Local SQLite

For development, simply set:
```env
DATABASE_URL="file:./local.db"
```

The app will automatically create and initialize the database.

---

## 🏗️ Architecture

```
wellrun/
├── 📱 app/                 # Next.js App Router
│   ├── 🔌 api/            # API routes
│   ├── 📄 page.tsx        # Main application
│   └── 🎨 layout.tsx      # Root layout
├── 🧩 components/         # React components
│   ├── 🎪 ui/             # Reusable UI components
│   ├── 📱 mobile-*.tsx    # Mobile-specific components
│   └── 🍎 apple-*.tsx     # Apple ecosystem integration
├── 🔧 lib/               # Utilities and configurations
├── 🗃️ scripts/           # Database migrations
└── 🎨 styles/            # Global styles
```

---

## 🔌 API Reference

### Goals API

```typescript
GET    /api/goals           # List all goals
POST   /api/goals           # Create a new goal
PUT    /api/goals/[id]      # Update a goal
DELETE /api/goals/[id]      # Delete a goal
```

### Activities API

```typescript
GET    /api/activities      # List all activities
POST   /api/activities      # Log a new activity
PUT    /api/activities/[id] # Update an activity
DELETE /api/activities/[id] # Delete an activity
```

### Statistics API

```typescript
GET    /api/stats           # Get comprehensive statistics
```

---

## 🤝 Contributing

We love contributions! Here's how you can help make WellRun even better:

### 🐛 Bug Reports

Found a bug? Please [open an issue](https://github.com/bryant24hao/runtracker-pro/issues) with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)

### 💡 Feature Requests

Have an idea? We'd love to hear it! [Open an issue](https://github.com/bryant24hao/runtracker-pro/issues) with:
- Clear description of the feature
- Use case and benefits
- Any implementation ideas

### 🔧 Development

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📋 Roadmap

- [ ] **Social Features** - Share runs and compete with friends
- [ ] **Advanced Analytics** - AI-powered training insights
- [ ] **Wearable Integration** - Garmin, Fitbit, and other devices
- [ ] **Nutrition Tracking** - Integrate meal planning
- [ ] **Training Plans** - Structured workout programs
- [ ] **Community Challenges** - Global and local competitions

---

## 🎯 Performance

WellRun is built for speed and efficiency:

- ⚡ **Lighthouse Score**: 95+ across all metrics
- 📱 **Mobile Optimized**: First-class mobile experience
- 🔄 **Real-time Updates**: Instant data synchronization
- 💾 **Offline Support**: Progressive Web App capabilities

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Design Inspiration**: Apple Health, Nike Run Club, Strava
- **UI Components**: [Radix UI](https://radix-ui.com), [Tailwind UI](https://tailwindui.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Hosting**: [Vercel](https://vercel.com)
- **Database**: [Neon](https://neon.tech)

---

## 📞 Support

Need help? We're here for you:

- 📖 [Documentation](https://github.com/bryant24hao/runtracker-pro/wiki)
- 💬 [Discussions](https://github.com/bryant24hao/runtracker-pro/discussions)
- 🐛 [Issues](https://github.com/bryant24hao/runtracker-pro/issues)
- 📧 Email: support@wellrun.app (if available)

---

<div align="center">

**Made with ❤️ for runners, by runners**

[⭐ Star this project](https://github.com/bryant24hao/runtracker-pro) • [🍴 Fork it](https://github.com/bryant24hao/runtracker-pro/fork) • [📱 Try it now](https://runtracker-pro.vercel.app/)

*WellRun - Run well, live well.* 🏃‍♂️✨

</div> 