import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { RiBarChartHorizontalLine } from "react-icons/ri";

function DarkTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="rounded-2xl border border-border bg-surface2 px-3 py-2 shadow-2xl shadow-black/30">
      <p className="font-mono text-xs text-textPrimary">{item.payload.ip}</p>
      <p className="mt-1 text-sm text-textSecondary">{item.value} packets</p>
    </div>
  );
}

function EmptyState({ title }) {
  return (
    <div className="flex h-[220px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface2/70 text-center">
      <RiBarChartHorizontalLine className="text-4xl text-textMuted" />
      <p className="mt-3 text-sm text-textSecondary">No data available for {title.toLowerCase()}.</p>
    </div>
  );
}

export default function IPBarChart({ data = [], title = "Top IPs" }) {
  if (!data.length) {
    return <EmptyState title={title} />;
  }

  const chartData = [...data].slice(0, 6);

  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.24em] text-textMuted">IP activity</p>
        <h3 className="mt-1 text-lg font-semibold text-textPrimary">{title}</h3>
      </div>

      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 12 }}>
            <defs>
              <linearGradient id={`ip-bar-gradient-${title.replace(/\s+/g, "-").toLowerCase()}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6C63FF" />
                <stop offset="100%" stopColor="#00D4AA" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(240,240,255,0.12)" strokeDasharray="4 6" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#8B8BA8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey="ip"
              width={96}
              tick={{ fill: "#F0F0FF", fontSize: 11, fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(34, 34, 58, 0.45)" }} />
            <Bar dataKey="count" radius={[0, 12, 12, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`${entry.ip}-${index}`}
                  fill={`url(#ip-bar-gradient-${title.replace(/\s+/g, "-").toLowerCase()})`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
