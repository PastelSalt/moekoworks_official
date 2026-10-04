// Temporary production homepage while the site is built on the `dev` branch.
export default function ComingSoon() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
        background:
          "radial-gradient(circle at 0% 0%, var(--pink-200), transparent 32rem), radial-gradient(circle at 100% 100%, var(--blue-200), transparent 32rem), var(--canvas)",
      }}
    >
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/moesoft-splash.svg" alt="Moesoft — software and technologies" width={520} height={163} style={{ width: "min(520px, 86vw)", height: "auto" }} />
        <p style={{ letterSpacing: "0.22em", textTransform: "uppercase", fontWeight: 700, color: "var(--ink-soft)", fontSize: 14 }}>
          A portfolio by Kyle Zoleta · coming soon ✿
        </p>
      </div>
    </main>
  );
}
