"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { HiLink, HiChartBar, HiStatusOnline } from "react-icons/hi";

const links = [
  { href: "/", label: "Shorten", icon: HiLink },
  { href: "/analytics", label: "Analytics", icon: HiChartBar },
  { href: "/status", label: "Status", icon: HiStatusOnline },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 glass border-b border-brand-purple/20"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <HiLink className="text-white text-lg" />
          </div>
          <span className="text-lg font-bold gradient-text">snip.ly</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="relative px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex items-center gap-2"
                style={{
                  color: isActive ? "#F1E9E9" : "rgba(241,233,233,0.6)",
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-purple/30 to-brand-pink/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon className="relative z-10 text-base" />
                <span className="relative z-10">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
