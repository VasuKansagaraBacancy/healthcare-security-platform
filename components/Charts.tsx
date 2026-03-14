"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeverityChartPoint, TrainingChartPoint, TrendChartPoint } from "@/types/database";

interface ChartsProps {
  riskTrendSeries: TrendChartPoint[];
  severitySeries: SeverityChartPoint[];
  incidentStatusSeries: SeverityChartPoint[];
  trainingCompletionSeries: TrainingChartPoint[];
}

export function Charts({
  riskTrendSeries,
  severitySeries,
  incidentStatusSeries,
  trainingCompletionSeries,
}: ChartsProps) {
  const cards = [
    {
      eyebrow: "Risk trend",
      title: "Overall security risk score movement",
      accent: "text-rose-300",
      summary: `${riskTrendSeries.at(-1)?.value ?? 0} current score`,
      chart: (
        <LineChart data={riskTrendSeries}>
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
          <Line type="monotone" dataKey="value" stroke="#fb7185" strokeWidth={3} dot />
        </LineChart>
      ),
    },
    {
      eyebrow: "Vulnerability mix",
      title: "Severity distribution across tracked assets",
      accent: "text-teal-300",
      summary: `${severitySeries.reduce((sum, item) => sum + item.value, 0)} tracked findings`,
      chart: (
        <BarChart data={severitySeries}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
          <XAxis dataKey="label" stroke="#94a3b8" fontSize={12} />
          <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            contentStyle={{
              backgroundColor: "#08111d",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              borderRadius: "16px",
            }}
          />
          <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#2dd4bf" />
        </BarChart>
      ),
    },
    {
      eyebrow: "Incident status",
      title: "Current incident lifecycle distribution",
      accent: "text-orange-300",
      summary: `${incidentStatusSeries.reduce((sum, item) => sum + item.value, 0)} incident records`,
      chart: (
        <BarChart data={incidentStatusSeries}>
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
          <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#fb923c" />
        </BarChart>
      ),
    },
    {
      eyebrow: "Training completion",
      title: "Staff training readiness by status",
      accent: "text-emerald-300",
      summary: `${trainingCompletionSeries.find((item) => item.label === "Completed")?.value ?? 0} completed`,
      chart: (
        <BarChart data={trainingCompletionSeries}>
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
          <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#34d399" />
        </BarChart>
      ),
    },
  ];

  return (
    <section className="grid gap-5 xl:grid-cols-2">
      {cards.map((item) => (
        <article key={item.title} className="glass-panel rounded-[30px] p-6 sm:p-7">
          <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className={`font-mono text-xs uppercase tracking-[0.24em] ${item.accent}`}>
                {item.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
            </div>
            <div className="metric-chip rounded-2xl px-4 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Snapshot
              </p>
              <p className="mt-2 text-sm font-medium text-white">{item.summary}</p>
            </div>
          </div>
          <div className="h-72 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              {item.chart}
            </ResponsiveContainer>
          </div>
        </article>
      ))}
    </section>
  );
}
