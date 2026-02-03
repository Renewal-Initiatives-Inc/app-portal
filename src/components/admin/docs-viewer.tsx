'use client';

import * as Tabs from '@radix-ui/react-tabs';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface DocFile {
  id: string;
  title: string;
  content: string;
}

interface DocsViewerProps {
  docs: DocFile[];
}

export function DocsViewer({ docs }: DocsViewerProps) {
  return (
    <Tabs.Root defaultValue={docs[0]?.id} className="w-full">
      <Tabs.List
        className="flex border-b mb-6 gap-1"
        aria-label="Documentation sections"
      >
        {docs.map((doc) => (
          <Tabs.Trigger
            key={doc.id}
            value={doc.id}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              'border-b-2 border-transparent -mb-px',
              'text-muted-foreground hover:text-foreground',
              'data-[state=active]:border-primary data-[state=active]:text-foreground'
            )}
            data-testid={`docs-tab-${doc.id}`}
          >
            {doc.title}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {docs.map((doc) => (
        <Tabs.Content
          key={doc.id}
          value={doc.id}
          className="focus:outline-none"
          data-testid={`docs-content-${doc.id}`}
        >
          <article className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold mt-0 mb-4 text-foreground">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold mt-8 mb-3 text-foreground border-b pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold mt-6 mb-2 text-foreground">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-base font-semibold mt-4 mb-2 text-foreground">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="my-3 text-foreground leading-relaxed">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="my-3 ml-4 list-disc space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="my-3 ml-4 list-decimal space-y-1">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="text-foreground">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold">{children}</strong>
                ),
                code: ({ children }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                  </code>
                ),
                table: ({ children }) => (
                  <div className="my-4 overflow-x-auto">
                    <table className="min-w-full border-collapse border border-border text-sm">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-muted">{children}</thead>
                ),
                th: ({ children }) => (
                  <th className="border border-border px-3 py-2 text-left font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-border px-3 py-2">{children}</td>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-primary hover:underline"
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={
                      href?.startsWith('http')
                        ? 'noopener noreferrer'
                        : undefined
                    }
                  >
                    {children}
                  </a>
                ),
                hr: () => <hr className="my-6 border-border" />,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {doc.content}
            </ReactMarkdown>
          </article>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
