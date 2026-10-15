"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "./Icons";

// Decorative pieces for the redesign. Everything is drawn with SVG and a
// little maths, so there are no image files to download or host.
// Think of it as a radar screen: every blip is a ticket waiting for IT.

// "Good morning", "Good afternoon" or "Good evening"
export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// "Melody Adeyemi" becomes "Melody", "ada@test.com" becomes "ada"
export function firstName(name) {
  const word = (name || "").split(/[\s@]+/).filter(Boolean)[0];
  return word || "there";
}

/* ---------- Radar artwork (hero banner and sign-in panel) ---------- */
const CENTER = 200;

function onCircle(radius, degrees) {
  const angle = (degrees * Math.PI) / 180;
  return [CENTER + Math.cos(angle) * radius, CENTER + Math.sin(angle) * radius];
}

const TICKS = Array.from({ length: 72 }, (_, i) => {
  const long = i % 6 === 0;
  const [x1, y1] = onCircle(long ? 174 : 181, i * 5);
  const [x2, y2] = onCircle(190, i * 5);
  return { x1, y1, x2, y2, long };
});

// Where the blips sit: [radius, angle, size, delay in seconds]
const BLIPS = [
  [60, 300, 4, 0.4],
  [100, 20, 5, 1.6],
  [100, 200, 3.5, 2.8],
  [140, 120, 5.5, 0.9],
  [140, 330, 3.5, 3.4],
];

export function SignalArt({ className = "" }) {
  return (
    <svg
      className={"signal-art " + className}
      viewBox="0 0 400 400"
      aria-hidden="true"
      focusable="false"
    >
      <g className="signal-ticks">
        {TICKS.map((t, i) => (
          <line
            key={i}
            x1={t.x1.toFixed(2)}
            y1={t.y1.toFixed(2)}
            x2={t.x2.toFixed(2)}
            y2={t.y2.toFixed(2)}
            className={t.long ? "tick tick-long" : "tick"}
          />
        ))}
      </g>

      <circle className="orbit" cx={CENTER} cy={CENTER} r="140" />
      <circle className="orbit" cx={CENTER} cy={CENTER} r="100" />
      <circle className="orbit" cx={CENTER} cy={CENTER} r="60" />
      <path className="crosshair" d="M200 40V360M40 200H360" />

      <circle className="ping ping-1" cx={CENTER} cy={CENTER} r="150" />
      <circle className="ping ping-2" cx={CENTER} cy={CENTER} r="150" />
      <circle className="ping ping-3" cx={CENTER} cy={CENTER} r="150" />

      <g className="sweep">
        <path d="M200 200 L340 200 A140 140 0 0 0 307.2 110 Z" />
        <line x1="200" y1="200" x2="340" y2="200" />
      </g>

      {BLIPS.map(([radius, degrees, size, delay]) => {
        const [x, y] = onCircle(radius, degrees);
        return (
          <circle
            key={radius + "-" + degrees}
            className="blip"
            cx={x.toFixed(2)}
            cy={y.toFixed(2)}
            r={size}
            style={{ animationDelay: delay + "s" }}
          />
        );
      })}

      <circle className="core" cx={CENTER} cy={CENTER} r="7" />
    </svg>
  );
}

/* ---------- Page background: soft map-style contour lines ---------- */
// Draws a wobbly closed loop around a centre, like a line on a hiking map
function contour(cx, cy, radius, seed) {
  const count = 28;
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const wobble =
      1 +
      0.12 * Math.sin(2 * angle + seed) +
      0.08 * Math.sin(3 * angle + seed * 1.7) +
      0.05 * Math.sin(5 * angle + seed * 2.3);
    points.push([
      cx + Math.cos(angle) * radius * wobble,
      cy + Math.sin(angle) * radius * wobble * 0.82,
    ]);
  }
  const fmt = (p) => p[0].toFixed(1) + " " + p[1].toFixed(1);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = "M" + fmt(mid(points[count - 1], points[0]));
  for (let i = 0; i < count; i++) {
    d += "Q" + fmt(points[i]) + " " + fmt(mid(points[i], points[(i + 1) % count]));
  }
  return d + "Z";
}

const CONTOURS = [
  ...Array.from({ length: 13 }, (_, i) => contour(1300, 180, 70 + i * 46, 0.8)),
  ...Array.from({ length: 11 }, (_, i) => contour(260, 840, 60 + i * 52, 2.4)),
];

export function Backdrop() {
  return (
    <div className="backdrop" aria-hidden="true">
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        {CONTOURS.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    </div>
  );
}

/* ---------- Numbers that count up when a page opens ---------- */
export function CountUp({ value }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 0 : 900;
    const start = from.current;
    let begin = null;
    let frame;

    function tick(now) {
      if (begin === null) begin = now;
      const t = duration === 0 ? 1 : Math.min(1, (now - begin) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // starts fast, settles gently
      setShown(Math.round(start + (value - start) * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        from.current = value;
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  // Screen readers get the final number straight away
  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{value}</span>
    </>
  );
}

/* ---------- Left panel on the sign-in and sign-up pages ---------- */
export function AuthAside() {
  return (
    <aside className="auth-aside">
      <SignalArt className="auth-art" />
      <div className="brand">
        <LogoMark />
        <span className="brand-name">Smart IT Helpdesk</span>
      </div>
      <div className="auth-aside-copy">
        <h2 className="auth-aside-title">Log it. Track it. Close it.</h2>
        <ul className="auth-aside-list">
          <li>One place for every IT request.</li>
          <li>Time limits by priority, so nothing waits unseen.</li>
          <li>Staff manage the queue. You see only your own tickets.</li>
        </ul>
        
      </div>
    </aside>
  );
}