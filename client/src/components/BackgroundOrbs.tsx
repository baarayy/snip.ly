"use client";

export default function BackgroundOrbs() {
  return (
    <div
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ willChange: "auto", contain: "strict" }}
    >
      {/* Top-left purple orb */}
      <div
        className="orb animate-float"
        style={{
          width: 420,
          height: 420,
          top: "-8%",
          left: "-5%",
          background:
            "radial-gradient(circle, var(--orb-purple) 0%, transparent 70%)",
          willChange: "transform",
        }}
      />
      {/* Center-right pink orb */}
      <div
        className="orb animate-float"
        style={{
          width: 340,
          height: 340,
          top: "30%",
          right: "-6%",
          background:
            "radial-gradient(circle, var(--orb-pink) 0%, transparent 70%)",
          animationDelay: "2s",
          willChange: "transform",
        }}
      />
      {/* Bottom-left cream orb */}
      <div
        className="orb animate-float"
        style={{
          width: 280,
          height: 280,
          bottom: "5%",
          left: "15%",
          background:
            "radial-gradient(circle, var(--orb-cream) 0%, transparent 70%)",
          animationDelay: "4s",
          willChange: "transform",
        }}
      />

      {/* Animated light rays */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="light-rays" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          opacity: "var(--grid-opacity)",
          backgroundImage: `linear-gradient(var(--purple) 1px, transparent 1px),
                            linear-gradient(90deg, var(--purple) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
