"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineTerminal,
  HiOutlineClipboardCopy,
  HiOutlineCheckCircle,
  HiOutlineCube,
  HiOutlineServer,
  HiOutlineGlobe,
  HiOutlineDatabase,
} from "react-icons/hi";
import toast from "react-hot-toast";

/* ── Prerequisites ────────────────────────────────────── */
const prerequisites = [
  { name: "Docker", version: "24+", icon: HiOutlineCube },
  { name: "Docker Compose", version: "2.20+", icon: HiOutlineServer },
  { name: "Git", version: "2.x", icon: HiOutlineTerminal },
  { name: "~4 GB RAM", version: "free", icon: HiOutlineDatabase },
];

/* ── Steps ────────────────────────────────────────────── */
const steps = [
  {
    number: 1,
    title: "Clone the Repository",
    description: "Get the source code onto your local machine.",
    command: "git clone https://github.com/baarayy/snip.ly.git\ncd snip.ly",
  },
  {
    number: 2,
    title: "Start All Services",
    description:
      "Docker Compose builds and starts all 9 containers: API Gateway, 3 application services, and 5 infrastructure services.",
    command: "docker compose up --build",
  },
  {
    number: 3,
    title: "Verify Services",
    description:
      "Wait ~30 seconds for all health checks to pass, then verify the gateway is healthy.",
    command: "curl http://localhost:8080/_health",
  },
  {
    number: 4,
    title: "Open the App",
    description:
      "Navigate to the client app in your browser. You're ready to shorten URLs!",
    command: "# Open in browser\nhttp://localhost:3000",
  },
];

/* ── Ports reference ──────────────────────────────────── */
const ports = [
  { service: "Client (Next.js)", port: "3000", color: "text-blue-400" },
  { service: "API Gateway (Nginx)", port: "8080", color: "text-brand-pink" },
  {
    service: "URL Service (Spring Boot)",
    port: "8081",
    color: "text-green-400",
  },
  {
    service: "Redirect Service (NestJS)",
    port: "8082",
    color: "text-yellow-400",
  },
  {
    service: "Analytics Service (Django)",
    port: "8083",
    color: "text-purple-400",
  },
  { service: "PostgreSQL", port: "5432", color: "text-brand-cream/50" },
  { service: "MongoDB", port: "27017", color: "text-brand-cream/50" },
  { service: "Redis", port: "6379", color: "text-red-400" },
  {
    service: "RabbitMQ (AMQP / UI)",
    port: "5672 / 15672",
    color: "text-orange-400",
  },
];

/* ── Useful commands ──────────────────────────────────── */
const usefulCommands = [
  { label: "Stop all services", command: "docker compose down" },
  {
    label: "Rebuild a single service",
    command: "docker compose up -d --build <service-name>",
  },
  { label: "View logs", command: "docker compose logs -f <service-name>" },
  { label: "Check running containers", command: "docker compose ps" },
  {
    label: "Reset everything (data included)",
    command: "docker compose down -v",
  },
  {
    label: "RabbitMQ Management UI",
    command:
      "# Open http://localhost:15672\n# User: urlshortener / Pass: urlshortener",
  },
];

