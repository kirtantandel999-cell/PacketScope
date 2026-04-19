import React from "react";
import { motion } from "framer-motion";
import { RiSearchLine } from "react-icons/ri";

import { usePacketContext } from "../context/PacketContext.jsx";

const protocolOptions = ["ALL", "TCP", "UDP", "ICMP", "ARP", "OTHER"];

export default function FilterBar() {
  const { filters, setFilter } = usePacketContext();
  const activeProtocol = (filters.protocol || "ALL").toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-4 rounded-3xl border border-border bg-surface px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="flex flex-wrap gap-2">
        {protocolOptions.map((protocol) => {
          const isActive = activeProtocol === protocol;

          return (
            <motion.button
              key={protocol}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setFilter("protocol", protocol)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.2em] transition-colors ${
                isActive
                  ? "border-accent bg-accent/15 text-textPrimary"
                  : "border-border bg-surface2 text-textSecondary hover:border-accent2/30 hover:text-textPrimary"
              }`}
            >
              {protocol}
            </motion.button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block">
          <RiSearchLine className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" />
          <input
            type="text"
            value={filters.search}
            onChange={(event) => setFilter("search", event.target.value)}
            placeholder="Search IP, summary, payload"
            className="h-11 w-full min-w-[260px] rounded-2xl border border-border bg-surface2 pl-10 pr-4 text-sm text-textPrimary outline-none transition-colors placeholder:text-textMuted focus:border-accent"
          />
        </label>

        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => {
            setFilter("protocol", "ALL");
            setFilter("search", "");
            setFilter("srcIp", "");
          }}
          className="h-11 rounded-2xl border border-danger/30 bg-danger/10 px-4 text-sm font-medium text-danger transition-colors hover:bg-danger/15"
        >
          Clear All
        </motion.button>
      </div>
    </motion.div>
  );
}
