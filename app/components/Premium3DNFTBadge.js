export default function Premium3DNFTBadge({ included = true }) {
  if (!included) return null;
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100 shadow-[0_0_30px_rgba(34,211,238,.08)]">
      <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,.95)]" />
      3D NFT included
    </div>
  );
}
