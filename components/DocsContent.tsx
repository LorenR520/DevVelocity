"use client";

export default function DocsContent({ children }: { children: React.ReactNode }) {
  return (
    <article
      className="
        prose
        dark:prose-invert
        max-w-none
        prose-headings:font-semibold
        prose-headings:text-gray-900 dark:prose-headings:text-gray-100
        prose-p:text-gray-700 dark:prose-p:text-gray-300
        prose-li:text-gray-700 dark:prose-li:text-gray-300
        prose-a:text-blue-600 dark:prose-a:text-blue-400
        prose-a:no-underline hover:prose-a:underline
        prose-pre:bg-neutral-900
        prose-pre:text-gray-100
        prose-code:bg-neutral-800
        prose-code:text-gray-100
        prose-code:p-1
        prose-code:rounded
        prose-hr:border-gray-300 dark:prose-hr:border-neutral-700
      "
    >
      {children}
    </article>
  );
}
