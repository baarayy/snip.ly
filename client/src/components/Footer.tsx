"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { LogoFull } from "./Logo";
import { HiOutlineHeart, HiOutlineArrowUp } from "react-icons/hi";

const footerLinks = [
  {
    title: "Product",
    links: [
      { label: "Shorten URL", href: "/" },
      { label: "Analytics", href: "/analytics" },
      { label: "Trending", href: "/trending" },
      { label: "Documentation", href: "/docs" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "API Reference", href: "/docs" },
      { label: "Run Locally", href: "/run-locally" },
      { label: "System Status", href: "/status" },
    ],
  },
];

const techStack = [
  "Spring Boot",
  "NestJS",
  "Django",
  "Next.js",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "RabbitMQ",
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative z-10 border-t border-brand-purple/10 mt-24">
      <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand column */}
          <div className="md:col-span-2">
            <LogoFull className="mb-4" />
            <p className="text-brand-cream/40 text-sm leading-relaxed max-w-sm">
              A production-grade URL shortener built with polyglot
              microservices. Shorten, redirect, and track your links with
              real-time analytics.
            </p>
            {/* Tech stack badges */}
            <div className="flex flex-wrap gap-2 mt-5">
              {techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-[11px] font-medium tracking-wide rounded-full bg-brand-purple/10 text-brand-cream/50 border border-brand-purple/15 hover:bg-brand-purple/20 hover:text-brand-cream/70 transition-all duration-200 cursor-default"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-xs font-semibold text-brand-cream/60 uppercase tracking-widest mb-4">
                {group.title}
              </h4>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-cream/40 hover:text-brand-pink transition-colors duration-200 hover:translate-x-1 inline-block"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-brand-purple/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-brand-cream/30 text-xs flex items-center gap-1">
            Built with <HiOutlineHeart className="text-brand-pink/60 text-sm" />{" "}
            using microservices
          </p>
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-brand-purple/10 hover:bg-brand-purple/20 transition-colors duration-200 text-brand-cream/40 hover:text-brand-cream/70"
              aria-label="Back to top"
            >
              <HiOutlineArrowUp className="w-4 h-4" />
            </motion.button>
            <a
              href="https://github.com/baarayy/snip.ly"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-cream/30 hover:text-brand-cream/60 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
            <span className="text-brand-cream/20 text-xs font-mono">
              v1.0.0
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
