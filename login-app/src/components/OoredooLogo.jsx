export default function OoredooLogo({ size = 40, showText = false, textColor = "#fff", animated = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg, #ED1C24 0%, #B8141A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 8px 20px rgba(237,28,36,0.4)",
        animation: animated ? "ooredooPulse 2s ease-in-out infinite" : "none",
        flexShrink: 0,
      }}>
        <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 22 22" fill="none">
          <circle cx="6.5" cy="6.5" r="3" fill="#fff" />
          <circle cx="15.5" cy="6.5" r="3" fill="#fff" />
          <circle cx="6.5" cy="15.5" r="3" fill="#fff" />
          <circle cx="15.5" cy="15.5" r="3" fill="#fff" />
        </svg>
      </div>
      {showText && (
        <div>
          <div style={{ color: textColor, fontWeight: 800, fontSize: size * 0.4, letterSpacing: "-0.5px", lineHeight: 1 }}>
            Ooredoo
          </div>
          <div style={{ color: "#ED1C24", fontSize: size * 0.22, fontWeight: 700, letterSpacing: "0.15em", marginTop: 3 }}>
            PLANNING
          </div>
        </div>
      )}
    </div>
  );
}
