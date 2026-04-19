import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { RiLineChartLine } from "react-icons/ri";

const protocolColors = {
  TCP: "#00D4AA",
  UDP: "#F59E0B",
  ICMP: "#EF4444",
  ARP: "#3B82F6",
  OTHER: "#6C63FF"
};

function DarkTooltip({ active, label, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-surface2 px-3 py-2 shadow-2xl shadow-black/30">
      <p className="font-mono text-xs text-textPrimary">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span style={{ color: entry.color }}>{entry.dataKey}</span>
            <span className="text-textSecondary">{entry.value} pkt/s</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[240px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface2/70 text-center">
      <RiLineChartLine className="text-4xl text-textMuted" />
      <p className="mt-3 text-sm text-textSecondary">No recent traffic samples available.</p>
    </div>
  );
}

export default function TrafficLineChart({ data = [] }) {
  if (!data.length) {
    return <EmptyState />;
  }

  const protocols = Object.keys(protocolColors).filter((protocol) => data.some((entry) => entry[protocol] !== undefined));

  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.24em] text-textMuted">Traffic</p>
        <h3 className="mt-1 text-lg font-semibold text-textPrimary">Packets per second</h3>
      </div>

      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.slice(-60)}>
            <CartesianGrid stroke="rgba(240,240,255,0.3)" strokeDasharray="4 6" />
            <XAxis dataKey="time" tick={{ fill: "#8B8BA8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#8B8BA8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<DarkTooltip />} />
            <Legend wrapperStyle={{ color: "#F0F0FF", fontSize: "12px" }} />
            {protocols.map((protocol) => (
              <Line
                key={protocol}
                type="monotone"
                dataKey={protocol}
                stroke={protocolColors[protocol]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
