import React from "react";
import { AbsoluteFill, Img, random } from "remotion";
import { PLEX_MONO } from "../../../../shared/fonts";
import { driftFor } from "../camera";
import { GHOSTS } from "../photos";
import { PAGE_COLOR } from "../timing";
import { useOpeningTiming } from "../TimingContext";

const INK = "#1d1d1d";

// Faint camera/shoot metadata scattered across the page.
const LINES = [
  "DSCN5630.JPG", "IMG_0579.CR2", "IMG_4234.HEIC", "IMG_7364.CR3",
  "f/2.8  1/250s  ISO 400", "f/1.8  1/1000s  ISO 100", "f/4  1/60s  ISO 1600",
  "35mm  ·  AF-S", "50mm  ·  MF", "85mm  f/1.4", "WB 5600K", "EV +0.3",
  "ROLL 04  ·  FRAME 17", "ROLL 11  ·  FRAME 02", "EXPOSURES 36",
  "2013.06.14  07:42", "2016.11.05  06:56", "2017.04.02  10:52",
  "2021.08.21  17:08", "2024.02.10  09:31", "EOS R8  ·  RF 24-70",
  "CANON EOS 600D", "NIKON COOLPIX", "METERING: SPOT", "DRIVE: SINGLE",
  "FOCUS: EYE AF", "COLOR SPACE sRGB", "RAW + JPEG", "SHUTTER COUNT 48,211",
  "LAT 9.9312 N  LON 76.2673 E", "ALT 2,113 M", "CONTACT SHEET 03",
  "SELECT  ✕  ✕  ○  ✕", "KEEP / REJECT", "DEV. 8 MIN @ 20°C",
];

type Block = {
  x: number;
  y: number;
  lines: string[];
  size: number;
  opacity: number;
  blur: number;
  depth: number;
};

const BLOCKS: Block[] = Array.from({ length: 26 }, (_, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  const count = 2 + Math.floor(random(`meta-count-${i}`) * 4);
  return {
    x: col * 330 + random(`meta-x-${i}`) * 220 - 40,
    y: row * 230 + random(`meta-y-${i}`) * 150 + 10,
    lines: Array.from(
      { length: count },
      (_, j) =>
        LINES[Math.floor(random(`meta-line-${i}-${j}`) * LINES.length)],
    ),
    size: 13 + Math.floor(random(`meta-size-${i}`) * 5),
    opacity: 0.07 + random(`meta-op-${i}`) * 0.12,
    blur: random(`meta-blur-${i}`) * 1.6,
    depth: 0.25 + random(`meta-depth-${i}`) * 0.3,
  };
});

export const PaperBackground: React.FC<{ frame: number }> = ({ frame }) => {
  const timing = useOpeningTiming();
  return (
    <AbsoluteFill style={{ backgroundColor: PAGE_COLOR }}>
      {/* Soft light falloff */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0) 60%), radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.06) 100%)",
        }}
      />

      {/* Paper fibers: static low-frequency noise */}
      <AbsoluteFill style={{ mixBlendMode: "multiply", opacity: 0.08 }}>
        <svg width="100%" height="100%">
          <filter id="juny-paper">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.012 0.04"
              numOctaves={4}
              seed={7}
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#juny-paper)" />
        </svg>
      </AbsoluteFill>

      {/* Ghost photos */}
      {GHOSTS.map((g, i) => {
        const d = driftFor(frame, 0.3, timing);
        const h = g.width * 1.25;
        return (
          <Img
            key={i}
            src={g.src}
            style={{
              position: "absolute",
              left: g.x - g.width / 2 + d.x,
              top: g.y - h / 2 + d.y,
              width: g.width,
              height: h,
              objectFit: "cover",
              opacity: 0.07,
              filter: "blur(5px) grayscale(1)",
            }}
          />
        );
      })}

      {/* Dotted guide lines */}
      <svg
        width="100%"
        height="100%"
        style={{ position: "absolute", opacity: 0.16 }}
      >
        <line x1="0" y1="452" x2="1920" y2="452" stroke={INK} strokeWidth="1" strokeDasharray="1 7" />
        <line x1="0" y1="1006" x2="1920" y2="1006" stroke={INK} strokeWidth="1" strokeDasharray="1 7" />
        <line x1="742" y1="0" x2="742" y2="1080" stroke={INK} strokeWidth="1" strokeDasharray="1 7" />
        <line x1="1388" y1="0" x2="1388" y2="1080" stroke={INK} strokeWidth="1" strokeDasharray="1 7" />
      </svg>

      {/* Metadata text */}
      {BLOCKS.map((b, i) => {
        const d = driftFor(frame, b.depth, timing);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: b.x + d.x,
              top: b.y + d.y,
              fontFamily: PLEX_MONO,
              fontSize: b.size,
              lineHeight: 1.45,
              letterSpacing: "0.04em",
              color: INK,
              opacity: b.opacity,
              filter: b.blur > 0.3 ? `blur(${b.blur}px)` : undefined,
              whiteSpace: "pre",
            }}
          >
            {b.lines.join("\n")}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
