// components/Button.tsx
export default function Button({
    href,
    children
  }: {
    href: string;
    children: React.ReactNode;
  }) {
    return (
      <a
        href={href}
        className="btn"
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    );
  }
  