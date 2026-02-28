"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineSearch,
  HiOutlineCursorClick,
  HiOutlineGlobe,
  HiOutlineCalendar,
  HiOutlineClock,
} from "react-icons/hi";
import { getAnalytics, AnalyticsResponse } from "@/lib/api";

export default function AnalyticsPage() {
  const [shortCode, setShortCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shortCode.trim()) {
      toast.error("Please enter a short code");
      return;
    }
    setLoading(true);
    try {
      const result = await getAnalytics(shortCode.trim());
      setData(result);
    } catch {
      toast.error("No analytics found for this short code");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const maxDateCount = data
    ? Math.max(...Object.values(data.clicksByDate), 1)
    : 1;
  const maxCountryCount = data
    ? Math.max(...Object.values(data.clicksByCountry), 1)
    : 1;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-pink text-xs font-medium tracking-wide mb-5"
        >
          <HiOutlineCursorClick className="text-sm" />
          Click Tracking
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
          <span className="gradient-text">Analytics</span>{" "}
          <span className="text-brand-cream/90">Dashboard</span>
        </h1>
        <p className="text-brand-cream/45 max-w-lg mx-auto">
          Enter a short code to view real-time click analytics, geographic
          breakdown, and recent activity.
        </p>
      </motion.div>

      {/* Search */}
      <motion.form
        onSubmit={handleSearch}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="max-w-lg mx-auto mb-12"
      >
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-purple/60 group-focus-within:text-brand-pink transition-colors duration-200">
              <HiOutlineSearch className="text-xl" />
            </div>
            <input
              type="text"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="Enter short code (e.g. abc123)"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-brand-navy/80 border border-brand-purple/20 text-brand-cream placeholder-brand-cream/30 transition-all duration-200 focus:border-brand-purple/50 hover:border-brand-purple/30"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-primary px-6 py-3.5 rounded-xl font-semibold text-white disabled:opacity-50 disabled:transform-none"
          >
            {loading ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
            ) : (
              "Search"
            )}
          </motion.button>
        </div>
      </motion.form>

      {/* Results */}
      <AnimatePresence mode="wait">
        {data && (
          <motion.div
            key={data.shortCode}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard
                icon={<HiOutlineCursorClick className="text-2xl" />}
                label="Total Clicks"
                value={data.totalClicks.toLocaleString()}
                delay={0}
              />
              <StatCard
                icon={<HiOutlineGlobe className="text-2xl" />}
                label="Countries"
                value={Object.keys(data.clicksByCountry).length.toString()}
                delay={0.1}
              />
              <StatCard
                icon={<HiOutlineCalendar className="text-2xl" />}
                label="Active Days"
                value={Object.keys(data.clicksByDate).length.toString()}
                delay={0.2}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Clicks by Date */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="glass rounded-xl p-6 border border-brand-purple/15"
              >
                <h3 className="text-[11px] font-semibold text-brand-cream/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <HiOutlineCalendar className="text-sm" /> Clicks by Date
                </h3>
                {Object.keys(data.clicksByDate).length === 0 ? (
                  <EmptyState text="No date data yet" />
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.clicksByDate).map(
                      ([date, count], i) => (
                        <motion.div
                          key={date}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                        >
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-brand-cream/60 font-mono text-xs">
                              {date}
                            </span>
                            <span className="text-brand-pink font-semibold text-xs">
                              {count}
                            </span>
                          </div>
                          <div className="h-2 bg-brand-navy/80 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(count / maxDateCount) * 100}%`,
                              }}
                              transition={{
                                duration: 0.8,
                                delay: 0.4 + i * 0.05,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full"
                              style={{
                                background:
                                  "linear-gradient(90deg, #982598, #E491C9)",
                              }}
                            />
                          </div>
                        </motion.div>
                      ),
                    )}
                  </div>
                )}
              </motion.div>

              {/* Clicks by Country */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-xl p-6 border border-brand-purple/15"
              >
                <h3 className="text-[11px] font-semibold text-brand-cream/50 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <HiOutlineGlobe className="text-sm" /> Clicks by Country
                </h3>
                {Object.keys(data.clicksByCountry).length === 0 ? (
                  <EmptyState text="No country data yet" />
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.clicksByCountry).map(
                      ([country, count], i) => (
                        <motion.div
                          key={country}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.35 + i * 0.05 }}
                        >
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-brand-cream/60 text-xs">
                              {country}
                            </span>
                            <span className="text-brand-pink font-semibold text-xs">
                              {count}
                            </span>
                          </div>
                          <div className="h-2 bg-brand-navy/80 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(count / maxCountryCount) * 100}%`,
                              }}
                              transition={{
                                duration: 0.8,
                                delay: 0.45 + i * 0.05,
                                ease: "easeOut",
                              }}
                              className="h-full rounded-full"
                              style={{
                                background:
                                  "linear-gradient(90deg, #E491C9, #F1E9E9)",
                              }}
                            />
                          </div>
                        </motion.div>
                      ),
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Recent Clicks */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="glass rounded-xl border border-brand-purple/15 overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-brand-purple/10">
                <h3 className="text-[11px] font-semibold text-brand-cream/50 uppercase tracking-widest flex items-center gap-2">
                  <HiOutlineClock className="text-sm" /> Recent Clicks
                </h3>
              </div>
              {data.recentClicks.length === 0 ? (
                <div className="p-8">
                  <EmptyState text="No click data yet. Try visiting the short URL first!" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-brand-cream/40 text-[11px] uppercase tracking-wider border-b border-brand-purple/10">
                        <th className="text-left px-6 py-3">Time</th>
                        <th className="text-left px-6 py-3">IP</th>
                        <th className="text-left px-6 py-3">Country</th>
                        <th className="text-left px-6 py-3">User Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-purple/5">
                      {data.recentClicks.map((click, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 + i * 0.04 }}
                          className="text-brand-cream/60 hover:bg-brand-purple/5 transition-colors"
                        >
                          <td className="px-6 py-3 font-mono text-xs whitespace-nowrap">
                            {new Date(click.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 font-mono text-xs">
                            {click.ip_address}
                          </td>
                          <td className="px-6 py-3 text-xs">{click.country}</td>
                          <td className="px-6 py-3 truncate max-w-[200px] text-xs text-brand-cream/35">
                            {click.user_agent}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!data && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineSearch className="text-3xl text-brand-purple/40" />
          </div>
          <p className="text-brand-cream/30 text-sm">
            Enter a short code above to view its analytics
          </p>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="glass rounded-xl p-5">
                <div className="skeleton h-4 w-20 mb-3" />
                <div className="skeleton h-8 w-16" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="glass rounded-xl p-6">
              <div className="skeleton h-4 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n}>
                    <div className="skeleton h-3 w-full mb-1.5" />
                    <div className="skeleton h-2 w-full" />
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-xl p-6">
              <div className="skeleton h-4 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n}>
                    <div className="skeleton h-3 w-full mb-1.5" />
                    <div className="skeleton h-2 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────── */
function StatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="glass glass-hover rounded-xl p-5 border border-brand-purple/15"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-brand-purple/20 to-brand-pink/10 text-brand-pink">
          {icon}
        </div>
        <p className="text-[11px] text-brand-cream/40 uppercase tracking-widest font-semibold">
          {label}
        </p>
      </div>
      <motion.p
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: delay + 0.2, type: "spring", bounce: 0.4 }}
        className="text-3xl font-bold gradient-text"
      >
        {value}
      </motion.p>
    </motion.div>
  );
}

/* ── Empty State ──────────────────────────────────────── */
function EmptyState({ text }: { text: string }) {
  return <p className="text-brand-cream/30 text-sm py-4 text-center">{text}</p>;
}
