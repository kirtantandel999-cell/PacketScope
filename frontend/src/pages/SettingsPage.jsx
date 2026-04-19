import React from "react";
import axios from "axios";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { usePacketContext } from "../context/PacketContext.jsx";
import PageTransition from "./PageTransition.jsx";

const DEFAULT_DISPLAY_SETTINGS = {
  perPage: 50,
  autoScroll: true,
  showPayload: true
};

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold text-textPrimary">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface2 px-4 py-3">
      <span className="text-sm text-textPrimary">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors ${checked ? "bg-accent2" : "bg-surface3"}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </label>
  );
}

export default function SettingsPage() {
  const context = usePacketContext();
  const { filters, setFilter, clearPackets } = context;
  const [mongoStatus, setMongoStatus] = useState("checking");
  const [showConfirm, setShowConfirm] = useState(false);
  const [displaySettings, setDisplaySettings] = useState(DEFAULT_DISPLAY_SETTINGS);

  const safeFilters = filters ?? {
    interface: "",
    bpfFilter: ""
  };
  const safeDisplaySettings = displaySettings ?? DEFAULT_DISPLAY_SETTINGS;

  useEffect(() => {
    axios
      .get("http://localhost:5000/health")
      .then(({ data }) => {
        setMongoStatus(data.database || "unknown");
      })
      .catch(() => {
        setMongoStatus("offline");
      });
  }, []);

  return (
    <PageTransition>
      <div className="grid gap-6">
        <Section title="Sniffer Settings">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm text-textSecondary">Interface</span>
              <input
                value={safeFilters.interface ?? ""}
                onChange={(event) => setFilter("interface", event.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-surface2 px-4 text-sm text-textPrimary outline-none focus:border-accent"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-textSecondary">BPF Filter</span>
              <input
                value={safeFilters.bpfFilter ?? ""}
                onChange={(event) => setFilter("bpfFilter", event.target.value)}
                className="h-11 w-full rounded-2xl border border-border bg-surface2 px-4 text-sm text-textPrimary outline-none focus:border-accent2"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-textSecondary">Max Packets</span>
              <input
                type="number"
                value={500}
                readOnly
                className="h-11 w-full rounded-2xl border border-border bg-surface2 px-4 text-sm text-textMuted outline-none"
              />
            </label>
          </div>
        </Section>

        <Section title="Display Settings">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-textSecondary">Per-page rows</span>
              <select
                value={safeDisplaySettings.perPage ?? DEFAULT_DISPLAY_SETTINGS.perPage}
                onChange={(event) => setDisplaySettings((current) => ({ ...current, perPage: Number(event.target.value) }))}
                className="h-11 w-full rounded-2xl border border-border bg-surface2 px-4 text-sm text-textPrimary outline-none focus:border-accent"
              >
                {[25, 50, 100].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-3">
              <Toggle
                checked={safeDisplaySettings.autoScroll ?? DEFAULT_DISPLAY_SETTINGS.autoScroll}
                onChange={(next) => setDisplaySettings((current) => ({ ...current, autoScroll: next }))}
                label="Auto-scroll live packet feed"
              />
              <Toggle
                checked={safeDisplaySettings.showPayload ?? DEFAULT_DISPLAY_SETTINGS.showPayload}
                onChange={(next) => setDisplaySettings((current) => ({ ...current, showPayload: next }))}
                label="Show payload preview"
              />
            </div>
          </div>
        </Section>

        <Section title="Database">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-textSecondary">MongoDB connection status</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${mongoStatus === "connected" ? "bg-accent2" : "bg-danger"}`} />
                <span className="font-mono text-sm text-textPrimary">{mongoStatus}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/15"
            >
              Clear All Packets
            </button>
          </div>
        </Section>

        <Section title="About">
          <div className="space-y-4">
            <div>
              <p className="text-xl font-semibold text-textPrimary">PacketScope</p>
              <p className="mt-1 text-sm text-textSecondary">Version 1.0.0</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["React", "Vite", "Tailwind CSS", "Framer Motion", "Express", "MongoDB", "Socket.IO", "Scapy"].map((item) => (
                <span key={item} className="rounded-full border border-border bg-surface2 px-3 py-1 text-xs text-textSecondary">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {showConfirm ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md rounded-3xl border border-border bg-surface p-6"
          >
            <h3 className="text-lg font-semibold text-textPrimary">Clear all packet data?</h3>
            <p className="mt-2 text-sm text-textSecondary">This removes all stored packets from MongoDB and clears the live table.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="rounded-2xl border border-border bg-surface2 px-4 py-2 text-sm text-textPrimary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearPackets();
                  setShowConfirm(false);
                }}
                className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-medium text-danger"
              >
                Confirm Clear
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </PageTransition>
  );
}
