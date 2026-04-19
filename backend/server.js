import "dotenv/config";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { createServer } from "node:http";
import { execSync, spawn } from "node:child_process";
import process from "node:process";
import readline from "node:readline";
import { Server as SocketIOServer } from "socket.io";

import packetRoutes, { setPacketSocket } from "./routes/packets.js";

const app = express();
const httpServer = createServer(app);

// Configure allowed origins for CORS
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://packetscope-2-qekz.onrender.com",
  process.env.FRONTEND_URL // Allow custom frontend URL from env
].filter(Boolean);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingInterval: 25000,
  pingTimeout: 60000,
  upgradeTimeout: 10000
});

const PORT = Number.parseInt(process.env.PORT || "5000", 10);
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/packetscope";
const isWindows = process.platform === "win32";
const pythonCmd = isWindows ? process.env.PYTHON_PATH || "python" : process.env.PYTHON_PATH || "python3";

let snifferProcess = null;
let stdoutReader = null;
let stderrReader = null;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    sniffer: snifferProcess ? "running" : "stopped"
  });
});

setPacketSocket(io);
app.use("/api", packetRoutes);

const emitSnifferStatus = (payload) => {
  io.emit("sniffer_status", payload);
};

const cleanupSnifferResources = () => {
  if (stdoutReader) {
    stdoutReader.removeAllListeners();
    stdoutReader.close();
    stdoutReader = null;
  }

  if (stderrReader) {
    stderrReader.removeAllListeners();
    stderrReader.close();
    stderrReader = null;
  }

  if (snifferProcess) {
    snifferProcess.removeAllListeners();
  }
};

const stopSnifferProcess = () => {
  if (!snifferProcess) {
    return false;
  }

  const processToStop = snifferProcess;
  const pid = processToStop.pid;

  cleanupSnifferResources();
  snifferProcess = null;

  try {
    if (isWindows && pid) {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      processToStop.kill("SIGTERM");
    }
  } catch (_error) {
    try {
      processToStop.kill("SIGKILL");
    } catch (_innerError) {
      // Ignore cleanup failures during forced stop.
    }
  }

  console.log("Sniffer stopped");
  emitSnifferStatus({ status: "stopped" });
  return true;
};

app.post("/api/sniffer/start", (req, res) => {
  const { interface: interfaceName, filter } = req.body || {};

  if (snifferProcess !== null) {
    return res.json({ status: "already_running" });
  }

  const args = ["sniffer.py"];
  if (interfaceName) {
    args.push("--interface", interfaceName);
  }
  if (filter) {
    args.push("--filter", filter);
  }

  const spawnOptions = { shell: process.platform === "win32" };
  snifferProcess = spawn(pythonCmd, args, spawnOptions);

  stdoutReader = readline.createInterface({ input: snifferProcess.stdout });
  stderrReader = readline.createInterface({ input: snifferProcess.stderr });
  let responseSent = false;

  snifferProcess.on("spawn", () => {
    console.log("Sniffer started");
    emitSnifferStatus({ status: "running" });

    if (!responseSent) {
      responseSent = true;
      res.json({ status: "started" });
    }
  });

  stdoutReader.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.status) {
        emitSnifferStatus(parsed);
        return;
      }

      if (parsed.error) {
        emitSnifferStatus({
          status: "error",
          message: parsed.error
        });
        return;
      }

      console.log("Sniffer stdout:", parsed);
    } catch (error) {
      console.log("Sniffer stdout:", trimmed);
    }
  });

  stderrReader.on("line", (message) => {
    emitSnifferStatus({
      status: "error",
      message
    });
  });

  snifferProcess.on("close", () => {
    cleanupSnifferResources();
    snifferProcess = null;
    console.log("Sniffer stopped");
    emitSnifferStatus({ status: "stopped" });
  });

  snifferProcess.on("error", (err) => {
    cleanupSnifferResources();
    snifferProcess = null;

    if (err.code === "ENOENT") {
      if (!responseSent) {
        responseSent = true;
        return res.status(500).json({
          error: "Python not found. Install Python and set PYTHON_PATH in .env"
        });
      }

      return;
    }

    emitSnifferStatus({
      status: "error",
      message: err.message
    });

    if (!responseSent) {
      responseSent = true;
      res.status(500).json({ error: err.message });
    }
  });

  return undefined;
});

app.post("/api/sniffer/stop", (_req, res) => {
  if (!snifferProcess) {
    return res.json({ status: "not_running" });
  }

  stopSnifferProcess();
  return res.json({ status: "stopped" });
});

app.get("/api/sniffer/interfaces", (_req, res) => {
  try {
    const command = isWindows
      ? `${pythonCmd} -c "import json,scapy.arch.windows as w; print(json.dumps([{'name':i.get('name',''),'description':i.get('description',''),'ip':(i.get('ips') or [''])[0]} for i in w.get_windows_if_list()]))"`
      : `${pythonCmd} -c "import json,netifaces as n; print(json.dumps([{'name':i,'ip':n.ifaddresses(i).get(n.AF_INET,[{}])[0].get('addr','')} for i in n.interfaces()]))"`;

    const output = execSync(command, { encoding: "utf-8" });
    const rawInterfaces = JSON.parse(output)
      .filter((entry) => entry?.name)
      .map((entry) => {
        const ip = entry.ip || "";
        const description = entry.description || entry.name;
        const isLoopback =
          entry.name.toLowerCase().includes("loopback") || ip.startsWith("127.");
        const isActive = Boolean(ip) && !isLoopback;

        return {
          name: entry.name,
          description,
          ip,
          active: isActive,
          loopback: isLoopback
        };
      });
    const interfaces = rawInterfaces.filter((entry) => entry.active);

    console.log("Detected interfaces:", rawInterfaces);

    return res.json({ interfaces });
  } catch (_error) {
    return res.json({
      interfaces: isWindows
        ? [
            { name: "Wi-Fi", description: "Wi-Fi", ip: "", active: true, loopback: false },
            { name: "Ethernet", description: "Ethernet", ip: "", active: true, loopback: false }
          ]
        : [
            { name: "eth0", description: "eth0", ip: "", active: true, loopback: false },
            { name: "wlan0", description: "wlan0", ip: "", active: true, loopback: false }
          ]
    });
  }
});

io.on("connection", (socket) => {
  socket.emit("sniffer_status", {
    status: snifferProcess ? "running" : "stopped"
  });
});

const shutdown = async () => {
  stopSnifferProcess();

  await mongoose.connection.close();
  process.exit(0);
};

mongoose
  .connect(MONGO_URI)
  .then(() => {
    httpServer.listen(PORT, () => {
      console.log(`PacketScope backend listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  });

process.on("SIGINT", () => {
  shutdown();
});

process.on("SIGTERM", () => {
  shutdown();
});
