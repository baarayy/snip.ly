"use client";

import { useState } from "react";
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
} from "react-icons/hi";
import { LogoFull } from "./Logo";

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

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-brand-purple/15"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
                  color: isActive ? "#F1E9E9" : "rgba(241,233,233,0.55)",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-brand-purple/20 border border-brand-purple/20"
                    transition={{ type: "spring", bounce: 0.18, duration: 0.5 }}
                  />
                )}
                <Icon className="relative z-10 text-[15px]" />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
