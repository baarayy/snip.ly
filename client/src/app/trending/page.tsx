"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineFire,
  HiOutlineExternalLink,
  HiOutlineCursorClick,
  HiOutlineRefresh,
  HiOutlineChartBar,
  HiOutlineGlobe,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi";
import { getTrending, getRedirectUrl, TrendingItem } from "@/lib/api";
import { useSocket, ClickEvent } from "@/lib/useSocket";

const PAGE_SIZE = 15;

export default function TrendingPage() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const { connected, onClickEvent } = useSocket();

  const fetchTrending = useCallback(
    async (targetPage: number = page, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await getTrending(targetPage, PAGE_SIZE);
        setItems(data.trending);
        setTotalItems(data.total);
        setTotalPages(data.totalPages);
        setHasNext(data.hasNext);
        setHasPrev(data.hasPrev);
        setPage(data.page);
      } catch {
        toast.error("Could not load trending data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page],
  );

  useEffect(() => {
    fetchTrending(page);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  // Real-time: re-fetch trending on every click event
  useEffect(() => {
    const unsub = onClickEvent((_event: ClickEvent) => {
      fetchTrending(page, true);
    });
    return unsub;
  }, [onClickEvent, fetchTrending, page]);

  const maxClicks = items.length > 0 ? items[0].totalClicks : 1;
  const startRank = (page - 1) * PAGE_SIZE + 1;
  const endRank = startRank + items.length - 1;

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      ) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

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
          <HiOutlineFire className="text-sm animate-pulse" />
          Popular Right Now
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
          <span className="gradient-text">Trending</span>{" "}
          <span className="text-brand-cream/90">Links</span>
        </h1>
        <p className="text-brand-cream/45 max-w-lg mx-auto">
          Browse all shortened URLs ranked by popularity. Click any link to
          visit the original destination.
        </p>
      </motion.div>

      {/* Toolbar: Live indicator + page info + refresh */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mb-6"
      >
        {/* Live indicator */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium"
          style={{
            background: connected
              ? "rgba(74, 222, 128, 0.1)"
              : "rgba(248, 113, 113, 0.1)",
            border: connected
              ? "1px solid rgba(74, 222, 128, 0.2)"
              : "1px solid rgba(248, 113, 113, 0.2)",
            color: connected ? "#4ade80" : "#f87171",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: connected ? "#4ade80" : "#f87171",
              boxShadow: connected ? "0 0 6px #4ade80" : "0 0 6px #f87171",
              animation: connected ? "pulse 2s ease-in-out infinite" : "none",
            }}
          />
          {connected ? "Live" : "Connecting..."}
        </div>

        {/* Page info badge */}
        {!loading && totalItems > 0 && (
          <span className="text-brand-cream/35 text-xs font-medium tabular-nums">
            Showing {startRank}–{endRank} of {totalItems.toLocaleString()} links
          </span>
        )}

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => fetchTrending(page, true)}
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
          {[...Array(6)].map((_, i) => (
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
            key={`page-${page}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {items.map((item, i) => {
              const globalIndex = item.rank - 1; // 0-based global rank
              return (
                <motion.a
                  key={item.shortCode}
                  href={getRedirectUrl(item.shortCode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.35 }}
                  whileHover={{ scale: 1.01, x: 4 }}
                  className="group block glass glass-hover rounded-xl p-5 border border-brand-purple/15 cursor-pointer relative overflow-hidden"
                >
                  {/* Rank highlight for top 3 (only on page 1) */}
                  {globalIndex < 3 && (
                    <div
                      className="absolute top-0 left-0 w-1 h-full rounded-r-full"
                      style={{
                        background:
                          globalIndex === 0
                            ? "linear-gradient(180deg, #f59e0b, #f97316)"
                            : globalIndex === 1
                              ? "linear-gradient(180deg, #94a3b8, #64748b)"
                              : "linear-gradient(180deg, #b45309, #92400e)",
                      }}
                    />
                  )}

                  <div className="flex items-center gap-4">
                    {/* Rank badge */}
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                        globalIndex === 0
                          ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                          : globalIndex === 1
                            ? "bg-slate-400/15 text-slate-300 border border-slate-400/20"
                            : globalIndex === 2
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
                            delay: 0.1 + i * 0.03,
                            ease: "easeOut",
                          }}
                          className="h-full rounded-full"
                          style={{
                            background:
                              globalIndex === 0
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
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 flex items-center justify-center gap-2"
        >
          {/* Previous button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => goToPage(page - 1)}
            disabled={!hasPrev}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-cream/60"
          >
            <HiOutlineChevronLeft className="text-sm" />
            Prev
          </motion.button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) =>
              p === "..." ? (
                <span
                  key={`dots-${idx}`}
                  className="px-2 py-1.5 text-brand-cream/25 text-xs"
                >
                  ...
                </span>
              ) : (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => goToPage(p as number)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    p === page
                      ? "bg-gradient-to-br from-brand-purple to-brand-pink text-white shadow-lg shadow-brand-purple/25"
                      : "bg-brand-purple/10 text-brand-cream/50 hover:bg-brand-purple/20 hover:text-brand-cream/70"
                  }`}
                >
                  {p}
                </motion.button>
              ),
            )}
          </div>

          {/* Next button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => goToPage(page + 1)}
            disabled={!hasNext}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-cream/60"
          >
            Next
            <HiOutlineChevronRight className="text-sm" />
          </motion.button>
        </motion.div>
      )}

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
          className="mt-6 flex items-center justify-center gap-6 text-brand-cream/25 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <HiOutlineGlobe className="text-sm" />
            {totalItems.toLocaleString()} total links
          </span>
          <span className="w-1 h-1 rounded-full bg-brand-cream/15" />
          <span className="flex items-center gap-1.5">
            <HiOutlineCursorClick className="text-sm" />
            Page {page} of {totalPages}
          </span>
          <span className="w-1 h-1 rounded-full bg-brand-cream/15" />
          <span className="flex items-center gap-1.5">
            <HiOutlineCursorClick className="text-sm" />
            {items
              .reduce((sum, i) => sum + i.totalClicks, 0)
              .toLocaleString()}{" "}
            clicks on this page
          </span>
        </motion.div>
      )}
    </div>
  );
}
