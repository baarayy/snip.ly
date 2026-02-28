"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineFire,
  HiOutlineExternalLink,
  HiOutlineCursorClick,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlineGlobe,
} from "react-icons/hi";
import { getTrending, getRedirectUrl, TrendingItem } from "@/lib/api";

export default function TrendingPage() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrending = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getTrending(20);
      setItems(data.trending);
    } catch {
      toast.error("Could not load trending data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrending();
  }, []);

  const maxClicks = items.length > 0 ? items[0].totalClicks : 1;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium tracking-wide mb-5"
        >
          <HiOutlineFire className="text-sm" />
          Popular Right Now
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
          <span className="gradient-text">Trending</span>{" "}
          <span className="text-brand-cream/90">Links</span>
        </h1>
        <p className="text-brand-cream/45 max-w-lg mx-auto">
          The most clicked shortened URLs across the platform. Click any link to
          visit the original destination.
        </p>
      </motion.div>

      {/* Refresh button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex justify-end mb-6"
      >
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => fetchTrending(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-purple/15 hover:bg-brand-purple/25 transition-colors duration-200 text-brand-cream/60 text-xs font-medium disabled:opacity-50"
        >
          <motion.span
            animate={refreshing ? { rotate: 360 } : {}}
            transition={
              refreshing
                ? { duration: 1, repeat: Infinity, ease: "linear" }
                : {}
            }
          >
            <HiOutlineRefresh className="text-sm" />
          </motion.span>
          Refresh
        </motion.button>
      </motion.div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="glass rounded-xl p-5 border border-brand-purple/10"
            >
              <div className="flex items-center gap-4">
                <div className="skeleton w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-48" />
                  <div className="skeleton h-3 w-72" />
                </div>
                <div className="skeleton w-16 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trending list */}
      <AnimatePresence mode="wait">
        {!loading && items.length > 0 && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {items.map((item, i) => (
              <motion.a
                key={item.shortCode}
                href={getRedirectUrl(item.shortCode)}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                whileHover={{ scale: 1.01, x: 4 }}
                className="group block glass glass-hover rounded-xl p-5 border border-brand-purple/15 cursor-pointer relative overflow-hidden"
              >
                {/* Rank highlight for top 3 */}
                {i < 3 && (
                  <div
                    className="absolute top-0 left-0 w-1 h-full rounded-r-full"
                    style={{
                      background:
                        i === 0
                          ? "linear-gradient(180deg, #f59e0b, #f97316)"
                          : i === 1
                            ? "linear-gradient(180deg, #94a3b8, #64748b)"
                            : "linear-gradient(180deg, #b45309, #92400e)",
                    }}
                  />
                )}

                <div className="flex items-center gap-4">
                  {/* Rank badge */}
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      i === 0
                        ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                        : i === 1
                          ? "bg-slate-400/15 text-slate-300 border border-slate-400/20"
                          : i === 2
                            ? "bg-amber-700/15 text-amber-500 border border-amber-700/20"
                            : "bg-brand-purple/10 text-brand-cream/40 border border-brand-purple/15"
                    }`}
                  >
                    #{item.rank}
                  </div>

                  {/* URL info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-brand-pink font-semibold text-sm font-mono">
                        /{item.shortCode}
                      </span>
                      <HiOutlineExternalLink className="text-xs text-brand-cream/20 group-hover:text-brand-pink transition-colors duration-200" />
                    </div>
                    {item.longUrl ? (
                      <p className="text-brand-cream/40 text-xs truncate">
                        {item.longUrl}
                      </p>
                    ) : (
                      <p className="text-brand-cream/20 text-xs italic">
                        URL info unavailable
                      </p>
                    )}

                    {/* Click bar (visual indicator) */}
                    <div className="mt-2 h-1 bg-brand-navy/80 rounded-full overflow-hidden max-w-xs">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(item.totalClicks / maxClicks) * 100}%`,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: 0.15 + i * 0.05,
                          ease: "easeOut",
                        }}
                        className="h-full rounded-full"
                        style={{
                          background:
                            i === 0
                              ? "linear-gradient(90deg, #f59e0b, #f97316)"
                              : "linear-gradient(90deg, #982598, #E491C9)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Click count */}
                  <div className="flex items-center gap-2 shrink-0">
                    <HiOutlineCursorClick className="text-brand-pink/50 text-sm" />
                    <span className="text-brand-cream/60 font-semibold text-sm tabular-nums">
                      {item.totalClicks.toLocaleString()}
                    </span>
                    <span className="text-brand-cream/25 text-[10px]">
                      clicks
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 rounded-2xl bg-brand-purple/10 flex items-center justify-center mx-auto mb-4">
            <HiOutlineChartBar className="text-3xl text-brand-purple/40" />
          </div>
          <p className="text-brand-cream/40 font-medium mb-1">
            No trending data yet
          </p>
          <p className="text-brand-cream/25 text-sm max-w-sm mx-auto">
            Shortened URLs will appear here once they start receiving clicks.
            Create and share some links to get started!
          </p>
        </motion.div>
      )}

      {/* Stats footer */}
      {!loading && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-6 text-brand-cream/25 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <HiOutlineGlobe className="text-sm" />
            {items.length} trending links
          </span>
          <span className="w-1 h-1 rounded-full bg-brand-cream/15" />
          <span className="flex items-center gap-1.5">
            <HiOutlineCursorClick className="text-sm" />
            {items
              .reduce((sum, i) => sum + i.totalClicks, 0)
              .toLocaleString()}{" "}
            total clicks
          </span>
        </motion.div>
      )}
    </div>
  );
}
