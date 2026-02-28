"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  HiOutlineCode,
  HiOutlineServer,
  HiOutlineLightningBolt,
  HiOutlineDatabase,
  HiOutlineChartBar,
  HiOutlineGlobe,
  HiOutlineShieldCheck,
  HiOutlineClipboardCopy,
} from "react-icons/hi";
import toast from "react-hot-toast";

/* ── Sidebar sections ─────────────────────────────────── */
const sections = [
  { id: "overview", label: "Overview" },
  { id: "api", label: "API Reference" },
  { id: "architecture", label: "Architecture" },
  { id: "features", label: "Features" },
];

/* ── API endpoints ────────────────────────────────────── */
const endpoints = [
  {
    method: "POST" as const,
    path: "/api/v1/urls",
    title: "Create Short URL",
    description:
      "Creates a new shortened URL with optional custom alias and expiry date.",
    request: `{
  "longUrl": "https://example.com/very/long/url",
  "customAlias": "my-link",
  "expiryDate": "2026-12-31T23:59:59"
}`,
    response: `{
  "shortUrl": "http://localhost:8080/my-link",
  "shortCode": "my-link",
  "longUrl": "https://example.com/very/long/url",
  "expiryDate": "2026-12-31T23:59:59",
  "createdAt": "2026-02-28T12:00:00.000Z"
}`,
    responseStatus: "201 Created",
  },
  {
    method: "GET" as const,
    path: "/api/v1/urls/{shortCode}/analytics",
    title: "Get Analytics",
    description:
      "Retrieves click analytics for a specific short URL, including geographic and temporal breakdowns.",
    request: null,
    response: `{
  "shortCode": "my-link",
  "totalClicks": 142,
  "clicksByCountry": {
    "US": 89,
    "UK": 31,
    "DE": 22
  },
  "clicksByDate": {
    "2026-02-27": 65,
    "2026-02-28": 77
  },
  "recentClicks": [
    {
      "timestamp": "2026-02-28T14:30:00Z",
      "ip_address": "203.0.113.1",
      "user_agent": "Mozilla/5.0...",
      "referrer": "https://twitter.com",
      "country": "US"
    }
  ]
}`,
    responseStatus: "200 OK",
  },
  {
    method: "GET" as const,
    path: "/{shortCode}",
    title: "Redirect",
    description:
      "Redirects the client to the original long URL. Returns 301 permanent redirect. Also publishes a click event to RabbitMQ for async analytics processing.",
    request: null,
    response: `HTTP/1.1 301 Moved Permanently
Location: https://example.com/very/long/url`,
    responseStatus: "301 Moved Permanently",
  },
];

/* ── Architecture flow steps ──────────────────────────── */
const flowSteps = [
  {
    icon: HiOutlineGlobe,
    title: "Client Request",
    desc: "Browser sends request to Nginx API Gateway on port 8080",
    color: "text-blue-400",
  },
  {
    icon: HiOutlineServer,
    title: "Route & Proxy",
    desc: "Nginx routes to URL Service (Spring Boot), Redirect Service (NestJS), or Analytics Service (Django)",
    color: "text-brand-pink",
  },
  {
    icon: HiOutlineDatabase,
    title: "Data Layer",
    desc: "PostgreSQL stores URLs, Redis caches hot redirects, MongoDB stores click events",
    color: "text-green-400",
  },
  {
    icon: HiOutlineLightningBolt,
    title: "Async Events",
    desc: "RabbitMQ decouples redirect from analytics — click events processed asynchronously",
    color: "text-yellow-400",
  },
  {
    icon: HiOutlineChartBar,
    title: "Analytics",
    desc: "Django consumer persists events to MongoDB; aggregation pipelines power the dashboard",
    color: "text-purple-400",
  },
];

