"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineStatusOnline,
  HiOutlineRefresh,
  HiOutlineServer,
  HiOutlineClock,
  HiOutlineDatabase,
} from "react-icons/hi";
import { checkServiceHealth, ServiceHealth } from "@/lib/api";

const SERVICES = [
  {
    name: "API Gateway",
    url: "http://localhost:8080/_health",
    description: "Nginx reverse proxy – routes requests to services",
    stack: "Nginx",
  },
  {
    name: "URL Service",
    url: "http://localhost:8081/api/v1/urls/health",
    description: "Creates & manages shortened URLs",
    stack: "Java / Spring Boot",
  },
  {
    name: "Redirect Service",
    url: "http://localhost:8082/_health",
    description: "Handles short code redirects with caching",
    stack: "TypeScript / NestJS",
  },
  {
    name: "Analytics Service",
    url: "http://localhost:8083/health",
    description: "Tracks click events and aggregates analytics",
    stack: "Python / Django",
  },
];

export default function StatusPage() {
  const [statuses, setStatuses] = useState<
    (ServiceHealth & { description: string; stack: string })[]
  >(
    SERVICES.map((s) => ({
      ...s,
      status: "loading" as const,
    })),
  );
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkAll = useCallback(async () => {
    setChecking(true);
    const results = await Promise.all(
      SERVICES.map(async (svc) => {
        const result = await checkServiceHealth(svc.name, svc.url);
        return { ...result, description: svc.description, stack: svc.stack };
      }),
    );
    setStatuses(results);
    setLastChecked(new Date());
    setChecking(false);
  }, []);

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, 30000);
    return () => clearInterval(interval);
  }, [checkAll]);

  const upCount = statuses.filter((s) => s.status === "up").length;
  const total = statuses.length;
  const allUp = upCount === total;

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
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-pink text-xs font-medium tracking-wide mb-5"
        >
          <HiOutlineStatusOnline className="text-sm" />
          Live Monitoring
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
          <span className="gradient-text">System</span>{" "}
          <span className="text-brand-cream/90">Status</span>
        </h1>
        <p className="text-brand-cream/45 max-w-lg mx-auto">
          Real-time health of all microservices. Auto-refreshes every 30
          seconds.
        </p>
      </motion.div>

      {/* Overall status banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className={`glass rounded-xl p-5 mb-8 border ${
          allUp ? "border-green-500/25" : "border-yellow-500/25"
        } flex items-center justify-between`}
      >
        <div className="flex items-center gap-4">
          <motion.div
            animate={{
              boxShadow: allUp
                ? [
                    "0 0 0px rgba(34,197,94,0.4)",
                    "0 0 20px rgba(34,197,94,0.15)",
                    "0 0 0px rgba(34,197,94,0.4)",
                  ]
                : [
                    "0 0 0px rgba(234,179,8,0.4)",
                    "0 0 20px rgba(234,179,8,0.15)",
                    "0 0 0px rgba(234,179,8,0.4)",
                  ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`w-3.5 h-3.5 rounded-full ${
              allUp ? "bg-green-500" : "bg-yellow-500"
            }`}
          />
          <div>
            <p className="font-semibold text-brand-cream text-base">
              {allUp
                ? "All Systems Operational"
                : `${upCount}/${total} Services Online`}
            </p>
            {lastChecked && (
              <p className="text-brand-cream/35 text-[11px] flex items-center gap-1 mt-0.5 font-mono">
                <HiOutlineClock className="text-xs" />
                Last checked: {lastChecked.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={checkAll}
          disabled={checking}
          className="p-2.5 rounded-xl bg-brand-purple/15 hover:bg-brand-purple/25 transition-colors duration-200 disabled:opacity-50"
          title="Refresh"
        >
          <motion.div
            animate={checking ? { rotate: 360 } : {}}
            transition={
              checking ? { duration: 1, repeat: Infinity, ease: "linear" } : {}
            }
          >
            <HiOutlineRefresh className="text-lg text-brand-pink" />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Service cards */}
      <div className="grid gap-3">
        {statuses.map((svc, i) => (
          <motion.div
            key={svc.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
            className="glass glass-hover rounded-xl p-4 border border-brand-purple/15 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-brand-purple/20 to-brand-pink/10">
                <HiOutlineServer className="text-lg text-brand-pink" />
              </div>
              <div>
                <p className="font-semibold text-brand-cream text-sm">
                  {svc.name}
                </p>
                <p className="text-brand-cream/35 text-[11px] mt-0.5 leading-relaxed">
                  {svc.description}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono text-brand-purple/80 bg-brand-purple/8 border border-brand-purple/10">
                  {svc.stack}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-4">
              {svc.latency !== undefined && svc.status === "up" && (
                <span className="text-brand-cream/25 text-[11px] font-mono tabular-nums">
                  {svc.latency}ms
                </span>
              )}
              <StatusBadge status={svc.status} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Infrastructure */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-10 glass rounded-xl p-6 border border-brand-purple/10"
      >
        <h3 className="text-[11px] font-semibold text-brand-cream/50 uppercase tracking-widest mb-4 flex items-center gap-2">
          <HiOutlineDatabase className="text-sm" /> Infrastructure
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              name: "PostgreSQL",
              port: "5432",
              role: "URL Storage",
              emoji: "🐘",
            },
            {
              name: "MongoDB",
              port: "27017",
              role: "Click Analytics",
              emoji: "🍃",
            },
            { name: "Redis", port: "6379", role: "Cache Layer", emoji: "⚡" },
            {
              name: "RabbitMQ",
              port: "5672",
              role: "Message Queue",
              emoji: "🐇",
            },
          ].map((infra, i) => (
            <motion.div
              key={infra.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.05 }}
              className="bg-brand-navy/60 rounded-lg p-3 border border-brand-purple/8 hover:border-brand-purple/15 transition-colors duration-200"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{infra.emoji}</span>
                <p className="text-brand-cream font-medium text-xs">
                  {infra.name}
                </p>
              </div>
              <p className="text-brand-cream/25 text-[11px] font-mono">
                :{infra.port}
              </p>
              <p className="text-brand-pink/50 text-[11px] mt-1">
                {infra.role}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function StatusBadge({ status }: { status: "up" | "down" | "loading" }) {
  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-brand-cream/5 text-brand-cream/40">
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="inline-block w-3 h-3 border-2 border-brand-cream/20 border-t-brand-cream/50 rounded-full"
        />
        Checking
      </span>
    );
  }

  if (status === "up") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        Online
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Offline
    </span>
  );
}
