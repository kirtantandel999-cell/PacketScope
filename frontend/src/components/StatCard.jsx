import React from "react";
import { animate, motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function StatCard({ title, value = 0, icon, color = "#6C63FF", delta, subtitle }) {
  const [displayValue, setDisplayValue] = useState(0);
  const Icon = icon;
  const numericValue = Number(value);

  useEffect(() => {
    if (!Number.isFinite(numericValue)) {
      setDisplayValue(value);
      return undefined;
    }

    const controls = animate(displayValue || 0, numericValue, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (latest) => {
        setDisplayValue(Math.round(latest));
      }
    });

    return () => controls.stop();
  }, [numericValue]);

  const formattedValue = Number.isFinite(numericValue) ? displayValue.toLocaleString() : value;
  const isPositiveDelta = typeof delta === "string" ? !delta.startsWith("-") : Number(delta) >= 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35 }}
      className="relative overflow-hidden rounded-3xl border border-border bg-surface2 p-5"
      style={{ boxShadow: `0 0 0 1px ${color}20, 0 0 28px ${color}25` }}
    >
      <div
        className="absolute inset-x-8 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-textSecondary">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-textPrimary">{formattedValue}</p>
          {subtitle ? <p className="mt-2 text-sm text-textMuted">{subtitle}</p> : null}
        </div>
        <motion.div
          whileHover={{ rotate: 6, scale: 1.05 }}
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface3"
          style={{ color }}
        >
          {Icon ? <Icon className="text-xl" /> : null}
        </motion.div>
      </div>

      {delta !== undefined && delta !== null ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className={`mt-5 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
            isPositiveDelta
              ? "border-accent2/30 bg-accent2/10 text-accent2"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {isPositiveDelta ? "+" : ""}
          {delta}
        </motion.div>
      ) : null}
    </motion.article>
  );
}
