import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { usePacketContext } from "../context/PacketContext.jsx";
import ExportButton from "./ExportButton.jsx";

export default function Topbar({ title = "Dashboard" }) {
  const { packets, isSniffing } = usePacketContext();
  const packetCount = packets.length;
  const navigate = useNavigate();

  const handleProfileClick = () => {
    console.log("Profile avatar clicked");
    navigate("/settings");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed left-[240px] right-0 top-0 z-20 flex h-[60px] items-center justify-between border-b border-border bg-background/85 px-6 backdrop-blur"
    >
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-textMuted">PacketScope</p>
        <h1 className="text-lg font-semibold text-textPrimary">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <motion.div
          animate={{ boxShadow: isSniffing ? ["0 0 0 rgba(0,212,170,0)", "0 0 22px rgba(0,212,170,0.25)", "0 0 0 rgba(0,212,170,0)"] : "none" }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-medium text-textPrimary"
        >
          {packetCount.toLocaleString()} packets
        </motion.div>

        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
          <motion.span
            className={`h-2.5 w-2.5 rounded-full ${isSniffing ? "bg-danger" : "bg-textMuted"}`}
            animate={isSniffing ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-textSecondary">Live</span>
        </div>

        <ExportButton />

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={handleProfileClick}
          className="relative z-[1000] flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface3 text-sm font-semibold text-textPrimary transition-colors hover:border-accent/50 hover:bg-surface2 focus:outline-none focus:ring-2 focus:ring-accent/60"
          style={{ pointerEvents: "auto" }}
          aria-label="Open profile settings"
        >
          PS
        </motion.button>
      </div>
    </motion.header>
  );
}
