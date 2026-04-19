import React from "react";
import { useState } from "react";
import { motion } from "framer-motion";

import ExportButton from "../components/ExportButton.jsx";
import FilterBar from "../components/FilterBar.jsx";
import PacketDetailDrawer from "../components/PacketDetailDrawer.jsx";
import PacketTable from "../components/PacketTable.jsx";
import SnifferControls from "../components/SnifferControls.jsx";
import { usePacketContext } from "../context/PacketContext.jsx";
import PageTransition from "./PageTransition.jsx";

export default function PacketsPage() {
  const { packets, clearPackets, filters } = usePacketContext();
  const [selectedPacket, setSelectedPacket] = useState(null);
  const activeProtocol = (filters?.protocol || "ALL").toUpperCase();
  const searchValue = (filters?.search || "").trim().toLowerCase();
  const srcIpFilter = (filters?.srcIp || "").trim().toLowerCase();

  const filteredPackets = packets.filter((packet) => {
    const packetProtocol = String(packet?.protocol || "OTHER").toUpperCase();
    console.log("Packet filter check:", activeProtocol, packetProtocol);

    if (activeProtocol !== "ALL" && packetProtocol !== activeProtocol) {
      return false;
    }

    if (srcIpFilter && !String(packet?.src_ip || "").toLowerCase().includes(srcIpFilter)) {
      return false;
    }

    if (!searchValue) {
      return true;
    }

    const searchableFields = [
      packet?.src_ip,
      packet?.dst_ip,
      packet?.raw_summary,
      packet?.payload_preview
    ];

    return searchableFields.some((value) =>
      String(value || "")
        .toLowerCase()
        .includes(searchValue)
    );
  });

  return (
    <PageTransition>
      <SnifferControls />
      <FilterBar />

      <section className="rounded-3xl border border-border bg-surface p-5">
        <div className="max-h-[calc(100vh-280px)] overflow-hidden">
          <PacketTable packets={filteredPackets} onRowClick={setSelectedPacket} />
        </div>
      </section>

      <motion.footer
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="sticky bottom-4 z-10 flex items-center justify-between rounded-3xl border border-border bg-surface/95 px-5 py-4 backdrop-blur"
      >
        <p className="text-sm text-textSecondary">
          <span className="font-semibold text-textPrimary">{filteredPackets.length.toLocaleString()}</span> packets shown
        </p>
        <div className="flex items-center gap-3">
          <ExportButton />
          <button
            type="button"
            onClick={clearPackets}
            className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/15"
          >
            Clear
          </button>
        </div>
      </motion.footer>

      <PacketDetailDrawer packet={selectedPacket} open={Boolean(selectedPacket)} onClose={() => setSelectedPacket(null)} />
    </PageTransition>
  );
}
