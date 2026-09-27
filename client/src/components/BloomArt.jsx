import React from "react";

/*
 * Botanical illustration for the sign in page. Every colour is a CSS custom
 * property so the piece follows the light and dark themes. Colours are set
 * through `style` because SVG presentation attributes cannot read var().
 */

const fill = (token, opacity) => ({ fill: `var(${token})`, fillOpacity: opacity });
const stroke = (token, width, opacity = 1) => ({
  stroke: `var(${token})`,
  strokeWidth: width,
  strokeOpacity: opacity,
  fill: "none",
  strokeLinecap: "round",
});

function Flower({ cx, cy, scale = 1, rotate = 0, petals = 8 }) {
  const step = 360 / petals;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      {Array.from({ length: petals }, (_, index) => (
        <ellipse
          key={`outer-${index}`}
          cx="0"
          cy="-52"
          rx="26"
          ry="52"
          transform={`rotate(${index * step})`}
          style={fill(index % 2 ? "--petal-b" : "--petal-a", index % 2 ? 0.9 : 0.95)}
        />
      ))}
      {Array.from({ length: petals }, (_, index) => (
        <ellipse
          key={`inner-${index}`}
          cx="0"
          cy="-30"
          rx="14"
          ry="30"
          transform={`rotate(${index * step + step / 2})`}
          style={fill("--petal-c", 0.95)}
        />
      ))}
      <circle r="20" style={fill("--bloom-soft", 1)} />
      <circle r="12" style={fill("--bloom", 1)} />
      {Array.from({ length: petals }, (_, index) => (
        <line
          key={`vein-${index}`}
          x1="0"
          y1="-24"
          x2="0"
          y2="-88"
          transform={`rotate(${index * step})`}
          style={stroke("--petal-c", 1.2, 0.45)}
        />
      ))}
    </g>
  );
}

function Bud({ cx, cy, rotate = 0, scale = 1 }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate}) scale(${scale})`}>
      <path d="M0 0 C -18 -20 -14 -48 0 -62 C 14 -48 18 -20 0 0 Z" style={fill("--petal-b", 0.95)} />
      <path d="M0 0 C -9 -16 -7 -36 0 -46 C 7 -36 9 -16 0 0 Z" style={fill("--petal-c", 1)} />
      <path d="M0 4 C -12 -2 -16 -12 -14 -20 C -6 -14 -2 -8 0 4 Z" style={fill("--leaf", 1)} />
      <path d="M0 4 C 12 -2 16 -12 14 -20 C 6 -14 2 -8 0 4 Z" style={fill("--leaf", 1)} />
    </g>
  );
}

function Leaf({ x, y, rotate, scale = 1, soft }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <path
        d="M0 0 C 22 -18 58 -20 84 0 C 58 20 22 18 0 0 Z"
        style={fill(soft ? "--leaf-soft" : "--leaf", 1)}
      />
      <path d="M4 0 L 78 0" style={stroke(soft ? "--leaf" : "--leaf-soft", 1.4, 0.8)} />
    </g>
  );
}

export default function BloomArt({ className }) {
  return (
    <svg viewBox="0 0 480 560" className={className} aria-hidden="true" focusable="false">
      {/* Large arcs that frame the arrangement. */}
      <circle cx="250" cy="210" r="170" style={stroke("--petal-c", 1.5, 0.6)} />
      <circle cx="250" cy="210" r="214" style={stroke("--petal-c", 1, 0.35)} />

      {/* Stems */}
      <path d="M250 250 C 244 340 262 430 236 560" style={stroke("--leaf", 5)} />
      <path d="M244 380 C 200 400 150 420 112 470" style={stroke("--leaf", 3.5)} />
      <path d="M252 330 C 300 350 350 360 382 402" style={stroke("--leaf", 3.5)} />

      <Leaf x={246} y={430} rotate={-150} scale={1.05} />
      <Leaf x={250} y={470} rotate={-30} scale={0.95} soft />
      <Leaf x={248} y={300} rotate={-165} scale={0.7} soft />
      <Leaf x={180} y={420} rotate={160} scale={0.6} />

      <Flower cx={250} cy={210} scale={1.35} rotate={8} />
      <Flower cx={112} cy={462} scale={0.62} rotate={-14} petals={6} />
      <Bud cx={382} cy={402} rotate={24} scale={1.1} />
      <Bud cx={338} cy={112} rotate={34} scale={0.7} />

      {/* Loose petals drifting off the main bloom. */}
      {[
        [400, 168, 40],
        [424, 222, 75],
        [84, 150, -30],
        [118, 96, -55],
      ].map(([x, y, angle]) => (
        <path
          key={`${x}-${y}`}
          d="M0 0 C -7 -8 -6 -18 0 -24 C 6 -18 7 -8 0 0 Z"
          transform={`translate(${x} ${y}) rotate(${angle})`}
          style={fill("--petal-b", 0.85)}
        />
      ))}
    </svg>
  );
}
