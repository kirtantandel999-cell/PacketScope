import React from "react";
import { motion } from "framer-motion";

const protocolStyles = {
  TCP: { bg: "bg-accent2/10", border: "border-accent2/25", text: "text-accent2", dot: "bg-accent2" },
  UDP: { bg: "bg-warning/10", border: "border-warning/25", text: "text-warning", dot: "bg-warning" },
  ICMP: { bg: "bg-danger/10", border: "border-danger/25", text: "text-danger", dot: "bg-danger" },
  ARP: { bg: "bg-info/10", border: "border-info/25", text: "text-info", dot: "bg-info" },
  OTHER: { bg: "bg-surface3", border: "border-border", text: "text-textSecondary", dot: "bg-textMuted" }
};

export default function StatusBadge({ protocol = "OTHER" }) {
  const key = String(protocol || "OTHER").toUpperCase();
  const styles = protocolStyles[key] || protocolStyles.OTHER;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-xs ${styles.bg} ${styles.border} ${styles.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      {key}
    </motion.span>
  );
}
