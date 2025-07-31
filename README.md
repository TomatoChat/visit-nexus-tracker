# Visit Nexus Tracker

A comprehensive web application for tracking business visits, managing relationships between suppliers, sellers, and selling points, and generating detailed visit reports. Built with modern web technologies and designed for field sales teams and business development professionals.

## 🎯 Overview

Visit Nexus Tracker is a full-stack application that enables users to:
- **Track Business Visits**: Record detailed visit information including companies, selling points, activities, and people
- **Manage Business Relationships**: Handle complex supplier-seller-selling point relationships
- **Generate Reports**: Create comprehensive visit summaries and analytics
- **Data Management**: Add and manage companies, people, selling points, and activities
- **Bulk Data Import**: Import large datasets via Excel/CSV files with validation
- **Performance Monitoring**: Real-time application performance metrics and monitoring
- **Geocoding**: Automatically geocode addresses using Google Maps API
- **Authentication**: Secure user authentication with Supabase
- **Role-Based Access Control**: Comprehensive permission system with four user roles
- **Dark Theme Support**: Modern UI with light and dark theme options

## ✨ Key Features

### 🔐 Authentication & Security
- Secure login system with Supabase Auth
- Session management and automatic token refresh
- Protected routes and user-specific data access
- **Role-Based Access Control (RBAC)** with four distinct roles:
  - **Admin**: Full access to all features and data management, can view all selling points in "To Visit"
  - **Internal Agent**: Can create visits and view their own visits, limited access to data management
  - **External Agent**: Can create visits and view their own visits, no access to data management
  - **Guest**: Read-only access to view data
- **Profile Management**: User profile page with password change functionality

### 📸 Photo Upload & Documentation
- **Visit Photo Documentation**: Upload multiple photos per visit
- **Dual Upload Options**: Upload from gallery or take photos with camera
- **Photo Management**: Preview, select, and organize photos before upload
- **Data Integrity**: Photos become permanent once uploaded (no deletion)
- **Storage Organization**: Photos organized by visit ID in Supabase Storage
- **Audit Trail**: Complete photo documentation for visit records
- **Progress Tracking**: Real-time upload progress monitoring

### 📊 Bulk Data Management
- **Excel/CSV Import**: Bulk upload capabilities for companies, selling points, and people
- **Template Downloads**: Pre-formatted Excel templates with validation rules
- **Data Validation**: Comprehensive client-side and server-side validation
- **Transaction Safety**: All-or-nothing uploads with rollback on errors
- **Reference Data**: Templates include reference data for categories and relationships
- **Error Reporting**: Detailed error messages with row-specific feedback

### 🏢 Business Relationship Management
- **Multi-level Company Structure**: Suppliers → Sellers → Selling Points
- **Complex Relationships**: Track which suppliers work with which sellers at specific locations
- **People Management**: Associate contacts with specific companies
- **Activity Tracking**: Record different types of business activities
- **Visit Scheduling**: Role-based view of selling points that need visits
  - **Admin**: View all selling points requiring visits across the organization
  - **Other Roles**: View only assigned selling points requiring visits

### 📊 Data Management
- **Company Management**: Add suppliers and sellers with detailed information (Admin only)
- **Selling Point Management**: Track retail locations with addresses and geocoding (Admin only)
- **Person Management**: Maintain contact databases for each company (Admin only)
- **Activity Management**: Define and track different types of business activities (Admin only)
- **User Management**: Admin interface for managing user roles and permissions
- **Search Functionality**: Real-time search across all data management pages
- **Add Forms**: Quick add functionality with inline forms for all entities
- **Bulk Upload**: Excel/CSV import capabilities for mass data entry (Admin only)

### 🎨 User Interface & Experience
- **Dark Theme Support**: Modern UI with light and dark theme options
- **Responsive Design**: Optimized for desktop and mobile devices
- **Performance Dashboard**: Real-time application performance monitoring
- **Toast Notifications**: User-friendly feedback system
- **Loading States**: Comprehensive loading indicators and skeletons
- **Accessibility**: WCAG compliant design with keyboard navigation

