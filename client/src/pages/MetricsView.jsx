import React, { useState, useEffect } from "react";
import { fetchSystemMetrics } from "../services/api";
import {
  Users,
  Briefcase,
  Award,
  Zap,
  Loader2,
  TrendingUp,
} from "lucide-react";
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
  Area,
  AreaChart,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
        {label && <p className="text-zinc-400 mb-1">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} className="font-semibold">
            {p.name ? `${p.name}: ` : ""}
            {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const KpiCard = ({ icon, label, value, subtext, accent }) => {
  const accents = {
    blue: {
      ring: "ring-blue-100",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      bar: "bg-blue-400",
    },
    purple: {
      ring: "ring-purple-100",
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      bar: "bg-purple-400",
    },
    emerald: {
      ring: "ring-emerald-100",
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      bar: "bg-emerald-400",
    },
    amber: {
      ring: "ring-amber-100",
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      bar: "bg-amber-400",
    },
  };
  const a = accents[accent] || accents.blue;

  return (
    <div
      className={`relative bg-white rounded-2xl p-5 ring-1 ${a.ring} shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-200`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${a.bar} opacity-60`}
      />

      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${a.iconBg} ${a.iconColor}`}>
          {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <TrendingUp className="w-4 h-4 text-zinc-300" />
      </div>

      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-black text-zinc-900 leading-none">
          {value ?? 0}
        </h3>
        {subtext && (
          <span className="text-xs font-medium text-zinc-400">{subtext}</span>
        )}
      </div>
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl ring-1 ring-zinc-100 shadow-sm p-6 ${className}`}
  >
    <div className="mb-5">
      <h2 className="text-xl font-bold text-zinc-900">{title}</h2>
      {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

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

  if (isLoading) {
    return (
      <div className="max-w-7xl h-screen mx-auto px-6 py-32 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-medium animate-pulse">
          Loading metrics...
        </p>
      </div>
    );
  }

  if (!metrics) return null;

  const pieData = [
    {
      name: "Top Tier (>80%)",
      value: Number(metrics.distribution.top_tier) || 0,
      color: "#10b981",
    },
    {
      name: "Good Fit (60–79%)",
      value: Number(metrics.distribution.good_fit) || 0,
      color: "#6366f1",
    },
    {
      name: "Poor Fit (<60%)",
      value: Number(metrics.distribution.poor_fit) || 0,
      color: "#f43f5e",
    },
  ];

  const total = pieData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="min-h-screen bg-zinc-50/60 p-6 md:p-10 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="pt-12 lg:pt-0">
          <h1 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            System Metrics
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time pipeline analytics and AI engine health.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            icon={<Users />}
            label="Total Candidates"
            value={metrics.kpis.total_candidates}
            accent="blue"
          />
          <KpiCard
            icon={<Briefcase />}
            label="Active Roles"
            value={metrics.kpis.total_roles}
            accent="purple"
          />
          <KpiCard
            icon={<Award />}
            label="Avg Match Score"
            value={`${metrics.kpis.avg_score}%`}
            accent="emerald"
          />
          <KpiCard
            icon={<Zap />}
            label="API Health"
            value="Stable"
            subtext="Gemini 2.5"
            accent="amber"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ChartCard
            title="Market Skill Gap"
            subtitle="Most missing skills across all candidates"
            className="lg:col-span-2"
          >
            <div
              style={{ height: 280 }}
              className="[&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none!"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.skillGap}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="skill"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={90}
                    tick={{ fill: "#71717a", fontSize: 12, fontWeight: 500 }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#f4f4f5", radius: 6 }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                    {metrics.skillGap.map((_, i) => {
                      const opacity = 1 - (i / metrics.skillGap.length) * 0.25;
                      return (
                        <Cell key={i} fill={`rgba(99,102,241,${opacity})`} />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Talent Distribution"
            subtitle="Score-based candidate tiers"
          >
            <div
              className="relative flex items-center justify-center [&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none!"
              style={{ height: 180 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-zinc-900">
                  {total}
                </span>
                <span className="text-xs text-zinc-400 font-medium">total</span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {pieData.map((item) => {
                const pct =
                  total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-zinc-500 flex-1 font-medium">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-zinc-900">
                      {item.value}
                    </span>
                    <span className="text-xs text-zinc-400 w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Processing Volume"
          subtitle="Candidates analyzed over the last 7 days"
        >
          <div
            style={{ height: 220 }}
            className="[&_.recharts-wrapper]:outline-none! [&_.recharts-surface]:outline-none!"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={metrics.volume}
                margin={{ top: 4, right: 16, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#e4e4e7", strokeWidth: 1.5 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#areaGradient)"
                  dot={{
                    r: 3.5,
                    fill: "#10b981",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{
                    r: 5,
                    fill: "#10b981",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default MetricsView;
