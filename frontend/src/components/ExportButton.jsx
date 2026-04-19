import React from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useState } from "react";
import { RiDownload2Line, RiLoader4Line } from "react-icons/ri";

export default function ExportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [didSucceed, setDidSucceed] = useState(false);

  const handleExport = async () => {
    setIsLoading(true);
    setDidSucceed(false);

    try {
      const response = await axios.get("http://localhost:5000/api/packets/export", {
        responseType: "blob"
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "packetscope-export.csv";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      setDidSucceed(true);
      window.setTimeout(() => setDidSucceed(false), 1400);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      type="button"
      onClick={handleExport}
      disabled={isLoading}
      animate={
        didSucceed
          ? {
              boxShadow: [
                "0 0 0 rgba(0,212,170,0)",
                "0 0 0 1px rgba(0,212,170,0.85), 0 0 24px rgba(0,212,170,0.3)",
                "0 0 0 rgba(0,212,170,0)"
              ]
            }
          : { boxShadow: "0 0 0 rgba(0,0,0,0)" }
      }
      transition={{ duration: 0.7 }}
      className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors ${
        didSucceed
          ? "border-accent2 bg-accent2/10 text-accent2"
          : "border-border bg-surface text-textPrimary hover:border-accent/40"
      } ${isLoading ? "cursor-not-allowed opacity-80" : ""}`}
    >
      {isLoading ? <RiLoader4Line className="animate-spin text-base" /> : <RiDownload2Line className="text-base" />}
      Export
    </motion.button>
  );
}
