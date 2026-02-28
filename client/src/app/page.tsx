"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiOutlineLink,
  HiOutlineClipboardCopy,
  HiOutlineTag,
  HiOutlineClock,
  HiOutlineExternalLink,
  HiArrowRight,
  HiOutlineLightningBolt,
  HiOutlineGlobe,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
} from "react-icons/hi";
import { createShortUrl, CreateUrlResponse, getRedirectUrl } from "@/lib/api";

const features = [
  {
    icon: HiOutlineLightningBolt,
    title: "Lightning Fast",
    desc: "Sub-10ms redirects via Redis caching layer",
  },
  {
    icon: HiOutlineGlobe,
    title: "Analytics",
    desc: "Real-time click tracking with geo data",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Reliable",
    desc: "Event-driven architecture with RabbitMQ",
  },
  {
    icon: HiOutlineChartBar,
    title: "Scalable",
    desc: "Polyglot microservices with K8s support",
  },
];

export default function HomePage() {
  const [longUrl, setLongUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreateUrlResponse | null>(null);
  const [history, setHistory] = useState<CreateUrlResponse[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!longUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setLoading(true);
    try {
      const data = await createShortUrl({
        longUrl: longUrl.trim(),
        customAlias: customAlias.trim() || undefined,
        expiryDate: expiryDate || undefined,
      });
      setResult(data);
      setHistory((prev) => [data, ...prev]);
      toast.success("Short URL created!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create short URL");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const resetForm = () => {
    setLongUrl("");
    setCustomAlias("");
    setExpiryDate("");
    setResult(null);
    setShowOptions(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center mb-14"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-pink text-xs font-medium tracking-wide mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-brand-pink animate-pulse" />
          Polyglot Microservices Architecture
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-extrabold mb-5 leading-[1.1] tracking-tight">
          <span className="gradient-text">Shorten.</span>{" "}
          <span className="text-brand-cream/90">Share.</span>{" "}
          <span className="gradient-text">Track.</span>
        </h1>
        <p className="text-brand-cream/45 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Transform long URLs into clean, trackable links. Powered by
          Spring&nbsp;Boot, NestJS, and Django with real-time analytics.
        </p>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="gradient-border"
      >
        <div className="glass rounded-2xl p-8">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
              >
                {/* URL Input */}
                <div className="relative group mb-6">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-purple/70 group-focus-within:text-brand-pink transition-colors duration-200">
                    <HiOutlineLink className="text-xl" />
                  </div>
                  <input
                    type="url"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    placeholder="Paste your long URL here..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-brand-navy/80 border border-brand-purple/20 text-brand-cream placeholder-brand-cream/30 text-lg transition-all duration-200 focus:border-brand-purple/50 hover:border-brand-purple/30"
                    autoFocus
                  />
                </div>

                {/* Options toggle */}
                <motion.button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-sm text-brand-cream/40 hover:text-brand-pink mb-4 flex items-center gap-1.5 transition-colors duration-200"
                  whileTap={{ scale: 0.97 }}
                >
                  <motion.span
                    animate={{ rotate: showOptions ? 90 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HiArrowRight className="text-xs" />
                  </motion.span>
                  Advanced options
                </motion.button>

                {/* Advanced options */}
                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-purple/50">
                            <HiOutlineTag className="text-lg" />
                          </div>
                          <input
                            type="text"
                            value={customAlias}
                            onChange={(e) => setCustomAlias(e.target.value)}
                            placeholder="Custom alias (optional)"
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-navy/80 border border-brand-purple/20 text-brand-cream placeholder-brand-cream/30 text-sm transition-all duration-200 focus:border-brand-purple/50"
                          />
                        </div>
                        <div className="relative group">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-purple/50">
                            <HiOutlineClock className="text-lg" />
                          </div>
                          <input
                            type="datetime-local"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-brand-navy/80 border border-brand-purple/20 text-brand-cream text-sm transition-all duration-200 focus:border-brand-purple/50 [color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-4 rounded-xl font-semibold text-lg text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Creating...
                    </span>
                  ) : (
                    "Shorten URL"
                  )}
                </motion.button>
              </motion.form>
            ) : (
              /* ── Result View ─────────────────────────────── */
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      bounce: 0.5,
                      delay: 0.1,
                    }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center mx-auto mb-4"
                  >
                    <HiOutlineLink className="text-3xl text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-brand-cream mb-1">
                    Link Created!
                  </h2>
                  <p className="text-brand-cream/40 text-sm">
                    Your shortened URL is ready to use
                  </p>
                </div>

                {/* Short URL display */}
                <div className="bg-brand-navy/80 rounded-xl p-4 mb-4 flex items-center justify-between gap-4 border border-brand-purple/20">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-brand-cream/40 mb-1 uppercase tracking-widest font-medium">
                      Short URL
                    </p>
                    <p className="text-brand-pink font-mono text-lg truncate">
                      {result.shortUrl}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => copyToClipboard(result.shortUrl)}
                      className="p-2.5 rounded-lg bg-brand-purple/15 hover:bg-brand-purple/30 transition-colors duration-200"
                      title="Copy"
                    >
                      <HiOutlineClipboardCopy className="text-lg text-brand-pink" />
                    </motion.button>
                    <motion.a
                      href={getRedirectUrl(result.shortCode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      className="p-2.5 rounded-lg bg-brand-purple/15 hover:bg-brand-purple/30 transition-colors duration-200"
                      title="Open"
                    >
                      <HiOutlineExternalLink className="text-lg text-brand-pink" />
                    </motion.a>
                  </div>
                </div>

                {/* Original URL */}
                <div className="bg-brand-navy/80 rounded-xl p-4 mb-6 border border-brand-purple/10">
                  <p className="text-[11px] text-brand-cream/40 mb-1 uppercase tracking-widest font-medium">
                    Original URL
                  </p>
                  <p className="text-brand-cream/60 text-sm truncate font-mono">
                    {result.longUrl}
                  </p>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-brand-navy/60 rounded-xl p-3.5 border border-brand-purple/10">
                    <p className="text-[11px] text-brand-cream/40 uppercase tracking-widest font-medium">
                      Short Code
                    </p>
                    <p className="text-brand-cream font-mono font-medium mt-0.5">
                      {result.shortCode}
                    </p>
                  </div>
                  <div className="bg-brand-navy/60 rounded-xl p-3.5 border border-brand-purple/10">
                    <p className="text-[11px] text-brand-cream/40 uppercase tracking-widest font-medium">
                      Expires
                    </p>
                    <p className="text-brand-cream font-medium mt-0.5">
                      {result.expiryDate
                        ? new Date(result.expiryDate).toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetForm}
                  className="btn-secondary w-full py-3 rounded-xl font-semibold"
                >
                  Shorten Another URL
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Features Grid ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14"
      >
        {features.map((feat, i) => (
          <motion.div
            key={feat.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.08 }}
            className="glass glass-hover rounded-xl p-5 text-center group cursor-default"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple/20 to-brand-pink/10 flex items-center justify-center mx-auto mb-3 group-hover:from-brand-purple/30 group-hover:to-brand-pink/20 transition-all duration-200">
              <feat.icon className="text-xl text-brand-pink" />
            </div>
            <h3 className="text-sm font-semibold text-brand-cream mb-1">
              {feat.title}
            </h3>
            <p className="text-xs text-brand-cream/40 leading-relaxed">
              {feat.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* ── History ──────────────────────────────────────── */}
      <AnimatePresence>
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-14"
          >
            <h3 className="text-sm font-semibold text-brand-cream/50 uppercase tracking-widest mb-4">
              Recent Links
            </h3>
            <div className="space-y-3">
              {history.map((item, i) => (
                <motion.div
                  key={item.shortCode + i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass glass-hover rounded-xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-brand-pink font-mono text-sm truncate">
                      {item.shortUrl}
                    </p>
                    <p className="text-brand-cream/35 text-xs truncate mt-1">
                      {item.longUrl}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(item.shortUrl)}
                      className="p-2 rounded-lg bg-brand-purple/10 hover:bg-brand-purple/25 transition-colors duration-200"
                    >
                      <HiOutlineClipboardCopy className="text-brand-pink/70" />
                    </motion.button>
                    <motion.a
                      href={getRedirectUrl(item.shortCode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-brand-purple/10 hover:bg-brand-purple/25 transition-colors duration-200"
                    >
                      <HiOutlineExternalLink className="text-brand-pink/70" />
                    </motion.a>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
