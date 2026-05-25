
// ===================== app/partners/_components/EmptyState.tsx =================
"use client";
export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-12 text-center shadow-[0_4px_24px_-8px_rgba(0,0,0,0.15)]">
      <p className="text-sm text-neutral-600">No partners match your filters.</p>
      <button
        onClick={onClear}
        className="mt-4 rounded-full bg-black px-4 py-2 text-sm text-white shadow hover:shadow-md"
      >
        Reset filters
      </button>
    </div>
  );
}