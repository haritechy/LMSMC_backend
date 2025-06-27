const express = require("express");
const http = require("http");
const cors = require("cors");
const { sequelize } = require("./src/models");
const router = require("./src/routes/authRoute");
const chatRouter = require("./src/routes/chatRoute");
const { setupWebSocket } = require("./src/socket/socket");
require("dotenv").config();

const app = express();
const server = http.createServer(app); // ✅ create HTTP server

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.use("/api", router);
app.use("/api/chat", chatRouter);

const PORT = process.env.PORT || 5000;

// DB connection + server + websocket
sequelize.authenticate()
  .then(() => {
    console.log("✅ PostgreSQL connected");

    // ✅ Setup WebSocket
    setupWebSocket(server);

    // ✅ Start server
    server.listen(PORT, () => {
      console.log("🚀 Server and WebSocket running on port", PORT);
    });
  })
  .catch(err => {
    console.error("❌ Connection error:", err);
  });
