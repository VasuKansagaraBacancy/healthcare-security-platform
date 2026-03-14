"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendChartPoint } from "@/types/database";

interface MetricTrendChartProps {
  title: string;
  eyebrow: string;
  color: string;
  data: TrendChartPoint[];
}

export function MetricTrendChart({ title, eyebrow, color, data }: MetricTrendChartProps) {
  return (
    <article className="glass-panel rounded-[28px] p-6 sm:p-7">
      <div className="mb-7">
        <p className="font-mono text-xs uppercase tracking-[0.24em]" style={{ color }}>
          {eyebrow}
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">{title}</h3>
      </div>
      <div className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
            <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
            <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#08111d",
                border: "1px solid rgba(148, 163, 184, 0.18)",
                borderRadius: "16px",
              }}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
