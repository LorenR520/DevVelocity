// components/DocsContent.tsx

export default function DocsContent({ children }) {
  return (
    <article className="prose prose-green max-w-none">
      {children}
    </article>
  );
}
