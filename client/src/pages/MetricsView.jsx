import React, { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, PieChart as PieIcon, TrendingUp } from "lucide-react";
import PageHeader, { Page } from "../components/PageHeader";
import { Card, CardHeader } from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import { fetchSystemMetrics } from "../services/api";
import useChartTheme from "../lib/useChartTheme";

const AXIS_FONT_SIZE = 11;

export default function MetricsView() {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const colors = useChartTheme();

  useEffect(() => {
    fetchSystemMetrics()
      .then(setMetrics)
      .catch(() => console.error("Failed to load metrics"))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <MetricsSkeleton />;

  if (!metrics) {
    return (
      <Page>
        <PageHeader title="Insights" />
        <Card className="mt-8">
          <EmptyState
            icon={BarChart3}
            title="Metrics are unavailable"
            description="We could not reach the analytics endpoint. Try again in a moment."
          />
        </Card>
      </Page>
    );
  }

  const strictness = localStorage.getItem("ml_strictness") ?? "50";
  const skillGap = metrics.skillGap ?? [];
  const volume = metrics.volume ?? [];

  // Ordered tiers, so the chart uses a single-hue ordinal ramp rather than a
  // red/green pair that collapses under the most common colour-vision deficiency.
  const tiers = [
    {
      name: "Strong match",
      range: "80% and above",
      value: Number(metrics.distribution?.top_tier) || 0,
      color: colors.tier1,
    },
    {
      name: "Possible match",
      range: "60 to 79%",
      value: Number(metrics.distribution?.good_fit) || 0,
      color: colors.tier2,
    },
    {
      name: "Weak match",
      range: "below 60%",
      value: Number(metrics.distribution?.poor_fit) || 0,
      color: colors.tier3,
    },
  ];
  const tierTotal = tiers.reduce((sum, tier) => sum + tier.value, 0);

  return (
    <Page>
      <PageHeader
        title="Insights"
        description="How your pipeline is distributed and what the market keeps missing."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
        <StatTile label="Candidates analysed" value={metrics.kpis?.total_candidates} />
        <StatTile label="Active roles" value={metrics.kpis?.total_roles} />
        <StatTile label="Average match" value={metrics.kpis?.avg_score} unit="%" />
        <StatTile label="Engine strictness" value={strictness} unit="%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
        <Card className="lg:col-span-3">
          <CardHeader
            title="Most common skill gaps"
            description="How often each skill was missing across every analysed resume."
          />
          {skillGap.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No gaps recorded yet"
              description="Analyse a batch of resumes and the skills they lack will rank here."
            />
          ) : (
            <div
              className="px-4 pb-5"
              // Sized to sit level with the distribution card beside it. Bars stay
              // capped at 18px, so extra height becomes air rather than thicker marks.
              style={{ height: Math.max(280, skillGap.length * 40) }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skillGap}
                  layout="vertical"
                  margin={{ top: 4, right: 40, left: 4, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="skill"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={112}
                    tick={{ fill: colors.axis, fontSize: 12 }}
                  />
                  <Tooltip
                    content={<ChartTooltip unit="resumes" />}
                    cursor={{ fill: colors.grid }}
                  />
                  <Bar
                    dataKey="count"
                    name="Missing in"
                    fill={colors.accent}
                    radius={[0, 4, 4, 0]}
                    barSize={18}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="count"
                      position="right"
                      offset={10}
                      fill={colors.muted}
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Score distribution"
            description="Where your analysed candidates land."
          />
          {tierTotal === 0 ? (
            <EmptyState
              icon={PieIcon}
              title="Nothing to distribute"
              description="Scores appear here once the engine has run at least once."
            />
          ) : (
            <div className="px-6 pb-6">
              <div className="relative h-45">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tiers}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={84}
                      startAngle={90}
                      endAngle={-270}
                      paddingAngle={1.5}
                      stroke={colors.surface}
                      strokeWidth={2}
                      isAnimationActive={false}
                    >
                      {tiers.map((tier) => (
                        <Cell key={tier.name} fill={tier.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip unit="candidates" />} />
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[32px] font-semibold leading-none tracking-[-0.026em]">
                    {tierTotal}
                  </span>
                  <span className="t-xs text-faint mt-2">candidates</span>
                </div>
              </div>

              <ul className="mt-5 space-y-2.5">
                {tiers.map((tier) => (
                  <li key={tier.name} className="flex items-center gap-2.5">
                    <span
                      className="size-2.5 rounded-[3px] shrink-0"
                      style={{ backgroundColor: tier.color }}
                      aria-hidden="true"
                    />
                    <span className="t-sm text-muted flex-1 min-w-0 truncate">
                      {tier.name}
                      <span className="text-ghost"> {tier.range}</span>
                    </span>
                    <span className="t-sm font-medium tnum shrink-0">
                      {tier.value}
                    </span>
                    <span className="t-xs text-ghost tnum w-9 text-right shrink-0">
                      {Math.round((tier.value / tierTotal) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Processing volume"
          description="Resumes analysed over the last seven days."
        />
        {volume.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No activity yet"
            description="Daily throughput appears once resumes start coming through."
          />
        ) : (
          <div className="px-4 pb-5 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={volume}
                margin={{ top: 8, right: 12, left: -14, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="volumeWash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.accent} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke={colors.grid}
                  strokeWidth={1}
                />
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  dy={8}
                  tick={{ fill: colors.axis, fontSize: AXIS_FONT_SIZE }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={44}
                  tick={{ fill: colors.axis, fontSize: AXIS_FONT_SIZE }}
                />
                <Tooltip
                  content={<ChartTooltip unit="resumes" />}
                  cursor={{ stroke: colors.grid, strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Analysed"
                  stroke={colors.accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="url(#volumeWash)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: colors.accent,
                    stroke: colors.surface,
                    strokeWidth: 2,
                  }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </Page>
  );
}

function StatTile({ label, value, unit }) {
  return (
    <Card className="px-6 py-5 rounded-lg">
      <p className="t-sm text-faint">{label}</p>
      <p className="text-[30px] font-semibold leading-none mt-3 tracking-[-0.026em]">
        {value ?? 0}
        {unit && <span className="text-[18px] text-faint ml-0.5">{unit}</span>}
      </p>
    </Card>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const point = payload[0];
  const name = label ?? point.payload?.name ?? point.name;

  return (
    <div className="bg-overlay border border-line rounded-md shadow-lg px-3 py-2">
      <p className="t-xs text-faint">{name}</p>
      <p className="t-sm font-medium text-ink mt-0.5 tnum">
        {point.value} {unit}
      </p>
    </div>
  );
}

function MetricsSkeleton() {
  return (
    <Page>
      <Skeleton className="h-9 w-52 rounded-md" />
      <Skeleton className="h-4 w-80 rounded-sm mt-4" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-25 rounded-lg" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-4">
        <Skeleton className="lg:col-span-3 h-84 rounded-lg" />
        <Skeleton className="lg:col-span-2 h-84 rounded-lg" />
      </div>

      <Skeleton className="h-72 rounded-lg mt-5" />
    </Page>
  );
}
