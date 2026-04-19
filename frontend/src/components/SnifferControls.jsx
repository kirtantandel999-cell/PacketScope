import React from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  RiErrorWarningLine,
  RiLoader4Line,
  RiPlayCircleLine,
  RiStopCircleLine
} from "react-icons/ri";

import { usePacketContext } from "../context/PacketContext.jsx";

export default function SnifferControls() {
  const {
    isSniffing,
    snifferLoading,
    snifferError,
    filters,
    setFilter,
    startSniffer,
    stopSniffer,
    packets
  } = usePacketContext();
  const [interfaces, setInterfaces] = useState([]);
  const [ifaceLoading, setIfaceLoading] = useState(false);
  const [ifaceError, setIfaceError] = useState(false);

  useEffect(() => {
    const loadInterfaces = async () => {
      setIfaceLoading(true);
      try {
        const response = await axios.get("/api/sniffer/interfaces");
        setInterfaces(response.data?.interfaces || []);
        setIfaceError(false);
      } catch (_error) {
        setIfaceError(true);
      } finally {
        setIfaceLoading(false);
      }
    };

    loadInterfaces();
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-border bg-surface px-5 py-5"
    >
      <div className="flex flex-row items-center gap-3">
        <button
          type="button"
          onClick={isSniffing ? stopSniffer : startSniffer}
          disabled={snifferLoading}
          className={`rounded-xl px-6 py-2.5 font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 ${
            isSniffing ? "bg-danger text-white" : "bg-accent text-white"
          }`}
        >
          {snifferLoading ? (
            <RiLoader4Line className="animate-spin" />
          ) : isSniffing ? (
            <RiStopCircleLine />
          ) : (
            <RiPlayCircleLine />
          )}
          {isSniffing ? "Stop Sniffer" : "Start Sniffer"}
        </button>

        {ifaceLoading ? (
          <select
            disabled
            className="bg-surface2 border border-border rounded-lg px-3 py-2 text-textPrimary text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-w-[200px]"
          >
            <option>Loading interfaces...</option>
          </select>
        ) : ifaceError || interfaces.length === 0 ? (
          <input
            type="text"
            value={filters.interface}
            onChange={(e) => setFilter("interface", e.target.value)}
            placeholder="Interface (e.g. eth0)"
            className="bg-surface2 border border-border rounded-lg px-3 py-2 text-textPrimary text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-w-[200px]"
          />
        ) : (
          <select
            value={filters.interface}
            onChange={(e) => setFilter("interface", e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-3 py-2 text-textPrimary text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-w-[200px]"
          >
            <option value="">Auto-detect</option>
            {interfaces.map((i) => (
              <option key={i.name} value={i.name}>
                {i.description || i.name}
                {i.ip ? ` - ${i.ip}` : ""}
              </option>
            ))}
          </select>
        )}

        <input
          type="text"
          value={filters.bpfFilter}
          onChange={(e) => setFilter("bpfFilter", e.target.value)}
          placeholder="BPF filter (e.g. tcp port 80)"
          disabled={isSniffing}
          className="bg-surface2 border border-border rounded-lg px-3 py-2
                   text-textPrimary text-sm focus:border-accent
                   focus:outline-none focus:ring-1 focus:ring-accent
                   flex-1 disabled:opacity-40"
        />

        <span
          className="bg-accent/10 text-accent border border-accent/30
                       font-mono text-xs px-3 py-1.5 rounded-full"
        >
          {packets.length} pkts
        </span>
      </div>

      {snifferError !== null ? (
        <p className="text-danger text-xs mt-2 flex items-center gap-1">
          <RiErrorWarningLine /> {snifferError}
        </p>
      ) : null}
    </motion.section>
  );
}