export default function RunLocallyPage() {
  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-12"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-pink text-xs font-medium tracking-wide mb-5"
        >
          <HiOutlineTerminal className="text-sm" />
          Local Development
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
          <span className="gradient-text">Run</span>{" "}
          <span className="text-brand-cream/90">Locally</span>
        </h1>
        <p className="text-brand-cream/45 max-w-2xl mx-auto text-lg">
          Get the entire microservices stack running on your machine in under 5
          minutes with Docker Compose.
        </p>
      </motion.div>

      {/* Prerequisites */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-xl font-bold text-brand-cream mb-4">
          Prerequisites
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {prerequisites.map((req, i) => (
            <motion.div
              key={req.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.06 }}
              className="glass rounded-xl p-4 text-center"
            >
              <req.icon className="text-2xl text-brand-pink mx-auto mb-2" />
              <p className="text-sm font-medium text-brand-cream">{req.name}</p>
              <p className="text-xs text-brand-cream/40 font-mono mt-0.5">
                {req.version}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12"
      >
        <h2 className="text-xl font-bold text-brand-cream mb-6">Quick Start</h2>
        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className="flex gap-4"
            >
              {/* Step indicator */}
              <div className="shrink-0 flex flex-col items-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-purple to-brand-pink flex items-center justify-center text-white font-bold text-sm">
                  {step.number}
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-gradient-to-b from-brand-purple/30 to-transparent mt-2" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 pb-6">
                <h3 className="text-lg font-semibold text-brand-cream mb-1">
                  {step.title}
                </h3>
                <p className="text-brand-cream/50 text-sm mb-3 leading-relaxed">
                  {step.description}
                </p>
                <div className="code-block p-4 relative group">
                  <button
                    onClick={() => copyCode(step.command)}
                    className="absolute top-3 right-3 p-1.5 rounded hover:bg-brand-purple/15 transition-colors opacity-0 group-hover:opacity-100"
                    title="Copy"
                  >
                    <HiOutlineClipboardCopy className="text-sm text-brand-cream/40" />
                  </button>
                  <pre className="text-sm text-brand-cream/80">
                    <code>{step.command}</code>
                  </pre>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Port Reference */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="mb-12"
      >
        <h2 className="text-xl font-bold text-brand-cream mb-4">
          Port Reference
        </h2>
        <div className="glass rounded-xl border border-brand-purple/15 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-brand-cream/40 text-xs uppercase tracking-wider border-b border-brand-purple/10">
                  <th className="text-left px-5 py-3">Service</th>
                  <th className="text-left px-5 py-3">Port</th>
                  <th className="text-left px-5 py-3">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-purple/5">
                {ports.map(({ service, port, color }) => (
                  <tr
                    key={service}
                    className="text-brand-cream/60 hover:bg-brand-purple/5 transition-colors"
                  >
                    <td className="px-5 py-2.5 font-medium text-brand-cream/80">
                      {service}
                    </td>
                    <td className={`px-5 py-2.5 font-mono text-xs ${color}`}>
                      {port}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-xs text-brand-cream/40">
                      localhost:{port.split(" ")[0]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Useful Commands */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-xl font-bold text-brand-cream mb-4">
          Useful Commands
        </h2>
        <div className="space-y-3">
          {usefulCommands.map((cmd, i) => (
            <motion.div
              key={cmd.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.05 }}
              className="glass rounded-xl p-4 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row"
            >
              <div className="flex items-center gap-3 min-w-0">
                <HiOutlineCheckCircle className="text-brand-pink/60 shrink-0" />
                <span className="text-sm text-brand-cream/70 font-medium">
                  {cmd.label}
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <code className="text-xs font-mono text-brand-cream/50 bg-brand-navy/60 px-3 py-1.5 rounded-lg border border-brand-purple/10 truncate flex-1 sm:flex-none sm:max-w-xs">
                  {cmd.command.split("\n")[0]}
                </code>
                <button
                  onClick={() => copyCode(cmd.command)}
                  className="p-1.5 rounded-lg hover:bg-brand-purple/15 transition-colors shrink-0"
                  title="Copy"
                >
                  <HiOutlineClipboardCopy className="text-sm text-brand-cream/30 hover:text-brand-cream/60" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Docker Compose visual */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.65 }}
        className="mt-12 glass rounded-xl p-6 border border-brand-purple/15"
      >
        <h3 className="text-lg font-semibold text-brand-cream mb-3">
          Container Overview
        </h3>
        <p className="text-brand-cream/45 text-sm mb-4">
          Running{" "}
          <code className="text-brand-pink/70 bg-brand-navy/60 px-1.5 py-0.5 rounded text-xs">
            docker compose up --build
          </code>{" "}
          starts 9 containers on a shared Docker network:
        </p>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {[
            { name: "Nginx", emoji: "🌐" },
            { name: "Spring Boot", emoji: "☕" },
            { name: "NestJS", emoji: "🟢" },
            { name: "Django", emoji: "🐍" },
            { name: "Next.js", emoji: "⚛️" },
            { name: "PostgreSQL", emoji: "🐘" },
            { name: "MongoDB", emoji: "🍃" },
            { name: "Redis", emoji: "🔴" },
            { name: "RabbitMQ", emoji: "🐰" },
          ].map((c) => (
            <div
              key={c.name}
              className="bg-brand-navy/60 rounded-lg p-2.5 text-center border border-brand-purple/10"
            >
              <span className="text-lg block mb-0.5">{c.emoji}</span>
              <span className="text-[11px] text-brand-cream/50 font-medium">
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
