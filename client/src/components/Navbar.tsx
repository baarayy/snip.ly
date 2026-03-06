"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiOutlineLink,
  HiOutlineChartBar,
  HiOutlineBookOpen,
  HiOutlineTerminal,
  HiOutlineStatusOnline,
  HiOutlineFire,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineLogin,
  HiOutlineViewGrid,
  HiOutlineLogout,
  HiOutlineUser,
} from "react-icons/hi";
import { LogoFull } from "./Logo";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/lib/AuthContext";

const links = [
  { href: "/", label: "Shorten", icon: HiOutlineLink },
  { href: "/analytics", label: "Analytics", icon: HiOutlineChartBar },
  { href: "/trending", label: "Trending", icon: HiOutlineFire },
  { href: "/docs", label: "Docs", icon: HiOutlineBookOpen },
  { href: "/run-locally", label: "Run Locally", icon: HiOutlineTerminal },
  { href: "/status", label: "Status", icon: HiOutlineStatusOnline },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Track scroll to add compact style
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 glass border-b border-brand-purple/15 transition-all duration-300 ${
        scrolled ? "shadow-lg shadow-black/10" : ""
      }`}
      style={{
        backdropFilter: scrolled ? "blur(20px)" : "blur(16px)",
      }}
    >
      <div
        className={`max-w-6xl mx-auto px-6 flex items-center justify-between transition-all duration-300 ${
          scrolled ? "h-14" : "h-16"
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <LogoFull />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="relative px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-200 flex items-center gap-2"
                style={{
                  color: isActive ? "var(--cream)" : "var(--text-muted)",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg"
                    style={{
                      background: "var(--tab-active-bg)",
                      border: "1px solid var(--tab-active-border)",
                    }}
                    transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <Icon className="relative z-10 text-[15px]" />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            className="ml-2 p-2 rounded-lg transition-colors duration-200"
            style={{
              background: "var(--tab-active-bg)",
              color: "var(--cream)",
            }}
            aria-label="Toggle theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === "dark" ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiOutlineSun className="text-[16px]" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HiOutlineMoon className="text-[16px]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Auth section */}
          {user ? (
            <div className="relative ml-2" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors duration-200 hover:bg-brand-purple/10"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-7 h-7 rounded-full"
                  />
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: "var(--brand-purple)",
                      color: "white",
                    }}
                  >
                    {(user.name || user.email)[0].toUpperCase()}
                  </div>
                )}
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 rounded-xl glass border border-brand-purple/20 shadow-xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-brand-purple/10">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--cream)" }}
                      >
                        {user.name || "User"}
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-brand-purple/10 transition-colors"
                        style={{ color: "var(--cream)" }}
                      >
                        <HiOutlineViewGrid className="text-base" />
                        Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-brand-purple/10 transition-colors w-full text-left"
                        style={{ color: "var(--cream)" }}
                      >
                        <HiOutlineLogout className="text-base" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-lg text-[13px] font-medium transition-colors duration-200 flex items-center gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                <HiOutlineLogin className="text-[15px]" />
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-3.5 py-2 rounded-lg text-[13px] font-semibold transition-colors duration-200"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand-purple), var(--brand-teal))",
                  color: "white",
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-brand-purple/10 transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <HiOutlineX className="w-5 h-5 text-brand-cream" />
          ) : (
            <HiOutlineMenu className="w-5 h-5 text-brand-cream" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-brand-purple/10"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-purple/20 text-brand-cream"
                        : "text-brand-cream/55 hover:text-brand-cream hover:bg-brand-purple/10"
                    }`}
                  >
                    <Icon className="text-base" />
                    {label}
                  </Link>
                );
              })}

              {/* Mobile auth links */}
              <div className="border-t border-brand-purple/10 mt-2 pt-2">
                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-brand-cream/55 hover:text-brand-cream hover:bg-brand-purple/10 transition-colors"
                    >
                      <HiOutlineViewGrid className="text-base" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-brand-cream/55 hover:text-brand-cream hover:bg-brand-purple/10 transition-colors w-full"
                    >
                      <HiOutlineLogout className="text-base" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-brand-cream/55 hover:text-brand-cream hover:bg-brand-purple/10 transition-colors"
                    >
                      <HiOutlineLogin className="text-base" />
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-brand-cream/55 hover:text-brand-cream hover:bg-brand-purple/10 transition-colors"
                    >
                      <HiOutlineUser className="text-base" />
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
