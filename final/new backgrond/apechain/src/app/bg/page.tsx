export default function BgPage() {
  return (
    <main className="min-h-screen w-full px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div
          className="w-full rounded-2xl border border-white/15"
          style={{
            minHeight: "520px",
            background:
              "radial-gradient(ellipse 38% 32% at 17% 17%, rgba(210, 240, 225, 0.72) 0%, rgba(180, 220, 200, 0.18) 45%, transparent 70%), linear-gradient(170deg, #1b3d37 0%, #1f4a3e 18%, #2a6655 38%, #3a7d62 55%, #6aab8a 72%, #a8d4b8 87%, #d4edd9 100%)",
          }}
        />
        <p className="mt-4 text-center text-xs tracking-[0.2em] text-white/60">
          Background preview
        </p>
      </div>
    </main>
  );
}
