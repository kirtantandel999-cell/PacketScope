import React from "react";

import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { RiBarChartBoxLine, RiDashboardLine, RiSettings3Line, RiStackLine } from "react-icons/ri";

import { usePacketContext } from "../context/PacketContext.jsx";

const navItems = [
  { label: "Dashboard", to: "/", icon: RiDashboardLine },
  { label: "Packets", to: "/packets", icon: RiStackLine },
  { label: "Analytics", to: "/analytics", icon: RiBarChartBoxLine },
  { label: "Settings", to: "/settings", icon: RiSettings3Line }
];

function HexagonLogo() {
  return (
    <svg viewBox="0 0 100 100" className="h-10 w-10">
      <defs>
        <linearGradient id="packetscope-hex" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6C63FF" />
          <stop offset="100%" stopColor="#00D4AA" />
        </linearGradient>
      </defs>
      <polygon
        points="50,6 84,25 84,75 50,94 16,75 16,25"
        fill="url(#packetscope-hex)"
        stroke="#F0F0FF"
        strokeOpacity="0.22"
        strokeWidth="2"
      />
      <path d="M35 36h30M30 50h40M35 64h30" stroke="#0A0A0F" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export default function Sidebar() {
  const { isSniffing, snifferStatus } = usePacketContext();

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-[240px] flex-col border-r border-border bg-surface">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-1 flex-col px-5 py-6"
      >
        <div className="mb-10 flex items-center gap-3">
          <HexagonLogo />
          <div>
            <p className="text-lg font-semibold tracking-wide text-textPrimary">PacketScope</p>
            <p className="text-xs uppercase tracking-[0.3em] text-textMuted">Telemetry</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.div
                key={item.to}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "group relative flex items-center gap-3 rounded-2xl border border-transparent px-4 py-3 text-sm transition-colors",
                      isActive
                        ? "border-border bg-surface3 text-textPrimary"
                        : "text-textSecondary hover:bg-surface2 hover:text-textPrimary"
                    ].join(" ")
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`absolute left-0 top-2 h-[calc(100%-16px)] w-1 rounded-r-full ${
                          isActive ? "bg-accent" : "bg-transparent"
                        }`}
                      />
                      <Icon className={`text-lg ${isActive ? "text-accent" : "text-textSecondary group-hover:text-accent2"}`} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="rounded-2xl border border-border bg-surface2 px-4 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3 items-center justify-center">
              <span className={`h-2.5 w-2.5 rounded-full ${isSniffing ? "bg-accent2" : "bg-danger"}`} />
              {isSniffing ? (
                <motion.span
                  className="absolute inset-0 rounded-full bg-accent2/50"
                  animate={{ scale: [1, 1.9], opacity: [0.5, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                />
              ) : null}
            </div>
            <div>
              <p className="text-sm font-medium text-textPrimary">{isSniffing ? "Sniffer active" : "Sniffer offline"}</p>
              <p className="text-xs uppercase tracking-[0.24em] text-textMuted">{snifferStatus}</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </aside>
  );
}
