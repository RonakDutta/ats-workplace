import React, { useState, useEffect } from "react";
import { fetchSystemMetrics } from "../services/api";
import { Users, Briefcase, Award, Zap, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

const MetricsView = () => {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const data = await fetchSystemMetrics();
        setMetrics(data);
      } catch (error) {
        console.error("Failed to load metrics");
      } finally {
        setIsLoading(false);
      }
    };
    loadMetrics();
  }, []);

  // React Query
  // const { data: metrics, isLoading } = useQuery({
  //   queryKey: ["system-metrics"],
  //   queryFn: fetchSystemMetrics,
  // });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50/50">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium animate-pulse">
          Crunching system data...
        </p>
      </div>
    );
  }

  if (!metrics) return null;

  // Format the Pie Chart Data
  const pieData = [
    {
      name: "Top Tier (>80%)",
      value: Number(metrics.distribution.top_tier) || 0,
      color: "#10b981",
    }, // Emerald
    {
      name: "Good Fit (60-79%)",
      value: Number(metrics.distribution.good_fit) || 0,
      color: "#6366f1",
    }, // Indigo
    {
      name: "Poor Fit (<60%)",
      value: Number(metrics.distribution.poor_fit) || 0,
      color: "#fc0303",
    }, // Zinc
  ];

  return (
    <div className="min-h-screen bg-zinc-50/50 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            System Metrics
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time pipeline analytics and AI engine health.
          </p>
        </div>

        {/* 1. TOP LEVEL KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <KpiCard
            icon={<Users />}
            label="Total Candidates"
            value={metrics.kpis.total_candidates}
            color="text-blue-500"
            bg="bg-blue-50"
          />
          <KpiCard
            icon={<Briefcase />}
            label="Active Job Roles"
            value={metrics.kpis.total_roles}
            color="text-purple-500"
            bg="bg-purple-50"
          />
          <KpiCard
            icon={<Award />}
            label="Avg Match Score"
            value={`${metrics.kpis.avg_score}%`}
            color="text-emerald-500"
            bg="bg-emerald-50"
          />
          <KpiCard
            icon={<Zap />}
            label="API Health"
            value="Stable"
            subtext="Gemini 2.5 Flash"
            color="text-amber-500"
            bg="bg-amber-50"
          />
        </div>

        {/* 2. THE CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SKILL GAP BAR CHART */}
          <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">
              Market Skill Gap (Most Missing Skills)
            </h2>
            <div className="h-75 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.skillGap}
                  layout="vertical"
                  margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="skill"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 13, fontWeight: 500 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f4f4f5" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#6366f1"
                    radius={[0, 8, 8, 0]}
                    barSize={24}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TALENT DISTRIBUTION DONUT */}
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm flex flex-col">
            <h2 className="text-lg font-bold text-zinc-900 mb-2">
              Talent Distribution
            </h2>
            <div className="flex-1 min-h-75">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex flex-col gap-2 mt-4">
              {pieData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-zinc-600 font-medium">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-zinc-900 font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PROCESSING VOLUME LINE CHART */}
          <div className="lg:col-span-3 bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">
              Processing Volume (Last 7 Days)
            </h2>
            <div className="h-62.5 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics.volume}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e4e4e7"
                  />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                    dx={-10}
                  />
                  <Tooltip
                    cursor={{ stroke: "#e4e4e7", strokeWidth: 2 }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#10b981",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Component for the KPI Cards
const KpiCard = ({ icon, label, value, subtext, color, bg }) => (
  <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
    <div className={`p-3 rounded-lg ${bg} ${color}`}>
      {React.cloneElement(icon, { className: "w-6 h-6" })}
    </div>
    <div>
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-black text-zinc-900">{value || 0}</h3>
        {subtext && (
          <span className="text-xs font-semibold text-zinc-400">{subtext}</span>
        )}
      </div>
    </div>
  </div>
);

export default MetricsView;
