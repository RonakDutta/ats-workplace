import React, { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import PageHeader, { Page } from "../components/PageHeader";
import { Card, LayerCard } from "../components/ui/Card";
import Stat from "../components/ui/Stat";
import { Briefcase, FileText, Gauge, SlidersHorizontal } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import { fetchSystemMetrics } from "../services/api";
import { getStrictness } from "../lib/settings";
import { describeStrictness } from "../lib/strictness";
import useChartTheme from "../lib/useChartTheme";
import { cn } from "../lib/cn";

const DAYS = 7;
const TICK = { fontSize: 12 };

/**
 * The endpoint only returns days that had activity, labelled "Mon DD". A week
 * with gaps is still a week, so every day is laid out and missing ones are 0.
 */
function fillWeek(rows) {
  const counts = new Map(rows.map((row) => [row.date, Number(row.count) || 0]));
  const today = new Date();
  return Array.from({ length: DAYS }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (DAYS - 1 - index));
    const key = `${day.toLocaleString("en-US", { month: "short" })} ${String(day.getDate()).padStart(2, "0")}`;
    return {
      date: key,
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      count: counts.get(key) ?? 0,
    };
  });
}

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

  const header = (
    <PageHeader
      crumbs={[{ label: "Overview", to: "/" }, { label: "Insights" }]}
      title="Insights"
      description="How analysed candidates are scoring and which required skills are most often missing."
    />
  );

  if (isLoading) return <MetricsSkeleton header={header} />;

  if (!metrics) {
    return (
      <Page>
        {header}
        <Card>
          <EmptyState
            title="Insights are unavailable"
            description="The analytics endpoint could not be reached. Try again in a moment."
          />
        </Card>
      </Page>
    );
  }

  const strictness = getStrictness();
  const skillGap = (metrics.skillGap ?? []).map((row) => ({
    skill: row.skill,
    count: Number(row.count) || 0,
  }));
  const week = fillWeek(metrics.volume ?? []);
  const weekTotal = week.reduce((sum, day) => sum + day.count, 0);

  const tiers = [
    {
      name: "Strong match",
      range: "80 and above",
      value: Number(metrics.distribution?.top_tier) || 0,
      color: colors.good,
    },
    {
      name: "Possible match",
      range: "60 to 79",
      value: Number(metrics.distribution?.good_fit) || 0,
      color: colors.warn,
    },
    {
      name: "Weak match",
      range: "Below 60",
      value: Number(metrics.distribution?.poor_fit) || 0,
      color: colors.bad,
    },
  ];
  const tierTotal = tiers.reduce((sum, tier) => sum + tier.value, 0);

  return (
    <Page>
      {header}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Candidates analysed" icon={FileText} value={metrics.kpis?.total_candidates ?? 0} />
        <Stat label="Active roles" icon={Briefcase} value={metrics.kpis?.total_roles ?? 0} />
        <Stat
          label="Average match"
          icon={Gauge}
          value={metrics.kpis?.avg_score ?? "None"}
          unit={metrics.kpis?.avg_score != null ? "%" : undefined}
        />
        <Stat
          label="Strictness"
          icon={SlidersHorizontal}
          value={strictness}
          unit={describeStrictness(strictness).name}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-6">
        <LayerCard className="lg:col-span-3" bodyClassName="h-[calc(100%-2.75rem)]" title="Most common skill gaps">
          <p className="t-sm text-faint px-4 pt-4">
            Required skills most often missing, counted across every analysed resume.
          </p>
          {skillGap.length === 0 ? (
            <EmptyState
              title="No gaps recorded yet"
              description="Analyse a batch of resumes and the skills they lack will rank here."
            />
          ) : (
            <div className="px-3 pb-4 pt-2" style={{ height: 32 + skillGap.length * 40 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={skillGap}
                  layout="vertical"
                  margin={{ top: 0, right: 44, left: 8, bottom: 0 }}
                  barCategoryGap={12}
                >
                  <XAxis type="number" hide domain={[0, "dataMax"]} />
                  <YAxis
                    dataKey="skill"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={124}
                    tick={{ ...TICK, fill: colors.muted }}
                  />
                  <Tooltip
                    content={<ChartTooltip unit="resume" />}
                    cursor={{ fill: colors.hover }}
                    isAnimationActive={false}
                  />
                  <Bar
                    dataKey="count"
                    fill={colors.accent}
                    radius={[0, 5, 5, 0]}
                    maxBarSize={14}
                    isAnimationActive={false}
                  >
                    <LabelList
                      dataKey="count"
                      position="right"
                      offset={8}
                      fill={colors.muted}
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </LayerCard>

        <LayerCard className="lg:col-span-2" bodyClassName="h-[calc(100%-2.75rem)]" title="Score distribution">
          {tierTotal === 0 ? (
            <EmptyState
              title="Nothing to show yet"
              description="Scores appear here once at least one resume has been analysed."
            />
          ) : (
            <div className="px-5 pt-4 pb-5">
              <p className="text-[28px] font-semibold leading-none tracking-[-0.02em]">
                {tierTotal}
                <span className="t-sm text-faint font-normal ml-1.5 tracking-normal">
                  candidates
                </span>
              </p>

              <div
                className="flex h-2.5 gap-0.5 mt-4"
                role="img"
                aria-label={tiers.map((tier) => `${tier.name}: ${tier.value}`).join(", ")}
              >
                {tiers
                  .filter((tier) => tier.value > 0)
                  .map((tier, index, shown) => (
                    <div
                      key={tier.name}
                      title={`${tier.name}: ${tier.value}`}
                      className={cn(
                        index === 0 && "rounded-l-full",
                        index === shown.length - 1 && "rounded-r-full",
                      )}
                      style={{ flexGrow: tier.value, backgroundColor: tier.color }}
                    />
                  ))}
              </div>

              <table className="w-full mt-5 t-sm">
                <thead>
                  <tr className="border-b border-line-soft text-left">
                    <th className="pb-2 t-xs font-semibold text-faint">Verdict</th>
                    <th className="pb-2 t-xs font-semibold text-faint text-right">Count</th>
                    <th className="pb-2 t-xs font-semibold text-faint text-right w-14">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {tiers.map((tier) => (
                    <tr key={tier.name}>
                      <td className="py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span
                            className="w-3 h-2 rounded-[3px] shrink-0"
                            style={{ backgroundColor: tier.color }}
                            aria-hidden="true"
                          />
                          <span>
                            {tier.name}
                            <span className="block t-xs text-faint">{tier.range}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 text-right tnum">{tier.value}</td>
                      <td className="py-2.5 text-right tnum text-faint">
                        {Math.round((tier.value / tierTotal) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </LayerCard>
      </div>

      <LayerCard
        className="mt-4"
        title="Resumes analysed per day"
        actions={
          <span className="inline-flex items-center h-6 px-2.5 mr-1 rounded-full bg-fill text-[12px] font-medium text-muted">
            Last {DAYS} days, {weekTotal} total
          </span>
        }
      >
        <div className="px-3 pt-4 pb-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={week} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis
                dataKey="date"
                axisLine={{ stroke: colors.grid }}
                tickLine={false}
                dy={6}
                tick={{ ...TICK, fill: colors.axis }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={40}
                tick={{ ...TICK, fill: colors.axis }}
              />
              <Tooltip
                content={<ChartTooltip unit="resume" />}
                cursor={{ fill: colors.hover }}
                isAnimationActive={false}
              />
              <Bar
                dataKey="count"
                fill={colors.accent}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                minPointSize={0}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </LayerCard>
    </Page>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value) || 0;

  return (
    <div className="bg-surface border border-line rounded-lg shadow-lg px-3 py-2">
      <p className="t-xs text-faint">{label}</p>
      <p className="t-sm font-medium text-ink mt-0.5">
        <span className="tnum">{value}</span> {value === 1 ? unit : `${unit}s`}
      </p>
    </div>
  );
}

function MetricsSkeleton({ header }) {
  return (
    <Page>
      {header}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Stat key={index} label="Loading" value={null} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mt-6">
        <Skeleton className="lg:col-span-3 h-80 rounded-xl" />
        <Skeleton className="lg:col-span-2 h-80 rounded-xl" />
      </div>
      <Skeleton className="h-80 mt-4 rounded-xl" />
    </Page>
  );
}
