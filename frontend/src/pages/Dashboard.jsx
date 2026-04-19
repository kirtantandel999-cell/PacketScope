import React from "react";
import { Link } from "react-router-dom";
import { RiArrowRightLine, RiDatabase2Line, RiDownloadCloudLine, RiExchangeFundsLine, RiStackLine } from "react-icons/ri";

import IPBarChart from "../components/IPBarChart.jsx";
import PacketTable from "../components/PacketTable.jsx";
import ProtocolPieChart from "../components/ProtocolPieChart.jsx";
import StatCard from "../components/StatCard.jsx";
import TrafficLineChart from "../components/TrafficLineChart.jsx";
import { usePacketContext } from "../context/PacketContext.jsx";
import PageTransition from "./PageTransition.jsx";

const toProtocolArray = (byProtocol = {}) =>
  Object.entries(byProtocol).map(([protocol, count]) => ({ protocol, count }));

const toTrafficSeries = (packets = []) => {
  const now = Date.now();
  const buckets = Array.from({ length: 60 }, (_value, index) => {
    const timestamp = new Date(now - (59 - index) * 1000);
    return {
      time: timestamp.toLocaleTimeString([], {
        minute: "2-digit",
        second: "2-digit"
      }),
      key: Math.floor(timestamp.getTime() / 1000),
      TCP: 0,
      UDP: 0,
      ICMP: 0,
      ARP: 0,
      OTHER: 0
    };
  });

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  packets.forEach((packet) => {
    const date = new Date(packet.timestamp);
    const key = Math.floor(date.getTime() / 1000);
    const bucket = bucketMap.get(key);

    if (!bucket) {
      return;
    }

    const protocol = ["TCP", "UDP", "ICMP", "ARP"].includes(packet.protocol) ? packet.protocol : "OTHER";
    bucket[protocol] += 1;
  });

  return buckets.map(({ key, ...rest }) => rest);
};

export default function Dashboard() {
  const { packets, stats } = usePacketContext();
  const tcpCount = stats.byProtocol?.TCP || 0;
  const udpCount = stats.byProtocol?.UDP || 0;
  const totalTransferred = packets.reduce((sum, packet) => sum + (packet.length || 0), 0);

  return (
    <PageTransition>
      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard title="Total Packets" value={stats.total} icon={RiStackLine} color="#6C63FF" subtitle="Captured across all protocols" />
        <StatCard title="TCP" value={tcpCount} icon={RiExchangeFundsLine} color="#00D4AA" subtitle="Connection-oriented traffic" />
        <StatCard title="UDP" value={udpCount} icon={RiDownloadCloudLine} color="#F59E0B" subtitle="Datagram traffic" />
        <StatCard title="Data Transferred" value={totalTransferred} icon={RiDatabase2Line} color="#3B82F6" subtitle="Bytes in current buffer" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <TrafficLineChart data={toTrafficSeries(packets)} />
        <ProtocolPieChart data={toProtocolArray(stats.byProtocol)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <IPBarChart data={stats.topSrcIPs} title="Top source IPs" />
        <IPBarChart data={stats.topDstIPs} title="Top destination IPs" />
      </section>

      <section className="rounded-3xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-textMuted">Packets</p>
            <h2 className="mt-1 text-xl font-semibold text-textPrimary">Latest 10 captures</h2>
          </div>
          <Link
            to="/packets"
            className="inline-flex items-center gap-2 rounded-2xl border border-border bg-surface2 px-4 py-2 text-sm font-medium text-textPrimary transition-colors hover:bg-surface3"
          >
            View All
            <RiArrowRightLine />
          </Link>
        </div>

        <PacketTable packets={packets.slice(0, 10)} compact />
      </section>
    </PageTransition>
  );
}
