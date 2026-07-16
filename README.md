# Stuck on You 💘

**Stuck on You** is an anonymous message board application designed for the Valentine's season. It provides a safe space for users to vent, confess feelings, or express gratitude through digital sticky notes on a shared "corkboard" wall.

## ✨ Features

* **Anonymous Note Submission**: Users can write messages, specify a recipient ("To"), add an alias, and customize their note's color.
* **Live Corkboard Browsing**: View submitted notes displayed on a virtual corkboard with a randomized, natural look.
* **Auto & Manual Pagination**: The board automatically cycles through pages of notes every 20 seconds, or users can manually navigate using "Next" and "Previous" controls.
* **LoveHue Integration**: Features a popup linking to "LoveHue," allowing users to discover their love language spectrum.

## 🛠️ Tech Stack

### Frontend

* **Framework**: [React](https://react.dev/)
* **Build Tool**: [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **Routing**: [React Router](https://reactrouter.com/)
* **Icons**: [Lucide React](https://lucide.dev/)

### Backend

* **Runtime**: [Node.js](https://nodejs.org/)
* **Framework**: [Express.js](https://expressjs.com/)
* **Database**: [Aiven for PostgreSQL](https://aiven.io/) via [Prisma ORM](https://www.prisma.io/)
* **Security**: [helmet](https://www.npmjs.com/package/helmet), [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)

## 🚀 Getting Started

### Prerequisites

* Node.js installed on your machine.
* An Aiven for PostgreSQL service set up for the database.

### 1. Backend Setup

Navigate to the backend directory and install dependencies:

```bash
cd backend
npm install

```

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgres://avnadmin:password@host.aivencloud.com:12345/defaultdb?sslmode=require

```

Run the Prisma migration to create the database tables:

```bash
npx prisma migrate dev --name init

```

Start the backend server:

```bash
npm start
# or for development
npm run dev

```

### 2. Frontend Setup

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install

```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000

```

Start the frontend development server:

```bash
npm run dev

```

## 📡 API Endpoints

The backend exposes the following RESTful endpoints:

* **`GET /api/notes`**:YR Retrieves all notes, ordered by creation date.
* **`POST /api/notes`**: Submits a new note.
* **Body**: `{ "to_name": "...", "message": "...", "alias": "...", "color": "..." }`
* **Rate Limit**: 5 requests per hour per IP.



## 📂 Project Structure

```
stuck-on-you/
├── backend/             # Express.js server
│   ├── lib/             # Supabase client configuration
│   ├── routes/          # API routes (notes.js)
│   └── index.js         # Entry point and rate limiter config
│
└── frontend/            # React application
    ├── src/
    │   ├── assets/      # Images and static assets
    │   ├── components/  # Reusable UI components (Navbar, Footer, Popup)
    │   ├── pages/       # Page views (Home, Browse, Submit, About)
    │   └── App.jsx      # Main application routing
    └── vite.config.js   # Vite configuration

```

## 👥 Authors

* **Iverene Grace M. Causapin** - *Frontend Developer & Deputy Secretary General (CICS SC)*
* **John Rey V. Bagunas** - *Backend Developer & Business Manager (CICS SC)*
