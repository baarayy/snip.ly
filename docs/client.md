# Client (Web UI)

> **Stack:** Next.js 14 + React 18 + Tailwind CSS 3.4 + Framer Motion 11  
> **Port:** 3000

## Overview

The Client is a single-page application providing the user interface for the URL Shortener platform. It communicates with the backend services through the API Gateway and connects to the WS Service for real-time updates via Socket.IO.

## Pages

| Route          | Page          | Description                                              |
| -------------- | ------------- | -------------------------------------------------------- |
| `/`            | Shorten       | URL shortening form with custom alias and expiry options |
| `/analytics`   | Analytics     | Search by short code, view click stats with live updates |
| `/trending`    | Trending      | Top 20 most clicked URLs, live-updating via WebSocket    |
| `/docs`        | Documentation | API reference with request/response examples             |
| `/run-locally` | Run Locally   | Setup guide for Docker Compose and K8s deployment        |
| `/status`      | Status        | Health check dashboard for all microservices             |

## Features

- **Dark/Light Theme:** Toggle between themes with `ThemeProvider` context, persisted to `localStorage`, respects `prefers-color-scheme`
- **Real-Time Updates:** Socket.IO integration via `useSocket` hook for live click events and trending updates
- **Animated Background:** Floating gradient orbs, rotating light rays, and grid overlay using CSS animations with GPU-optimized rendering
- **Glass Morphism:** Frosted glass card design using `backdrop-filter`
- **Responsive Design:** Mobile-first with collapsible navbar

## Key Components

| Component        | Purpose                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `ThemeProvider`  | Dark/light theme context with `data-theme` attribute on `<html>` |
| `BackgroundOrbs` | Animated background with floating gradient orbs and light rays   |
| `Navbar`         | Fixed top nav with 6 tabs, theme toggle, mobile hamburger menu   |
| `Footer`         | Site footer with links and branding                              |
| `Logo`           | SVG logo with full and compact variants                          |

## Design Tokens

The CSS uses a variable-driven token system defined in `globals.css`. Tailwind brand colors reference CSS variables for automatic theme switching:

```css
/* Dark theme */
--brand-cream-rgb: 241 233 233; /* Light text on dark bg */
--brand-navy-rgb: 21 23 61; /* Dark bg for cards/inputs */

/* Light theme */
--brand-cream-rgb: 30 27 46; /* Dark text on light bg */
--brand-navy-rgb: 248 246 255; /* Light bg for cards/inputs */
```

## Configuration

| Environment Variable  | Default                 | Description                                  |
| --------------------- | ----------------------- | -------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080` | API Gateway URL for client-side requests     |
| `NEXT_PUBLIC_WS_URL`  | `http://localhost:8080` | WebSocket endpoint (proxied through gateway) |
| `INTERNAL_API_URL`    | `http://api-gateway:80` | Internal API URL for SSR                     |

## Running Locally

```bash
cd client
npm install
npm run dev
```

## Building

```bash
cd client
npm run build
npm start
```
