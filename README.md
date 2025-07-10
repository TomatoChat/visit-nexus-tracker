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
- **Role-Based Access Control**: Comprehensive permission system with four user roles

## ✨ Key Features

### 🔐 Authentication & Security
- Secure login system with Supabase Auth
- Session management and automatic token refresh
- Protected routes and user-specific data access
- **Role-Based Access Control (RBAC)** with four distinct roles:
  - **Admin**: Full access to all features and data management
  - **Internal Agent**: Read-only access to data management, can create visits and view their own visits
  - **External Agent**: Can create visits and view their own visits, limited to "My Visits" only
  - **Guest**: Read-only access to view data

### 📸 Photo Upload & Documentation
- **Visit Photo Documentation**: Upload multiple photos per visit
- **Dual Upload Options**: Upload from gallery or take photos with camera
- **Photo Management**: Preview, select, and organize photos before upload
- **Data Integrity**: Photos become permanent once uploaded (no deletion)
- **Storage Organization**: Photos organized by visit ID in Supabase Storage
- **Audit Trail**: Complete photo documentation for visit records

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
- **User Management**: Admin interface for managing user roles and permissions
- **Search Functionality**: Real-time search across all data management pages
- **Add Forms**: Quick add functionality with inline forms for all entities

### 🗺️ Location Services
- **Address Geocoding**: Automatic coordinate generation from addresses
- **Location Validation**: Ensure accurate address data
- **Google Maps Integration**: Leverage Google Maps API for geocoding

## 🔐 Role-Based Access Control

### Role Hierarchy
```
Admin (4) > Internal Agent (3) > External Agent (2) > Guest (1)
```

### Permissions by Role

#### Admin
- ✅ Full access to all features
- ✅ Manage user roles and permissions
- ✅ Create, read, update, delete all data
- ✅ View all visits from all users
- ✅ Manage system settings and configurations
- ✅ Access all data management pages

#### Internal Agent
- ✅ Create visits and view own visits
- ✅ View companies, people, selling points, activities (read-only)
- ✅ Access all data management pages in read-only mode
- ❌ Cannot modify data in Data Management
- ❌ Cannot view other users' visits

#### External Agent
- ✅ Create visits and view own visits
- ✅ Access only "My Visits" page
- ❌ Cannot access data management pages
- ❌ Cannot view other users' visits

#### Guest
- ✅ View companies, people, selling points, activities (read-only)
- ❌ Cannot create visits
- ❌ Cannot modify any data

### Security Implementation
- **Database Level**: Row Level Security (RLS) policies enforce permissions
- **Application Level**: Role guards prevent unauthorized UI elements
- **API Level**: Role checking in functions provides additional security
- **Session Management**: Roles checked on each request

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **Git**
- **Supabase Account** - For backend services
- **Google Maps API Key** - For geocoding services

## ⚡ Performance Optimizations

### Data Loading Efficiency
- **React Query Integration**: Implemented comprehensive caching and background updates
- **Optimistic Updates**: UI updates immediately while data syncs in background
- **Stale-While-Revalidate**: Shows cached data while fetching fresh data
- **Query Deduplication**: Prevents duplicate requests for same data
- **Intelligent Caching**: 5-minute stale time, 10-minute garbage collection

### Upload Performance
- **Batch Processing**: Photos uploaded in configurable batches (default: 3 concurrent)
- **Progress Tracking**: Real-time upload progress with visual feedback
- **Memory Management**: Automatic cleanup of preview URLs and temporary data
- **Error Recovery**: Graceful handling of upload failures with retry logic
- **Compression**: Automatic image optimization before upload

### Search & Filtering
- **Debounced Search**: 300ms delay prevents excessive API calls
- **Virtual Scrolling**: Efficient rendering of large datasets
- **Lazy Loading**: Data loaded on-demand as user scrolls
- **Smart Filtering**: Client-side filtering for instant results

### Network Optimization
- **Request Batching**: Multiple operations combined into single requests
- **Connection Pooling**: Reuses database connections efficiently
- **Compression**: Gzip compression for all API responses
- **CDN Integration**: Static assets served from global CDN

### Memory Management
- **Automatic Cleanup**: Unused data automatically removed from cache
- **Memory Monitoring**: Real-time memory usage tracking
- **Garbage Collection**: Aggressive cleanup of old cache entries
- **Image Optimization**: Automatic resizing and compression

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

### 4. Setup Storage (Required for Photo Upload)

In your Supabase dashboard:
1. Go to **Storage** section
2. Create a new bucket called `visits-photos`
3. Set it to **Public** for read access
4. Add storage policies for authenticated users

### 5. Start Development Server
```bash
npm run dev
```

## 📊 Database Schema

The application uses the following main entities:

- **Companies**: Suppliers and sellers with business information
- **Selling Points**: Retail locations with addresses
- **People**: Contacts associated with companies
- **Visit Activities**: Types of business activities
- **Visits**: Individual visit records with photo documentation
- **Visit Photos**: Photo metadata and storage references
- **Addresses**: Location data with geocoding
- **UserRoles**: User role assignments for RBAC

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Testing
```bash
# Frontend testing (when implemented)
npm test

# Python testing
pytest src/backend/
```

## 🔐 Security Features

### Role-Based Access Control
- **Database Level**: RLS policies enforce permissions at the database level
- **Application Level**: Role guards prevent unauthorized UI elements from rendering
- **API Level**: Role checking in functions provides additional security
- **Session Management**: Roles are checked on each request

### Data Protection
- **Row Level Security**: Database-level access control
- **User Isolation**: Users can only access their own data
- **Admin Controls**: Only admins can modify system data
- **Audit Trail**: Visit tracking with user attribution
- **Photo Security**: Photos stored securely with user-specific access controls

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