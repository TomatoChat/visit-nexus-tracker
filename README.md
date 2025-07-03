# Visit Nexus Tracker

A web application for tracking visits, activities, companies, people, and selling points.

---

## 🚀 Features
- Fast, responsive UI with React and Vite
- Type-safe codebase with TypeScript
- Beautiful, accessible components via shadcn/ui
- Utility-first styling with Tailwind CSS
- Modular, maintainable project structure
- Supabase integration for authentication and data
- Python scripts for advanced data processing and geocoding

---

## 🛠️ Tech Stack
- **Frontend:** React, TypeScript, Vite
- **UI:** shadcn/ui, Tailwind CSS
- **Backend/Data:** Supabase, Python (pandas, geopy, supabase-py)

---

## 📁 Project Structure
```
visit-nexus-tracker/
├── src/
│   ├── components/         # UI and feature components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Supabase client/types
│   ├── pages/              # Main app pages
│   ├── backend/            # Python scripts & SQL for data
│   └── ...
├── public/                 # Static assets
├── supabase/               # Supabase config
├── package.json            # Project metadata/scripts
├── requirements.txt        # Python dependencies
└── ...
```

---

## ⚡ Quick Start

### 1. Clone the repository
   ```sh
   git clone <YOUR_GIT_URL>
   cd visit-nexus-tracker
   ```

### 2. Install dependencies
- **Frontend:**
   ```sh
   npm install
   ```
- **Backend (Python scripts):**
  ```sh
  pip install -r requirements.txt
  ```

### 3. Set up environment variables
Create a `.env` file in the project root for both frontend and backend variables:

#### Frontend (`.env` or `.env.local`)
```
VITE_LOGIN_PASSWORD=your_login_password
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Backend (`.env` for Python scripts)
```
PROJECT_DIRECTORY=/absolute/path/to/visit-nexus-tracker
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_key
GOOGLE_MAPS_KEY=your_google_maps_api_key
```

### 4. Start the development server
   ```sh
   npm run dev
   ```
The app will be available at [http://localhost:5173](http://localhost:5173) (or as shown in your terminal).

---

## 🐍 Using the Python Backend Scripts
- Python scripts for data processing and geocoding are in `src/backend/`.
- Ensure your `.env` is set up as above before running scripts.
- Example usage:
  ```sh
  python src/backend/geocodeAddresses.py
  ```

---

## 🌐 Deployment
You can deploy the app using your preferred platform (Vercel, Netlify, etc.) or your own infrastructure.

---

## 🔗 Custom Domain
To connect a custom domain, follow the instructions provided by your hosting provider (e.g., Vercel, Netlify, or your DNS registrar).

---

## 🤝 Contributing
Pull requests and issues are welcome! Please open an issue to discuss your ideas or report bugs.

---

## 📚 Resources
- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [Supabase Python Client](https://supabase.com/docs/guides/with-python)
- [Google Maps Geocoding API](https://developers.google.com/maps/documentation/geocoding/overview)

---

## 📝 License
This project is licensed under the MIT License.