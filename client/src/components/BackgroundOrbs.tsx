"use client";

export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Top-left purple orb */}
      <div
        className="orb animate-float"
        style={{
          width: 500,
          height: 500,
          top: "-10%",
          left: "-5%",
          background:
            "radial-gradient(circle, rgba(152,37,152,0.35) 0%, transparent 70%)",
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
            "radial-gradient(circle, rgba(228,145,201,0.25) 0%, transparent 70%)",
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
            "radial-gradient(circle, rgba(241,233,233,0.12) 0%, transparent 70%)",
          animationDelay: "4s",
        }}
      />
      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(152,37,152,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(152,37,152,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
