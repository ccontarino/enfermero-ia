// Avatar ilustrado propio (SVG). `state`: idle | talking | listening | thinking.
const SKIN = { f: "#f1c7a6", m: "#e2b08b" };
const HAIR = { f: "#5b3524", m: "#2f2520" };

export default function Avatar({ gender = "f", state = "idle", size = 160 }) {
  const skin = SKIN[gender];
  const hair = HAIR[gender];
  return (
    <div className={`avatar avatar--${state}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="100" fill="var(--soft)" />
        {gender === "f" && (
          <path d="M50 96c0-40 22-64 50-64s50 24 50 64v54c0 8-10 12-16 6V100H66v56c-6 6-16 2-16-6Z" fill={hair} />
        )}
        {/* ambo */}
        <path d="M36 200c4-34 30-54 64-54s60 20 64 54Z" fill="var(--scrub)" />
        <path d="M84 148h32l-16 22Z" fill="var(--scrub-dark)" />
        <rect x="128" y="172" width="20" height="12" rx="2" fill="#fff" />
        <rect x="90" y="126" width="20" height="26" rx="8" fill={skin} />
        <ellipse cx="100" cy="98" rx="40" ry="44" fill={skin} />
        {gender === "f" ? (
          <path d="M60 88c4-28 22-42 40-42s38 12 42 40c-14-4-30-14-38-26-8 14-26 24-44 28Z" fill={hair} />
        ) : (
          <path d="M58 90c0-32 18-48 42-48s42 16 42 48c-6-10-14-16-22-18-8 6-30 8-44 4-8 2-14 8-18 14Z" fill={hair} />
        )}
        {/* cofia */}
        <path d="M66 60c8-15 60-15 68 0l-4 14H70Z" fill="#fff" stroke="var(--line)" strokeWidth="2" />
        <rect x="94" y="58" width="12" height="4" rx="1" fill="var(--green)" />
        <rect x="98" y="54" width="4" height="12" rx="1" fill="var(--green)" />
        <g className="avatar__eyes">
          <ellipse cx="84" cy="97" rx="4.5" ry="5.5" fill="var(--ink)" />
          <ellipse cx="116" cy="97" rx="4.5" ry="5.5" fill="var(--ink)" />
        </g>
        <ellipse cx="74" cy="113" rx="7" ry="4" fill="#f29c9c" opacity=".4" />
        <ellipse cx="126" cy="113" rx="7" ry="4" fill="#f29c9c" opacity=".4" />
        <path d="M90 124q10 8 20 0" stroke="#9c4a44" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse className="avatar__mouth" cx="100" cy="128" rx="7" ry="5" fill="#9c4a44" />
      </svg>
    </div>
  );
}
