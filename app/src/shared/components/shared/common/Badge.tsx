// components/Badge.tsx
export default function Badge({ children }: { children: React.ReactNode }) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-var-highlight text-var-textSecondary text-xs tracking-wide">
        {children}
      </span>
    );
  }
  