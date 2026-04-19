import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RiCloseLine } from "react-icons/ri";

import StatusBadge from "./StatusBadge.jsx";
import { formatFlags, formatSize, formatTimestamp } from "../utils/formatPacket.js";

function SectionTitle({ children }) {
  return (
    <div className="border-b border-border pb-2">
      <p className="text-xs uppercase tracking-[0.24em] text-textMuted">{children}</p>
    </div>
  );
}

function DetailRow({ label, value, valueClassName = "text-textPrimary" }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <span className="text-sm text-textSecondary">{label}</span>
      <span className={`text-right text-sm ${valueClassName}`}>{value ?? "-"}</span>
    </div>
  );
}

export default function PacketDetailDrawer({ packet, open, onClose }) {
  const flags = formatFlags(packet?.flags);

  return (
    <AnimatePresence>
      {open && packet ? (
        <>
          <motion.button
            type="button"
            aria-label="Close packet details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: 420 }}
            animate={{ x: 0 }}
            exit={{ x: 420 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-[420px] flex-col border-l border-border bg-surface"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <StatusBadge protocol={packet.protocol} />
                <div>
                  <p className="text-sm font-semibold text-textPrimary">Packet details</p>
                  <p className="font-mono text-xs text-textMuted">{formatTimestamp(packet.timestamp)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-surface2 text-textSecondary transition-colors hover:bg-surface3 hover:text-textPrimary"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              <section className="space-y-3">
                <SectionTitle>Header</SectionTitle>
                <DetailRow label="Timestamp" value={new Date(packet.timestamp).toISOString()} valueClassName="font-mono text-textPrimary" />
                <DetailRow label="Protocol" value={packet.protocol} valueClassName="font-mono text-textPrimary" />
                <DetailRow label="Length" value={formatSize(packet.length)} />
              </section>

              <section className="space-y-3">
                <SectionTitle>Network layer</SectionTitle>
                <DetailRow label="Source IP" value={packet.src_ip || "-"} valueClassName="font-mono text-accent2" />
                <DetailRow label="Destination IP" value={packet.dst_ip || "-"} valueClassName="font-mono text-info" />
                <DetailRow label="TTL" value={packet.ttl ?? "-"} />
              </section>

              <section className="space-y-3">
                <SectionTitle>Transport layer</SectionTitle>
                <DetailRow label="Source Port" value={packet.src_port ?? "-"} valueClassName="font-mono text-textPrimary" />
                <DetailRow label="Destination Port" value={packet.dst_port ?? "-"} valueClassName="font-mono text-textPrimary" />
                <div className="space-y-2 py-2">
                  <span className="text-sm text-textSecondary">Flags</span>
                  <div className="flex flex-wrap gap-2">
                    {flags.length ? (
                      flags.map((flag) => (
                        <span
                          key={flag}
                          className="rounded-full border border-accent/25 bg-surface3 px-3 py-1 font-mono text-xs text-textPrimary"
                        >
                          {flag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-textMuted">No transport flags present</span>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <SectionTitle>Payload hex preview</SectionTitle>
                <div className="rounded-2xl border border-border bg-surface2 p-4">
                  <code className="block break-all font-mono text-xs leading-6 text-textPrimary">
                    {packet.payload_preview || "No payload preview available."}
                  </code>
                </div>
              </section>

              <section className="space-y-3">
                <SectionTitle>Raw summary</SectionTitle>
                <pre className="overflow-x-auto rounded-2xl border border-border bg-surface2 p-4 font-mono text-xs leading-6 text-textSecondary">
                  <code>{packet.raw_summary || "No summary available."}</code>
                </pre>
              </section>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
