import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { Server as SocketIOServer } from "socket.io";

import packetRoutes, { setPacketSocket } from "./routes/packets.js";
import PacketSniffer from "./packet-sniffer.js";
import Packet from "./models/Packet.js";

const app = express();
const httpServer = createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingInterval: 25000,
  pingTimeout: 60000,
  upgradeTimeout: 10000
});

const PORT = Number.parseInt(process.env.PORT || "5000", 10);
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/packetscope";

let sniffer = new PacketSniffer();
let snifferProcess = null;

const corsOptions = {
  origin: "*",
  credentials: false,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"]
};

// ============================================
// UTILITY FUNCTIONS (MUST be before routes)
// ============================================

const emitSnifferStatus = (payload) => {
  io.emit("sniffer_status", payload);
};

const cleanupSnifferResources = () => {
  if (snifferProcess) {
    snifferProcess.removeAllListeners();
  }
};

const stopSnifferProcess = () => {
  if (!sniffer.isActive()) {
    return false;
  }

  try {
    sniffer.stop();
    snifferProcess = null;
    console.log("Sniffer stopped");
    emitSnifferStatus({ status: "stopped" });
    return true;
  } catch (error) {
    console.error("Error stopping sniffer:", error.message);
    return false;
  }
};

// ============================================
// MIDDLEWARE
// ============================================

app.use(cors(corsOptions));
app.use(express.json());
app.options("*", cors(corsOptions));

// ============================================
// API ROUTES
// ============================================

app.get("/", (req, res) => {
  res.send("Backend working");
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    sniffer: sniffer.isActive() ? "running" : "stopped"
  });
});

setPacketSocket(io);
app.use("/api", packetRoutes);

app.post("/api/sniffer/start", (req, res) => {
  const { interface: interfaceName, filter } = req.body || {};

  if (sniffer.isActive()) {
    return res.json({ status: "already_running" });
  }

  try {
    // Reset sniffer instance
    sniffer = new PacketSniffer();

    // Set up event listeners
    sniffer.on("packet", async (packet) => {
      try {
        // Store packet in database
        const packetData = {
          raw_summary: packet.raw_summary,
          protocol: packet.protocol,
          timestamp: packet.timestamp,
          src_ip: packet.src_ip,
          dst_ip: packet.dst_ip,
          src_port: packet.src_port,
          dst_port: packet.dst_port,
          length: packet.length,
          ttl: packet.ttl,
          flags: packet.flags,
          payload_preview: packet.payload_preview
        };

        const savedPacket = await Packet.create(packetData);
        io.emit("new_packet", savedPacket.toJSON());
      } catch (error) {
        console.error("Error storing packet:", error);
      }
    });

    sniffer.on("start", () => {
      console.log("Sniffer started");
      emitSnifferStatus({ status: "running" });
    });

    sniffer.on("stop", (data) => {
      console.log("Sniffer stopped");
      emitSnifferStatus({ status: "stopped", ...data });
    });

    snifferProcess = sniffer;
    sniffer.start(interfaceName || "eth0", filter || "");

    return res.json({ status: "started", interface: interfaceName || "eth0" });
  } catch (error) {
    console.error("Error starting sniffer:", error.message);
    emitSnifferStatus({
      status: "error",
      message: error.message
    });
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/sniffer/stop", (_req, res) => {
  if (!sniffer.isActive()) {
    return res.json({ status: "not_running" });
  }

  const result = stopSnifferProcess();
  return res.json({ status: result ? "stopped" : "error" });
});

app.get("/api/sniffer/interfaces", (_req, res) => {
  try {
    const interfaces = PacketSniffer.getInterfaces();
    const activeInterfaces = interfaces.filter((iface) => iface.active);
    console.log("Available interfaces:", interfaces);
    return res.json({ interfaces: activeInterfaces });
  } catch (error) {
    console.error("Error getting interfaces:", error.message);
    return res.json({
      interfaces: [
        { name: "eth0", description: "Ethernet Interface", ip: "192.168.1.100", active: true, loopback: false },
        { name: "lo", description: "Loopback", ip: "127.0.0.1", active: false, loopback: true }
      ]
    });
  }
});

// ============================================
// STATIC FILES & SPA CATCH-ALL (must be last)
// ============================================

app.use(express.static(path.join(process.cwd(), "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

// ============================================
// WEBSOCKET CONNECTIONS
// ============================================

io.on("connection", (socket) => {
  socket.emit("sniffer_status", {
    status: sniffer.isActive() ? "running" : "stopped"
  });
});

// ============================================
// SHUTDOWN HANDLER
// ============================================

const shutdown = async () => {
  stopSnifferProcess();
  await mongoose.connection.close();
  process.exit(0);
};

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

httpServer.listen(PORT, () => {
  console.log(`PacketScope backend listening on port ${PORT}`);
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    // Do not exit the process here so the service can still bind to the port.
  });

process.on("SIGINT", () => {
  shutdown();
});

process.on("SIGTERM", () => {
  shutdown();
});
