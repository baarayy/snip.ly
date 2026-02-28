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
} from "react-icons/hi";
import { createShortUrl, CreateUrlResponse, getRedirectUrl } from "@/lib/api";

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
        className="text-center mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold mb-4">
          <span className="gradient-text">Shorten.</span>{" "}
          <span className="text-brand-cream/90">Share.</span>{" "}
          <span className="gradient-text">Track.</span>
        </h1>
        <p className="text-brand-cream/50 text-lg max-w-xl mx-auto">
          Transform long URLs into clean, trackable links. Powered by a
          microservices architecture with real-time analytics.
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
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-purple/70 group-focus-within:text-brand-pink transition-colors">
                    <HiOutlineLink className="text-xl" />
                  </div>
                  <input
                    type="url"
                    value={longUrl}
                    onChange={(e) => setLongUrl(e.target.value)}
                    placeholder="Paste your long URL here..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-brand-navy/80 border border-brand-purple/20 text-brand-cream placeholder-brand-cream/30 text-lg transition-all duration-300 focus:border-brand-purple/50"
                  />
                </div>

                {/* Options toggle */}
                <motion.button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className="text-sm text-brand-pink/70 hover:text-brand-pink mb-4 flex items-center gap-1 transition-colors"
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
                      transition={{ duration: 0.3 }}
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
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-brand-navy/80 border border-brand-purple/20 text-brand-cream placeholder-brand-cream/30 text-sm transition-all duration-300 focus:border-brand-purple/50"
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
                            className="w-full pl-10 pr-4 py-3 rounded-lg bg-brand-navy/80 border border-brand-purple/20 text-brand-cream text-sm transition-all duration-300 focus:border-brand-purple/50 [color-scheme:dark]"
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
                  className="btn-shimmer w-full py-4 rounded-xl font-semibold text-lg text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading
                      ? "rgba(152, 37, 152, 0.4)"
                      : "linear-gradient(135deg, #982598, #E491C9)",
                  }}
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
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center mx-auto mb-4"
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
                    <p className="text-xs text-brand-cream/40 mb-1 uppercase tracking-wider">
                      Short URL
                    </p>
                    <p className="text-brand-pink font-mono text-lg truncate">
                      {result.shortUrl}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(result.shortUrl)}
                      className="p-2.5 rounded-lg bg-brand-purple/20 hover:bg-brand-purple/40 transition-colors"
                      title="Copy"
                    >
                      <HiOutlineClipboardCopy className="text-lg text-brand-pink" />
                    </motion.button>
                    <motion.a
                      href={getRedirectUrl(result.shortCode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2.5 rounded-lg bg-brand-purple/20 hover:bg-brand-purple/40 transition-colors"
                      title="Open"
                    >
                      <HiOutlineExternalLink className="text-lg text-brand-pink" />
                    </motion.a>
                  </div>
                </div>

                {/* Original URL */}
                <div className="bg-brand-navy/80 rounded-xl p-4 mb-6 border border-brand-purple/10">
                  <p className="text-xs text-brand-cream/40 mb-1 uppercase tracking-wider">
                    Original URL
                  </p>
                  <p className="text-brand-cream/70 text-sm truncate font-mono">
                    {result.longUrl}
                  </p>
                </div>

                {/* Details row */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-brand-navy/60 rounded-lg p-3 border border-brand-purple/10">
                    <p className="text-xs text-brand-cream/40">Short Code</p>
                    <p className="text-brand-cream font-mono font-medium">
                      {result.shortCode}
                    </p>
                  </div>
                  <div className="bg-brand-navy/60 rounded-lg p-3 border border-brand-purple/10">
                    <p className="text-xs text-brand-cream/40">Expires</p>
                    <p className="text-brand-cream font-medium">
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
                  className="w-full py-3 rounded-xl font-semibold text-brand-cream bg-brand-purple/20 hover:bg-brand-purple/30 border border-brand-purple/30 transition-all duration-300"
                >
                  Shorten Another URL
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── History ──────────────────────────────────────── */}
      <AnimatePresence>
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12"
          >
            <h3 className="text-lg font-semibold text-brand-cream/70 mb-4">
              Recent Links
            </h3>
            <div className="space-y-3">
              {history.map((item, i) => (
                <motion.div
                  key={item.shortCode + i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass glass-hover rounded-xl p-4 flex items-center justify-between gap-4 transition-all duration-300"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-brand-pink font-mono text-sm truncate">
                      {item.shortUrl}
                    </p>
                    <p className="text-brand-cream/40 text-xs truncate mt-0.5">
                      {item.longUrl}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => copyToClipboard(item.shortUrl)}
                      className="p-2 rounded-lg bg-brand-purple/10 hover:bg-brand-purple/30 transition-colors"
                    >
                      <HiOutlineClipboardCopy className="text-brand-pink/70" />
                    </motion.button>
                    <motion.a
                      href={getRedirectUrl(item.shortCode)}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-brand-purple/10 hover:bg-brand-purple/30 transition-colors"
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
