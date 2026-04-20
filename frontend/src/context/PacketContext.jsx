import React from "react";
import axios from "axios";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { useSocket } from "../hooks/useSocket.js";

axios.defaults.baseURL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:5000");
axios.defaults.headers.common["ngrok-skip-browser-warning"] = "true";

const MAX_PACKETS = 500;
const PacketContext = createContext(null);

export function PacketProvider({ children }) {
  const [packets, setPackets] = useState([]);
  const [stats, setStats] = useState({});
  const [isSniffing, setIsSniffing] = useState(false);
  const [snifferLoading, setSnifferLoading] = useState(false);
  const [snifferError, setSnifferError] = useState(null);
  const [filters, setFilters] = useState({
    protocol: "ALL",
    search: "",
    srcIp: "",
    interface: "",
    bpfFilter: ""
  });
  const [page] = useState(1);
  const [limit] = useState(50);
  const [hasMore, setHasMore] = useState(true);
  const packetStreamEnabledRef = useRef(false);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const packetsResponse = await axios.get("/api/packets?page=1&limit=50");
        const initialPackets = Array.isArray(packetsResponse.data?.data)
          ? packetsResponse.data.data
          : Array.isArray(packetsResponse.data)
          ? packetsResponse.data
          : [];
        setPackets(initialPackets.slice(0, MAX_PACKETS));

        const totalPages = packetsResponse.data?.pagination?.totalPages || 1;
        setHasMore(page < totalPages);
      } catch (_error) {
        setPackets([]);
        setHasMore(false);
      }

      try {
        const statsResponse = await axios.get("/api/packets/stats");
        setStats(statsResponse.data || {});
      } catch (_error) {
        setStats({});
      }
    };

    loadInitialData();
  }, []);

  const { snifferStatus } = useSocket({
    receivePackets: packetStreamEnabledRef.current,
    onPacket: (newPacket) => {
      if (!packetStreamEnabledRef.current) {
        return;
      }

      setPackets((prev) => {
        const updated = [newPacket, ...prev];
        return updated.slice(0, 500);
      });
    },
    onStatus: (statusPayload) => {
      if (statusPayload?.status === "error") {
        setSnifferError(statusPayload.message || "Sniffer error");
      }
    }
  });

  useEffect(() => {
    if (snifferStatus === "running") {
      setIsSniffing(true);
      packetStreamEnabledRef.current = true;
    }

    if (snifferStatus === "stopped") {
      setIsSniffing(false);
      packetStreamEnabledRef.current = false;
    }

    if (snifferStatus === "error") {
      setIsSniffing(false);
      packetStreamEnabledRef.current = false;
      setSnifferError((current) => current || "Sniffer error");
    }
  }, [snifferStatus]);

  const startSniffer = async () => {
    setSnifferLoading(true);
    setSnifferError(null);

    try {
      await axios.post("/api/sniffer/start", {
        interface: filters.interface,
        filter: filters.bpfFilter
      });
      setIsSniffing(true);
      packetStreamEnabledRef.current = true;
    } catch (err) {
      setSnifferError(err.response?.data?.error || "Failed to start sniffer");
    } finally {
      setSnifferLoading(false);
    }
  };

  const stopSniffer = async () => {
    setSnifferLoading(true);
    packetStreamEnabledRef.current = false;
    setIsSniffing(false);

    try {
      await axios.post("/api/sniffer/stop");
    } catch (err) {
      packetStreamEnabledRef.current = true;
      setIsSniffing(true);
      setSnifferError(err.response?.data?.error || "Failed to stop sniffer");
    } finally {
      setSnifferLoading(false);
    }
  };

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearPackets = async () => {
    await axios.delete("/api/packets");
    setPackets([]);
    setHasMore(false);
  };

  const value = {
    packets,
    stats,
    isSniffing,
    snifferLoading,
    snifferError,
    filters,
    page,
    hasMore,
    setFilter,
    clearPackets,
    startSniffer,
    stopSniffer
  };

  return <PacketContext.Provider value={value}>{children}</PacketContext.Provider>;
}

export function usePacketContext() {
  const context = useContext(PacketContext);
  if (!context) {
    throw new Error("usePacketContext must be used within a PacketProvider.");
  }
  return context;
}
