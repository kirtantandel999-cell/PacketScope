import React from "react";
import { RiBarChartGroupedLine, RiFlashlightLine, RiRadarLine, RiTimerFlashLine } from "react-icons/ri";

import IPBarChart from "../components/IPBarChart.jsx";
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

export default function AnalyticsPage() {
  const { stats, packets } = usePacketContext();
  const ppmValues = stats.packetsPerMinute?.map((item) => item.count) || [];
  const peakPerMinute = ppmValues.length ? Math.max(...ppmValues) : 0;

  return (
    <PageTransition>
      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard title="Total Packets" value={stats.total} icon={RiBarChartGroupedLine} color="#6C63FF" subtitle="All indexed packets" />
        <StatCard title="Average Size" value={Math.round(stats.avgSize || 0)} icon={RiFlashlightLine} color="#00D4AA" subtitle="Bytes per packet" />
        <StatCard title="Active Sources" value={stats.topSrcIPs?.length || 0} icon={RiRadarLine} color="#3B82F6" subtitle="Top talkers tracked" />
        <StatCard title="Peak Per Minute" value={peakPerMinute} icon={RiTimerFlashLine} color="#F59E0B" subtitle="Highest recorded burst" />
      </section>

      <TrafficLineChart data={toTrafficSeries(packets)} />

      <section className="grid gap-6 xl:grid-cols-2">
        <ProtocolPieChart data={toProtocolArray(stats.byProtocol)} />
        <IPBarChart data={stats.topSrcIPs} title="Top source IPs" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <IPBarChart data={stats.topDstIPs} title="Top destination IPs" />
        <article className="rounded-3xl border border-border bg-surface p-5">
          <p className="text-sm uppercase tracking-[0.24em] text-textMuted">Packets per minute</p>
          <p className="mt-4 text-5xl font-semibold text-textPrimary">{(stats.packetsPerMinute?.at(-1)?.count || 0).toLocaleString()}</p>
          <p className="mt-3 text-sm text-textSecondary">Latest recorded minute. Use this to spot current traffic spikes at a glance.</p>
        </article>
      </section>
    </PageTransition>
  );
}
