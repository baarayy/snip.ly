"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineSearch,
  HiOutlineCursorClick,
  HiOutlineGlobe,
  HiOutlineCalendar,
  HiOutlineDeviceMobile,
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
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3">
          <span className="gradient-text">Analytics</span>{" "}
          <span className="text-brand-cream/90">Dashboard</span>
        </h1>
        <p className="text-brand-cream/50 max-w-lg mx-auto">
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
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-purple/60">
              <HiOutlineSearch className="text-xl" />
            </div>
            <input
              type="text"
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value)}
              placeholder="Enter short code (e.g. abc123)"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-brand-navy/80 border border-brand-purple/20 text-brand-cream placeholder-brand-cream/30 transition-all focus:border-brand-purple/50"
            />
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="btn-shimmer px-6 py-3.5 rounded-xl font-semibold text-white disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #982598, #E491C9)",
            }}
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
                className="glass rounded-2xl p-6 border border-brand-purple/15"
              >
                <h3 className="text-sm font-semibold text-brand-cream/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HiOutlineCalendar /> Clicks by Date
                </h3>
                {Object.keys(data.clicksByDate).length === 0 ? (
                  <p className="text-brand-cream/30 text-sm">No data yet</p>
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
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-brand-cream/70 font-mono">
                              {date}
                            </span>
                            <span className="text-brand-pink font-semibold">
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
                className="glass rounded-2xl p-6 border border-brand-purple/15"
              >
                <h3 className="text-sm font-semibold text-brand-cream/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <HiOutlineGlobe /> Clicks by Country
                </h3>
                {Object.keys(data.clicksByCountry).length === 0 ? (
                  <p className="text-brand-cream/30 text-sm">No data yet</p>
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
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-brand-cream/70">
                              {country}
                            </span>
                            <span className="text-brand-pink font-semibold">
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
              className="glass rounded-2xl p-6 border border-brand-purple/15"
            >
              <h3 className="text-sm font-semibold text-brand-cream/60 uppercase tracking-wider mb-4 flex items-center gap-2">
                <HiOutlineClock /> Recent Clicks
              </h3>
              {data.recentClicks.length === 0 ? (
                <p className="text-brand-cream/30 text-sm">
                  No click data yet. Try visiting the short URL first!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-brand-cream/40 text-xs uppercase tracking-wider">
                        <th className="text-left pb-3 pr-4">Time</th>
                        <th className="text-left pb-3 pr-4">IP</th>
                        <th className="text-left pb-3 pr-4">Country</th>
                        <th className="text-left pb-3">User Agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-purple/10">
                      {data.recentClicks.map((click, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 + i * 0.04 }}
                          className="text-brand-cream/70"
                        >
                          <td className="py-2.5 pr-4 font-mono text-xs whitespace-nowrap">
                            {new Date(click.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-xs">
                            {click.ip_address}
                          </td>
                          <td className="py-2.5 pr-4">{click.country}</td>
                          <td className="py-2.5 truncate max-w-[200px] text-xs text-brand-cream/40">
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
          <div className="w-20 h-20 rounded-full bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineSearch className="text-3xl text-brand-purple/50" />
          </div>
          <p className="text-brand-cream/30">
            Enter a short code above to view its analytics
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ── Stat Card Component ─────────────────────────────────── */

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
      className="glass glass-hover rounded-2xl p-5 border border-brand-purple/15 transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-gradient-to-br from-brand-purple/20 to-brand-pink/10 text-brand-pink">
          {icon}
        </div>
        <p className="text-xs text-brand-cream/40 uppercase tracking-wider font-medium">
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