### 🗺️ Location Services
- **Address Geocoding**: Automatic coordinate generation from addresses
- **Location Validation**: Ensure accurate address data
- **Google Maps Integration**: Leverage Google Maps API for geocoding

### 📈 Performance Monitoring
- **Real-time Metrics**: Memory usage, load times, and network performance
- **Component Tracking**: Individual component render and interaction times
- **Speed Insights**: Integration with Vercel Speed Insights
- **Performance Dashboard**: Floating performance monitor for development
- **Batch Processing**: Efficient handling of large data operations

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
- ✅ View all selling points requiring visits
- ✅ Manage system settings and configurations
- ✅ Access all data management pages (Companies, Selling Points, People, General Categories)
- ✅ Bulk upload capabilities

#### Internal Agent
- ✅ Create visits and view own visits
- ✅ View only assigned selling points requiring visits
- ❌ Cannot access data management pages (Companies, Selling Points, People, General Categories)
- ❌ Cannot view other users' visits

#### External Agent
- ✅ Create visits and view own visits
- ✅ View only assigned selling points requiring visits
- ❌ Cannot access data management pages (Companies, Selling Points, People, General Categories)
- ❌ Cannot view other users' visits

#### Guest
- ❌ Cannot create visits
- ❌ Cannot access data management pages
- ❌ Cannot modify any data

### Security Implementation
- **Database Level**: Row Level Security (RLS) policies enforce permissions
- **Application Level**: Role guards prevent unauthorized UI elements
- **Route Level**: Protected routes prevent direct URL access to restricted pages
- **API Level**: Role checking in functions provides additional security
- **Session Management**: Roles checked on each request
- **Menu Level**: Navigation menu items hidden based on user role

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **Git**
- **Supabase Account** - For backend services
- **Google Maps API Key** - For geocoding services

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd visit-nexus-tracker
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
VITE_LOGIN_PASSWORD=your_login_password
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

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── data-management/ # Data management components
│   ├── ui/             # Base UI components (shadcn/ui)
│   │   ├── protected-route.tsx # Route protection component
│   │   └── role-guard.tsx      # Role-based UI guards
│   └── visit/          # Visit-specific components
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/      # Supabase client and types
├── lib/               # Utility functions and helpers
├── pages/             # Page components
└── main.tsx          # Application entry point
```

## 🔐 Security Features

### Role-Based Access Control
- **Database Level**: RLS policies enforce permissions at the database level
- **Application Level**: Role guards prevent unauthorized UI elements from rendering
- **Route Level**: Protected routes prevent direct URL access to restricted pages
- **Menu Level**: Navigation menu items hidden based on user role
- **API Level**: Role checking in functions provides additional security
- **Session Management**: Roles are checked on each request

### Recent Access Control Updates
- **Data Management Pages**: Companies, Selling Points, People, and General Categories are now restricted to Admin users only
- **To Visit Page**: Enhanced with role-based access:
  - **Admin**: Can view all selling points requiring visits across the organization
  - **Other Roles**: Can only view selling points assigned to them
- **Menu Visibility**: Data management menu items are hidden for non-admin users
- **Route Protection**: Direct URL access to restricted pages is blocked and redirects to home

### Data Protection
- **Row Level Security**: Database-level access control
- **User Isolation**: Users can only access their own data
- **Admin Controls**: Only admins can modify system data and view all selling points
- **Role-Based Data Access**: Different data views based on user role
- **Audit Trail**: Visit tracking with user attribution
- **Photo Security**: Photos stored securely with user-specific access controls

## 🌐 Deployment

### Environment Variables
Ensure all environment variables are set in your deployment platform:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_LOGIN_PASSWORD=your_login_password
```

### Build for Production
```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

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