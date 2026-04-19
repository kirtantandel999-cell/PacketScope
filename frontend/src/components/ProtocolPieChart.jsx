import React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { RiPieChart2Line } from "react-icons/ri";

const protocolColors = {
  TCP: "#00D4AA",
  UDP: "#F59E0B",
  ICMP: "#EF4444",
  ARP: "#3B82F6",
  OTHER: "#6C63FF"
};

function DarkTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0];

  return (
    <div className="rounded-2xl border border-border bg-surface2 px-3 py-2 shadow-2xl shadow-black/30">
      <p className="font-mono text-xs text-textPrimary">{item.name}</p>
      <p className="mt-1 text-sm text-textSecondary">{item.value} packets</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface2/70 text-center">
      <RiPieChart2Line className="text-4xl text-textMuted" />
      <p className="mt-3 text-sm text-textSecondary">No protocol distribution yet.</p>
    </div>
  );
}

export default function ProtocolPieChart({ data = [] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  if (!data.length || total === 0) {
    return <EmptyState />;
  }

  const chartData = data.map((item) => ({
    name: item.protocol,
    value: item.count,
    percent: total ? (item.count / total) * 100 : 0
  }));

  return (
    <div className="rounded-3xl border border-border bg-surface p-5">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.24em] text-textMuted">Protocols</p>
        <h3 className="mt-1 text-lg font-semibold text-textPrimary">Traffic composition</h3>
      </div>

      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="38%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={3}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={protocolColors[entry.name] || protocolColors.OTHER} />
              ))}
            </Pie>
            <Tooltip content={<DarkTooltip />} />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              content={({ payload = [] }) => (
                <div className="space-y-3">
                  {payload.map((entry) => {
                    const item = chartData.find((candidate) => candidate.name === entry.value);
                    if (!item) {
                      return null;
                    }

                    return (
                      <div key={item.name} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: protocolColors[item.name] || protocolColors.OTHER }}
                          />
                          <span className="font-mono text-xs text-textPrimary">{item.name}</span>
                        </div>
                        <span className="text-xs text-textSecondary">
                          {item.value} • {item.percent.toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
