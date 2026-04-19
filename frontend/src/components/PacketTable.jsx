import React from "react";
import { motion } from "framer-motion";
import { RiWifiOffLine } from "react-icons/ri";

import StatusBadge from "./StatusBadge.jsx";
import { formatFlags, formatSize, formatTimestamp } from "../utils/formatPacket.js";

function EmptyState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface2/70 px-6 text-center">
      <RiWifiOffLine className="text-4xl text-textMuted" />
      <h3 className="mt-4 text-lg font-semibold text-textPrimary">No packets to display</h3>
      <p className="mt-2 max-w-md text-sm text-textSecondary">
        Start the sniffer or adjust your filters to populate the live traffic table.
      </p>
    </div>
  );
}

export default function PacketTable({ packets = [], compact = false, onRowClick }) {
  if (!packets.length) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="max-h-[560px] overflow-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="text-left text-xs uppercase tracking-[0.2em] text-textMuted">
              {["#", "Time", "Protocol", "Src IP", "Src Port", "Dst IP", "Dst Port", "Length", "Flags"].map((column) => (
                <th key={column} className="border-b border-border px-4 py-3 font-medium backdrop-blur">
                  {column}
                </th>
              ))}
            </tr>
          </thead>

          <motion.tbody initial={{ opacity: 1 }} animate={{ opacity: 1 }}>
              {packets.map((packet, index) => {
                const flags = formatFlags(packet.flags);

                return (
                  <motion.tr
                    key={packet.id || `${packet.timestamp}-${packet.src_ip}-${packet.dst_ip}-${index}`}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: Math.min(index * 0.03, 0.25), duration: 0.28 }}
                    onClick={() => onRowClick?.(packet)}
                    className={`border-b border-border/70 text-sm transition-colors ${
                      index % 2 === 0 ? "bg-surface" : "bg-surface2/70"
                    } ${onRowClick ? "cursor-pointer hover:bg-surface3" : "hover:bg-surface3"}`}
                  >
                    <td className="px-4 py-3 text-textMuted">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-textPrimary">{formatTimestamp(packet.timestamp)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge protocol={packet.protocol} />
                    </td>
                    <td className="px-4 py-3 font-mono text-accent2">{packet.src_ip || "-"}</td>
                    <td className="px-4 py-3 text-textSecondary">{packet.src_port ?? "-"}</td>
                    <td className="px-4 py-3 font-mono text-info">{packet.dst_ip || "-"}</td>
                    <td className="px-4 py-3 text-textSecondary">{packet.dst_port ?? "-"}</td>
                    <td className="px-4 py-3 text-textPrimary">{compact ? packet.length ?? 0 : formatSize(packet.length)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {flags.length ? (
                          flags.map((flag) => (
                            <span
                              key={flag}
                              className="rounded-full border border-border bg-surface3 px-2 py-0.5 font-mono text-[11px] text-textSecondary"
                            >
                              {flag}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-textMuted">-</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
          </motion.tbody>
        </table>
      </div>
    </div>
  );
}
