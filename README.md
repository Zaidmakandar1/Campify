# Campify

A comprehensive campus management platform built with React, TypeScript, and Supabase. Campify streamlines campus life by connecting students, faculty, and clubs through event management, venue booking, feedback systems, and marketplace features.

## 👋 About the Maintainer

Hi, I'm **Zaid Makandar** (update this name if needed).  
I'm building Campify to improve campus collaboration, communication, and student engagement through one unified platform.

### Connect with me

- GitHub: `https://github.com/Zaidmakandar1`
- Open an issue in this repository for collaboration or project-related questions

### My focus areas

- Full-stack web development
- Campus/community products
- AI-powered insights for better decisions

## 🌟 Why this repository

This repository showcases:
- Real-world product architecture with role-based access
- End-to-end feature development (UI + backend + database)
- Practical use of Supabase auth, RLS, and storage
- A scalable React + TypeScript frontend foundation

## Features

### 🎯 Core Modules

- **Hub** - Discover and register for campus events
- **Voice** - Submit and track campus feedback with upvoting system
- **Venues** - Browse and book campus facilities
- **Market** - Campus marketplace for students
- **Profile** - Manage user profiles and preferences

### 👥 Role-Based Access

- **Students** - Register for events, submit feedback, browse venues and marketplace
- **Faculty** - Manage venues, review feedback, administrative oversight
- **Clubs** - Create and manage events, track registrations, venue bookings

### ✨ Key Features

- Event creation and management with image uploads
- Team/individual event registration system
- Real-time notifications
- Venue booking with availability tracking
- Feedback system with categories and resolution tracking
- AI-powered analytics dashboard
- Performance scoring for clubs
- Responsive design with dark mode support

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling with Zod validation

### UI Components
- **shadcn/ui** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library
- **Recharts** - Data visualization
- **Sonner** - Toast notifications

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - Storage for images
  - Real-time subscriptions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd campify
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables

Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run database migrations

Apply the Supabase migrations from the `supabase/migrations` directory to set up your database schema.

5. Start the development server
```bash
npm run dev
```

The app will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── ui/             # shadcn/ui components
│   ├── Navbar.tsx      # Navigation bar
│   ├── EventCard.tsx   # Event display card
│   ├── VenueCard.tsx   # Venue display card
│   └── ...
├── pages/              # Route pages
│   ├── Auth.tsx        # Authentication
│   ├── Home.tsx        # Landing page
│   ├── Hub.tsx         # Events hub
│   ├── Voice.tsx       # Feedback system
│   ├── Market.tsx      # Marketplace
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility functions
├── App.tsx             # Main app component
└── main.tsx           # Entry point

supabase/
├── migrations/         # Database migrations
└── config.toml        # Supabase configuration
```

## Database Schema

The application uses the following main tables:

- **profiles** - User profiles with role-based access (student/faculty/club)
- **clubs** - Club information and performance metrics
- **events** - Campus events with registration tracking
- **venues** - Campus facilities and booking system
- **feedback** - Campus feedback with categories and resolution status
- **notifications** - Real-time user notifications
- **registrations** - Event registration records

## Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Hosting Platform

Deploy to any static hosting service:

- **Vercel** - Connect your Git repository for automatic deployments
- **Netlify** - Drag and drop the `dist` folder or connect Git
- **GitHub Pages** - Use GitHub Actions for automated deployment
- **Cloudflare Pages** - Connect repository for edge deployment

### Environment Variables

Make sure to set your environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, Contact the Repo Collaborators.
