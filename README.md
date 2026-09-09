# 🎮 LOBBYIT - Esports Tournament Platform

Deploy Link - lobbyit-esport-tournament-managemen.vercel.app

**LOBBYIT** is a full-stack esports tournament discovery and management web application built for gaming communities, tournament organizers, and competitive team squads.

---

## 🌟 Key Features

- **🏆 Organizer Portal**: Host esports tournaments, configure player lineup limits, manage draft vs published events, and accept/reject incoming team registrations.
- **🛡️ Competitive Team Rosters**: Register teams with player in-game names (IGN), assign team captains, and track registration status in real-time.
- **🎮 Official Game Lobbies**: Dedicated 3:4 vertical poster cards for popular titles including _Free Fire_, _Valorant_, _BGMI_, _eFootball_, _CS2_, _Fortnite_, _Dota 2_, and _Mobile Legends_.
- **⚡ Zero-Config Database Fallback**: Built-in `mongodb-memory-server` for instant local execution, with automatic fallback support for MongoDB Atlas cloud databases.

---

## 🛠️ Tech Stack

### Frontend

- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios

### Backend

- **Runtime**: Node.js & Express.js
- **Database**: MongoDB (Mongoose ORM)
- **In-Memory Fallback**: `mongodb-memory-server`
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs

---

## 📂 Project Structure

```text
lobbyit/
├── client/                     # React + Vite Frontend
│   ├── public/
│   │   └── images/             # Game posters (Free Fire, eFootball, etc.)
│   └── src/
│       ├── components/         # Reusable UI components (Navbar, Cards, Modals)
│       ├── context/            # AuthContext state management
│       ├── pages/              # Page routes (Home, Tournaments, Organizer, Team)
│       └── services/           # Axios API service instance
│
└── server/                     # Node.js + Express REST API Backend
    ├── config/                 # Database connection logic
    ├── controllers/            # API Controllers (Auth, Tournaments, Teams, Registrations)
    ├── middleware/             # Auth & Role authorization middleware
    ├── models/                 # Mongoose Data Models (User, Tournament, Team, Registration)
    ├── routes/                 # Express API routes
    └── utils/                  # Data seeder script (`seedData.js`)
```

---

## 🚀 Quick Start Guide

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/lobbyit.git
cd lobbyit
```

### 2. Environment Setup (Optional for Cloud DB)

Create a `.env` file in the `server/` folder:

```env
PORT=5001
JWT_SECRET=lobbyit_secret_key_2026
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/lobbyit?retryWrites=true&w=majority
```

_(If `MONGODB_URI` is omitted, the server automatically boots an in-memory MongoDB instance)._

---

### 3. Run the Application

#### Step A: Start Backend API

```bash
cd server
npm install
npm start
```

_Backend API will run on `http://localhost:5001`_

#### Step B: Start Frontend App (in a new terminal)

```bash
cd client
npm install
npm run dev
```

_Frontend Web App will run on `http://localhost:5173`_

---

## 🔐 Quick Demo Accounts

| Role           | Email                   | Password      | Features                                |
| :------------- | :---------------------- | :------------ | :-------------------------------------- |
| **Organizer**  | `organizer@lobbyit.com` | `password123` | Host Tournaments, Review Team Lineups   |
| **Team Squad** | `team@lobbyit.com`      | `password123` | Create Team Roster, Register for Events |

---

## 📡 API Endpoints Summary

### Auth Routes (`/api/auth`)

- `POST /api/auth/register` - Register Organizer or Team account
- `POST /api/auth/login` - User login & JWT issuance
- `GET /api/auth/me` - Get authenticated user profile

### Tournament Routes (`/api/tournaments`)

- `GET /api/tournaments` - Get all published tournaments
- `GET /api/tournaments/organizer/my` - Get tournaments hosted by logged-in organizer
- `POST /api/tournaments` - Create/Host new tournament
- `PATCH /api/tournaments/:id/publish` - Toggle tournament publish status

### Team Routes (`/api/teams`)

- `GET /api/teams/me` - Get current team profile
- `POST /api/teams` - Create/Update team roster

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
