const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const seedData = require("./utils/seedData");
const { errorHandler } = require("./middleware/error");

const path = require("path");

// Load environment variables reliably from server/.env
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

app.set("trust proxy", 1);

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Connect DB & Run Auto-Seed
connectDB().then(async () => {
  await seedData();
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "LOBBYIT API Server running successfully",
    timestamp: new Date().toISOString(),
  });
});

// Seed API endpoint for manual reset
app.post("/api/seed", async (req, res) => {
  try {
    const User = require("./models/User");
    const Team = require("./models/Team");
    const Tournament = require("./models/Tournament");
    const Registration = require("./models/Registration");
    const Game = require("./models/Game");

    await User.deleteMany({});
    await Team.deleteMany({});
    await Tournament.deleteMany({});
    await Registration.deleteMany({});
    await Game.deleteMany({});

    await seedData();
    res.json({ message: "Database reset and re-seeded successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/tournaments", require("./routes/tournamentRoutes"));
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/registrations", require("./routes/registrationRoutes"));
app.use("/api/games", require("./routes/gameRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Kriti Assistant routes
const assistantRoutes = require("./routes/assistantRoutes");

console.log("[Assistant] Export type:", typeof assistantRoutes);

if (typeof assistantRoutes !== "function") {
  console.error("[Assistant] Invalid route export:", assistantRoutes);
  throw new TypeError(
    "assistantRoutes.js must export an Express router using module.exports = router",
  );
}

app.use("/api/assistant", assistantRoutes);

// Error handling middleware
app.use(errorHandler);

const http = require("http");
const { Server } = require("socket.io");
const setupVoiceSocket = require("./socket/voiceSocket");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

// Initialize Team Voice Signaling Gateway
setupVoiceSocket(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`[LOBBYIT SERVER] API & Voice Gateway running on http://localhost:${PORT}`);
});
