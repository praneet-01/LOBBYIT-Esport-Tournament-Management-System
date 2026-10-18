import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ChatWidget from "./components/common/ChatWidget";

import Home from "./pages/Home";
import Tournaments from "./pages/Tournaments";
import TournamentDetail from "./pages/TournamentDetail";
import RegisterTeam from "./pages/RegisterTeam";
import Games from "./pages/Games";
import GameDetail from "./pages/GameDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserProfile from "./pages/UserProfile";

import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import CreateTournament from "./pages/organizer/CreateTournament";
import OrganizerTournaments from "./pages/organizer/OrganizerTournaments";
import OrganizerRegistrations from "./pages/organizer/OrganizerRegistrations";

import TeamDashboard from "./pages/team/TeamDashboard";
import ManageTeam from "./pages/team/ManageTeam";
import TeamRegistrations from "./pages/team/TeamRegistrations";

// Protected Route Wrapper for Organizer
const OrganizerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "Organizer" && user.role !== "Admin")
    return <Navigate to="/team/dashboard" replace />;
  return children;
};

// Protected Route Wrapper for Player / Team
const TeamRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "Team" && user.role !== "Player")
    return <Navigate to="/organizer/dashboard" replace />;
  return children;
};

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-slate-100 font-sans selection:bg-crimson selection:text-white">
      <Navbar />
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournaments/:slug" element={<TournamentDetail />} />
          <Route
            path="/tournaments/:slug/register"
            element={<RegisterTeam />}
          />
          <Route path="/games" element={<Games />} />
          <Route path="/games/:slug" element={<GameDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<UserProfile />} />

          {/* Organizer Protected Routes */}
          <Route
            path="/organizer/dashboard"
            element={
              <OrganizerRoute>
                <OrganizerDashboard />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/tournaments/create"
            element={
              <OrganizerRoute>
                <CreateTournament />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/tournaments"
            element={
              <OrganizerRoute>
                <OrganizerTournaments />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/registrations"
            element={
              <OrganizerRoute>
                <OrganizerRegistrations />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/registrations/:id"
            element={
              <OrganizerRoute>
                <OrganizerRegistrations />
              </OrganizerRoute>
            }
          />
          <Route
            path="/organizer/tournaments/:id/registrations"
            element={
              <OrganizerRoute>
                <OrganizerRegistrations />
              </OrganizerRoute>
            }
          />

          {/* Team Protected Routes */}
          <Route
            path="/team/dashboard"
            element={
              <TeamRoute>
                <TeamDashboard />
              </TeamRoute>
            }
          />
          <Route
            path="/team/my-team"
            element={
              <TeamRoute>
                <ManageTeam />
              </TeamRoute>
            }
          />
          <Route
            path="/team/registrations"
            element={
              <TeamRoute>
                <TeamRegistrations />
              </TeamRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