/* ── Features list ────────────────────────────────────── */
const featuresList = [
  {
    icon: HiOutlineLightningBolt,
    title: "Fast Redirects",
    desc: "Redis cache layer ensures sub-10ms redirect lookups for popular URLs.",
  },
  {
    icon: HiOutlineChartBar,
    title: "Real-time Analytics",
    desc: "Per-URL click tracking with country breakdown, temporal trends, and recent activity.",
  },
  {
    icon: HiOutlineDatabase,
    title: "Multi-Database",
    desc: "PostgreSQL for relational URL data, MongoDB for flexible analytics documents.",
  },
  {
    icon: HiOutlineShieldCheck,
    title: "Event-Driven",
    desc: "RabbitMQ message broker decouples services for reliability and scalability.",
  },
  {
    icon: HiOutlineServer,
    title: "Polyglot Services",
    desc: "Java (Spring Boot), TypeScript (NestJS), and Python (Django) working together.",
  },
  {
    icon: HiOutlineGlobe,
    title: "Production Ready",
    desc: "Docker Compose for local dev, Kubernetes manifests for cloud deployment.",
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
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
          <HiOutlineCode className="text-sm" />
          Developer Documentation
        </motion.div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
          <span className="gradient-text">API</span>{" "}
          <span className="text-brand-cream/90">Documentation</span>
        </h1>
        <p className="text-brand-cream/45 max-w-2xl mx-auto text-lg">
          Everything you need to integrate with the Snip.ly URL Shortener API.
          RESTful endpoints, real-time analytics, and event-driven architecture.
        </p>
      </motion.div>

      <div className="flex gap-8">
        {/* Sticky sidebar nav */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="hidden lg:block w-48 shrink-0"
        >
          <div className="sticky top-24 space-y-1">
            <p className="text-[11px] font-semibold text-brand-cream/40 uppercase tracking-widest mb-3">
              On this page
            </p>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActiveSection(section.id)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  activeSection === section.id
                    ? "bg-brand-purple/15 text-brand-cream border-l-2 border-brand-purple"
                    : "text-brand-cream/45 hover:text-brand-cream/70 hover:bg-brand-purple/5"
                }`}
              >
                {section.label}
              </a>
            ))}
          </div>
        </motion.aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-16">
          {/* ── Overview ──────────────────────────────────── */}
          <motion.section
            id="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h2 className="text-2xl font-bold text-brand-cream mb-4">
              Overview
            </h2>
            <div className="glass rounded-xl p-6 border border-brand-purple/15">
              <p className="text-brand-cream/60 leading-relaxed mb-4">
                Snip.ly is a production-grade URL shortener built with a{" "}
                <strong className="text-brand-cream/80">
                  polyglot microservices architecture
                </strong>
                . It provides URL shortening with custom aliases, permanent
                redirects with caching, and real-time click analytics.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <div className="bg-brand-navy/60 rounded-lg p-3 border border-brand-purple/10">
                  <p className="text-xs text-brand-cream/40 font-medium">
                    Base URL
                  </p>
                  <p className="text-brand-pink font-mono text-sm mt-1">
                    http://localhost:8080
                  </p>
                </div>
                <div className="bg-brand-navy/60 rounded-lg p-3 border border-brand-purple/10">
                  <p className="text-xs text-brand-cream/40 font-medium">
                    Content Type
                  </p>
                  <p className="text-brand-cream/70 font-mono text-sm mt-1">
                    application/json
                  </p>
                </div>
                <div className="bg-brand-navy/60 rounded-lg p-3 border border-brand-purple/10">
                  <p className="text-xs text-brand-cream/40 font-medium">
                    Auth
                  </p>
                  <p className="text-brand-cream/70 text-sm mt-1">
                    None required
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── API Reference ─────────────────────────────── */}
          <motion.section
            id="api"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-brand-cream mb-6">
              API Reference
            </h2>
            <div className="space-y-6">
              {endpoints.map((ep, i) => (
                <motion.div
                  key={ep.path}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.08 }}
                  className="glass rounded-xl border border-brand-purple/15 overflow-hidden"
                >
                  {/* Endpoint header */}
                  <div className="px-6 py-4 border-b border-brand-purple/10 flex items-center gap-3 flex-wrap">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide ${
                        ep.method === "POST"
                          ? "badge-post"
                          : ep.method === "GET"
                            ? "badge-get"
                            : "badge-put"
                      }`}
                    >
                      {ep.method}
                    </span>
                    <code className="text-brand-cream/80 font-mono text-sm">
                      {ep.path}
                    </code>
                    <span className="text-brand-cream/30 text-sm ml-auto hidden sm:inline">
                      {ep.responseStatus}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-brand-cream mb-1">
                      {ep.title}
                    </h3>
                    <p className="text-brand-cream/50 text-sm mb-5 leading-relaxed">
                      {ep.description}
                    </p>

                    {ep.request && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-semibold text-brand-cream/40 uppercase tracking-widest">
                            Request Body
                          </p>
                          <button
                            onClick={() => copyCode(ep.request!)}
                            className="p-1 rounded hover:bg-brand-purple/10 transition-colors"
                            title="Copy"
                          >
                            <HiOutlineClipboardCopy className="text-sm text-brand-cream/30 hover:text-brand-cream/60" />
                          </button>
                        </div>
                        <div className="code-block p-4">
                          <pre className="text-sm">
                            <code>{ep.request}</code>
                          </pre>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[11px] font-semibold text-brand-cream/40 uppercase tracking-widest">
                          Response
                        </p>
                        <button
                          onClick={() => copyCode(ep.response)}
                          className="p-1 rounded hover:bg-brand-purple/10 transition-colors"
                          title="Copy"
                        >
                          <HiOutlineClipboardCopy className="text-sm text-brand-cream/30 hover:text-brand-cream/60" />
                        </button>
                      </div>
                      <div className="code-block p-4">
                        <pre className="text-sm">
                          <code>{ep.response}</code>
                        </pre>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* cURL example */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mt-6 glass rounded-xl border border-brand-purple/15 p-6"
            >
              <h3 className="text-lg font-semibold text-brand-cream mb-3">
                Quick Start — cURL
              </h3>
              <div className="code-block p-4 relative">
                <button
                  onClick={() =>
                    copyCode(
                      `curl -X POST http://localhost:8080/api/v1/urls \\\n  -H "Content-Type: application/json" \\\n  -d '{"longUrl": "https://example.com"}'`,
                    )
                  }
                  className="absolute top-3 right-3 p-1.5 rounded hover:bg-brand-purple/10 transition-colors"
                  title="Copy"
                >
                  <HiOutlineClipboardCopy className="text-sm text-brand-cream/30 hover:text-brand-cream/60" />
                </button>
                <pre className="text-sm">
                  <code>
                    <span className="token-keyword">curl</span> -X POST
                    http://localhost:8080/api/v1/urls \{"\n"}
                    {"  "}-H{" "}
                    <span className="token-string">
                      &quot;Content-Type: application/json&quot;
                    </span>{" "}
                    \{"\n"}
                    {"  "}-d{" "}
                    <span className="token-string">{`'{"longUrl": "https://example.com"}'`}</span>
                  </code>
                </pre>
              </div>
            </motion.div>
          </motion.section>

          {/* ── Architecture ──────────────────────────────── */}
          <motion.section
            id="architecture"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h2 className="text-2xl font-bold text-brand-cream mb-6">
              Architecture
            </h2>
            <div className="glass rounded-xl p-6 border border-brand-purple/15 mb-6">
              <h3 className="text-lg font-semibold text-brand-cream mb-2">
                System Flow
              </h3>
              <p className="text-brand-cream/50 text-sm mb-6 leading-relaxed">
                Requests flow through an Nginx API gateway to three
                independently deployable microservices. Each service owns its
                data store and communicates asynchronously via RabbitMQ.
              </p>

              {/* Flow diagram */}
              <div className="space-y-4">
                {flowSteps.map((step, i) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-start gap-4"
                  >
                    <div className="shrink-0 flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-xl bg-brand-navy/80 border border-brand-purple/15 flex items-center justify-center ${step.color}`}
                      >
                        <step.icon className="text-xl" />
                      </div>
                      {i < flowSteps.length - 1 && (
                        <div className="w-px h-6 bg-gradient-to-b from-brand-purple/30 to-transparent mt-1" />
                      )}
                    </div>
                    <div className="pt-1.5">
                      <h4 className="text-sm font-semibold text-brand-cream">
                        {step.title}
                      </h4>
                      <p className="text-brand-cream/45 text-sm mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Service table */}
            <div className="glass rounded-xl border border-brand-purple/15 overflow-hidden">
              <div className="px-6 py-4 border-b border-brand-purple/10">
                <h3 className="text-lg font-semibold text-brand-cream">
                  Service Map
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-brand-cream/40 text-xs uppercase tracking-wider border-b border-brand-purple/10">
                      <th className="text-left px-6 py-3">Service</th>
                      <th className="text-left px-6 py-3">Technology</th>
                      <th className="text-left px-6 py-3">Port</th>
                      <th className="text-left px-6 py-3">Data Store</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-purple/5">
                    {[
                      [
                        "URL Service",
                        "Java / Spring Boot",
                        "8081",
                        "PostgreSQL",
                      ],
                      [
                        "Redirect Service",
                        "TypeScript / NestJS",
                        "8082",
                        "Redis + PostgreSQL",
                      ],
                      [
                        "Analytics Service",
                        "Python / Django",
                        "8083",
                        "MongoDB",
                      ],
                      ["API Gateway", "Nginx", "8080", "—"],
                      ["Client", "Next.js / React", "3000", "—"],
                    ].map(([name, tech, port, db]) => (
                      <tr
                        key={name}
                        className="text-brand-cream/60 hover:bg-brand-purple/5 transition-colors"
                      >
                        <td className="px-6 py-3 font-medium text-brand-cream/80">
                          {name}
                        </td>
                        <td className="px-6 py-3 font-mono text-xs">{tech}</td>
                        <td className="px-6 py-3 font-mono text-brand-pink/70">
                          {port}
                        </td>
                        <td className="px-6 py-3">{db}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.section>

          {/* ── Features ──────────────────────────────────── */}
          <motion.section
            id="features"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-brand-cream mb-6">
              Features
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featuresList.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 + i * 0.06 }}
                  className="glass glass-hover rounded-xl p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-purple/20 to-brand-pink/10 flex items-center justify-center shrink-0 mt-0.5">
                      <feat.icon className="text-lg text-brand-pink" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-brand-cream mb-1">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-brand-cream/45 leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
