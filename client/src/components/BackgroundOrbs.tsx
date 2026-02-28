"use client";

export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none transition-opacity duration-500">
      {/* Top-left purple orb */}
      <div
        className="orb animate-float"
        style={{
          width: 500,
          height: 500,
          top: "-10%",
          left: "-5%",
          background:
            "radial-gradient(circle, var(--orb-purple) 0%, transparent 70%)",
        }}
      />
      {/* Center-right pink orb */}
      <div
        className="orb animate-float"
        style={{
          width: 400,
          height: 400,
          top: "30%",
          right: "-8%",
          background:
            "radial-gradient(circle, var(--orb-pink) 0%, transparent 70%)",
          animationDelay: "2s",
        }}
      />
      {/* Bottom-left cream orb */}
      <div
        className="orb animate-float"
        style={{
          width: 350,
          height: 350,
          bottom: "5%",
          left: "15%",
          background:
            "radial-gradient(circle, var(--orb-cream) 0%, transparent 70%)",
          animationDelay: "4s",
        }}
      />

      {/* Additional floating particles */}
      <div
        className="orb animate-float"
        style={{
          width: 200,
          height: 200,
          top: "60%",
          right: "20%",
          background:
            "radial-gradient(circle, var(--orb-purple) 0%, transparent 70%)",
          animationDelay: "1s",
          animationDuration: "8s",
        }}
      />
      <div
        className="orb animate-float"
        style={{
          width: 150,
          height: 150,
          top: "15%",
          left: "45%",
          background:
            "radial-gradient(circle, var(--orb-pink) 0%, transparent 70%)",
          animationDelay: "3s",
          animationDuration: "10s",
        }}
      />

      {/* Animated light rays */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="light-rays" />
      </div>

      {/* Aurora sweep */}
      <div className="aurora" />

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
