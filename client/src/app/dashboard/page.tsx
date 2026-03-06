"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineLink,
  HiOutlineKey,
  HiOutlineClipboardCopy,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineExternalLink,
  HiOutlineChartBar,
} from "react-icons/hi";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import {
  getMyUrls,
  createAPIKey,
  listAPIKeys,
  revokeAPIKey,
  APIKeyInfo,
} from "@/lib/api";
import Link from "next/link";

interface UrlEntry {
  id: number;
  short_code: string;
  original_url: string;
  click_count: number;
  createdAt: string;
}

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"urls" | "apikeys">("urls");
  const [urls, setUrls] = useState<UrlEntry[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKeyInfo[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(true);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);

  const fetchUrls = useCallback(async () => {
    try {
      const data = await getMyUrls();
      setUrls(data.urls || []);
    } catch {
      // User might not have urls yet
      setUrls([]);
    } finally {
      setLoadingUrls(false);
    }
  }, []);

  const fetchApiKeys = useCallback(async () => {
    try {
      const data = await listAPIKeys();
      setApiKeys(data.apiKeys || []);
    } catch {
      setApiKeys([]);
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    if (user) {
      fetchUrls();
      fetchApiKeys();
    }
  }, [user, authLoading, router, fetchUrls, fetchApiKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const data = await createAPIKey(newKeyName.trim());
      setNewKeyValue(data.rawKey);
      setNewKeyName("");
      fetchApiKeys();
      toast.success("API key created!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeKey = async (id: number) => {
    try {
      await revokeAPIKey(id);
      fetchApiKeys();
      toast.success("API key revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied!");
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const BASE = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Profile header */}
        <div className="glass rounded-2xl p-6 border border-brand-purple/20 mb-6">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="w-14 h-14 rounded-full"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
                style={{ background: "var(--brand-purple)", color: "white" }}
              >
                {(user.name || user.email)[0].toUpperCase()}
              </div>
            )}
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: "var(--cream)" }}
              >
                {user.name || "User"}
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {user.email}
              </p>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: "var(--brand-purple)", color: "white" }}
              >
                {user.plan || "free"} plan
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("urls")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "urls"
                ? "bg-brand-purple/20 text-brand-cream"
                : "text-brand-cream/55 hover:bg-brand-purple/10"
            }`}
          >
            <HiOutlineLink className="text-base" />
            My URLs
          </button>
          <button
            onClick={() => setTab("apikeys")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "apikeys"
                ? "bg-brand-purple/20 text-brand-cream"
                : "text-brand-cream/55 hover:bg-brand-purple/10"
            }`}
          >
            <HiOutlineKey className="text-base" />
            API Keys
          </button>
        </div>

        {/* URLs Tab */}
        <AnimatePresence mode="wait">
          {tab === "urls" && (
            <motion.div
              key="urls"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {loadingUrls ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                </div>
              ) : urls.length === 0 ? (
                <div className="glass rounded-2xl p-8 border border-brand-purple/20 text-center">
                  <HiOutlineLink className="mx-auto text-3xl mb-3 text-brand-purple/50" />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No URLs yet. Go shorten some links!
                  </p>
                  <Link
                    href="/"
                    className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--brand-purple), var(--brand-teal))",
                      color: "white",
                    }}
                  >
                    Shorten a URL
                  </Link>
                </div>
              ) : (
                urls.map((url) => (
                  <div
                    key={url.id}
                    className="glass rounded-xl p-4 border border-brand-purple/20 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-sm font-mono font-medium"
                          style={{ color: "var(--brand-teal)" }}
                        >
                          {url.short_code}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(`${BASE}/${url.short_code}`)
                          }
                          className="text-brand-purple/50 hover:text-brand-purple transition-colors"
                        >
                          <HiOutlineClipboardCopy className="text-sm" />
                        </button>
                      </div>
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {url.original_url}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {url.click_count} clicks
                      </span>
                      <Link
                        href={`/analytics?code=${url.short_code}`}
                        className="p-1.5 rounded-lg hover:bg-brand-purple/10 transition-colors"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <HiOutlineChartBar className="text-base" />
                      </Link>
                      <a
                        href={url.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-brand-purple/10 transition-colors"
                        style={{ color: "var(--text-muted)" }}
                      >
                        <HiOutlineExternalLink className="text-base" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {/* API Keys Tab */}
          {tab === "apikeys" && (
            <motion.div
              key="apikeys"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Create key form */}
              <div className="glass rounded-2xl p-5 border border-brand-purple/20">
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: "var(--cream)" }}
                >
                  Create New API Key
                </h3>
                <form onSubmit={handleCreateKey} className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Key name (e.g. Production)"
                    required
                    className="flex-1 px-3 py-2 rounded-lg border border-brand-purple/20 bg-transparent focus:outline-none focus:border-brand-purple/50 text-sm transition-colors"
                    style={{ color: "var(--cream)" }}
                  />
                  <button
                    type="submit"
                    disabled={creatingKey}
                    className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 disabled:opacity-50"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--brand-purple), var(--brand-teal))",
                      color: "white",
                    }}
                  >
                    <HiOutlinePlus className="text-base" />
                    Create
                  </button>
                </form>

                {/* Show newly created key */}
                <AnimatePresence>
                  {newKeyValue && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 p-3 rounded-lg border border-green-500/30 bg-green-500/10"
                    >
                      <p
                        className="text-xs mb-1"
                        style={{ color: "var(--cream)" }}
                      >
                        Copy this key now — you won&apos;t see it again:
                      </p>
                      <div className="flex items-center gap-2">
                        <code
                          className="text-xs font-mono flex-1 break-all"
                          style={{ color: "var(--brand-teal)" }}
                        >
                          {newKeyValue}
                        </code>
                        <button
                          onClick={() => {
                            copyToClipboard(newKeyValue);
                            setNewKeyValue(null);
                          }}
                          className="p-1.5 rounded hover:bg-green-500/20 transition-colors"
                          style={{ color: "var(--cream)" }}
                        >
                          <HiOutlineClipboardCopy />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Existing keys */}
              {loadingKeys ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="glass rounded-2xl p-8 border border-brand-purple/20 text-center">
                  <HiOutlineKey className="mx-auto text-3xl mb-3 text-brand-purple/50" />
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    No API keys yet. Create one above.
                  </p>
                </div>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="glass rounded-xl p-4 border border-brand-purple/20 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--cream)" }}
                      >
                        {key.name}
                      </p>
                      <p
                        className="text-xs font-mono mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {key.prefix}...
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Created {new Date(key.createdAt).toLocaleDateString()}
                        {key.lastUsed &&
                          ` · Last used ${new Date(key.lastUsed).toLocaleDateString()}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-colors"
                      title="Revoke key"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
