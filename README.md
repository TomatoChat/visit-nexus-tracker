# Visit Nexus Tracker

A comprehensive web application for tracking business visits, managing relationships between suppliers, sellers, and selling points, and generating detailed visit reports. Built with modern web technologies and designed for field sales teams and business development professionals.

## 🎯 Overview

Visit Nexus Tracker is a full-stack application that enables users to:
- **Track Business Visits**: Record detailed visit information including companies, selling points, activities, and people
- **Manage Business Relationships**: Handle complex supplier-seller-selling point relationships
- **Generate Reports**: Create comprehensive visit summaries and analytics
- **Data Management**: Add and manage companies, people, selling points, and activities
- **Geocoding**: Automatically geocode addresses using Google Maps API
- **Authentication**: Secure user authentication with Supabase

## ✨ Key Features

### 🔐 Authentication & Security
- Secure login system with Supabase Auth
- Session management and automatic token refresh
- Protected routes and user-specific data access

### 🏢 Business Relationship Management
- **Multi-level Company Structure**: Suppliers → Sellers → Selling Points
- **Complex Relationships**: Track which suppliers work with which sellers at specific locations
- **People Management**: Associate contacts with specific companies
- **Activity Tracking**: Record different types of business activities

### 📊 Data Management
- **Company Management**: Add suppliers and sellers with detailed information
- **Selling Point Management**: Track retail locations with addresses and geocoding
- **Person Management**: Maintain contact databases for each company
- **Activity Management**: Define and track different types of business activities

### 🗺️ Location Services
- **Address Geocoding**: Automatic coordinate generation from addresses
- **Location Validation**: Ensure accurate address data
- **Google Maps Integration**: Leverage Google Maps API for geocoding

### 📱 Responsive Design
- **Mobile-First**: Optimized for field use on mobile devices
- **Desktop Support**: Full-featured desktop interface
- **Progressive Web App**: Works offline and can be installed on devices

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **React Query** - Server state management
- **React Hook Form** - Form handling with validation

### UI & Styling
- **shadcn/ui** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Headless UI primitives
- **Lucide React** - Modern icon library
- **Framer Motion** - Smooth animations

### Backend & Data
- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Real-time)
- **Python** - Data processing and geocoding scripts
- **Pandas** - Data manipulation and analysis
- **Geopy** - Geocoding and location services

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 📁 Project Structure

```
visit-nexus-tracker/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   └── visit/                 # Visit-specific components
│   │       ├── NewVisitForm.tsx   # Main visit form
│   │       ├── VisitSummary.tsx   # Visit summary display
│   │       ├── CompanySelector.tsx
│   │       ├── PersonSelector.tsx
│   │       └── ...
│   ├── pages/
│   │   ├── Index.tsx              # Login and main visit page
│   │   ├── DataManagement.tsx     # Data management interface
│   │   └── NotFound.tsx           # 404 page
│   ├── hooks/                     # Custom React hooks
│   ├── integrations/
│   │   └── supabase/              # Supabase client and types
│   ├── backend/                   # Python scripts
│   │   ├── geocodeAddresses.py    # Address geocoding
│   │   ├── locationUtils.py       # Location utilities
│   │   ├── supabaseUtils.py       # Supabase utilities
│   │   ├── notebooks/             # Jupyter notebooks
│   │   └── queries/               # SQL queries
│   └── lib/                       # Utility functions
├── public/                        # Static assets
├── supabase/                      # Supabase configuration
├── data/                          # Data files
└── requirements.txt               # Python dependencies
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Git**
- **Supabase Account** - For backend services
- **Google Maps API Key** - For geocoding services

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd visit-nexus-tracker
```

### 2. Install Dependencies

#### Frontend Dependencies
```bash
npm install
```

#### Backend Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the project root:

#### Frontend Environment Variables
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
VITE_LOGIN_PASSWORD=your_login_password
```

#### Backend Environment Variables
```env
# Project Configuration
PROJECT_DIRECTORY=/absolute/path/to/visit-nexus-tracker

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_key

# Google Maps API
GOOGLE_MAPS_KEY=your_google_maps_api_key
```

### 4. Database Setup

1. **Create Supabase Project**: Set up a new project at [supabase.com](https://supabase.com)
2. **Database Schema**: The application expects specific tables for companies, selling points, people, etc.
3. **Enable Auth**: Configure authentication in your Supabase dashboard
4. **Set up RLS**: Configure Row Level Security policies

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🐍 Python Backend Scripts

The application includes Python scripts for advanced data processing:

### Geocoding Addresses
```bash
python src/backend/geocodeAddresses.py
```

### Data Processing
```bash
python src/backend/locationUtils.py
```

### Jupyter Notebooks
```bash
jupyter notebook src/backend/notebooks/
```

## 📊 Database Schema

The application uses the following main entities:

- **Companies**: Suppliers and sellers with business information
- **Selling Points**: Retail locations with addresses
- **People**: Contacts associated with companies
- **Visit Activities**: Types of business activities
- **Visits**: Individual visit records
- **Addresses**: Location data with geocoding

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (via ESLint)

### Testing
```bash
# Frontend testing (when implemented)
npm test

# Python testing
pytest src/backend/
```

## 🌐 Deployment

### Environment Variables
Ensure all environment variables are set in your deployment platform.

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join discussions in GitHub Discussions
- **Documentation**: Check the documentation for common questions