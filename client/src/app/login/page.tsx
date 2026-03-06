"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { HiOutlineMail, HiOutlineLockClosed } from "react-icons/hi";
import { FaGoogle, FaGithub } from "react-icons/fa";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { getOAuthGoogleUrl, getOAuthGitHubUrl } from "@/lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="glass rounded-2xl p-8 border border-brand-purple/20">
          <h1
            className="text-2xl font-bold text-center mb-2"
            style={{ color: "var(--cream)" }}
          >
            Welcome Back
          </h1>
          <p
            className="text-center text-sm mb-8"
            style={{ color: "var(--text-muted)" }}
          >
            Sign in to your snip.ly account
          </p>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <a
              href={getOAuthGoogleUrl()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand-purple/20 hover:bg-brand-purple/10 transition-colors text-sm font-medium"
              style={{ color: "var(--cream)" }}
            >
              <FaGoogle className="text-base" />
              Google
            </a>
            <a
              href={getOAuthGitHubUrl()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-brand-purple/20 hover:bg-brand-purple/10 transition-colors text-sm font-medium"
              style={{ color: "var(--cream)" }}
            >
              <FaGithub className="text-base" />
              GitHub
            </a>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex-1 h-px"
              style={{ background: "var(--tab-active-border)" }}
            />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              or
            </span>
            <div
              className="flex-1 h-px"
              style={{ background: "var(--tab-active-border)" }}
            />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Email
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-purple/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-purple/20 bg-transparent focus:outline-none focus:border-brand-purple/50 text-sm transition-colors"
                  style={{ color: "var(--cream)" }}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-purple/50" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-brand-purple/20 bg-transparent focus:outline-none focus:border-brand-purple/50 text-sm transition-colors"
                  style={{ color: "var(--cream)" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 disabled:opacity-50"
              style={{
                background:
                  "linear-gradient(135deg, var(--brand-purple), var(--brand-teal))",
                color: "white",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p
            className="text-center text-sm mt-6"
            style={{ color: "var(--text-muted)" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-brand-purple hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
