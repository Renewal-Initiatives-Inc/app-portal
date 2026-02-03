import { promises as fs } from 'fs';
import path from 'path';
import { DocsViewer } from '@/components/admin/docs-viewer';

interface DocFile {
  id: string;
  title: string;
  content: string;
}

async function getDocs(): Promise<DocFile[]> {
  const docsDir = path.join(process.cwd(), 'docs', 'admin');

  const docs: DocFile[] = [
    { id: 'user-guide', title: 'User Guide', content: '' },
    { id: 'troubleshooting', title: 'Troubleshooting', content: '' },
    { id: 'quick-reference', title: 'Quick Reference', content: '' },
  ];

  for (const doc of docs) {
    try {
      const filePath = path.join(docsDir, `${doc.id}.md`);
      doc.content = await fs.readFile(filePath, 'utf-8');
    } catch {
      doc.content = `# ${doc.title}\n\nDocumentation not found.`;
    }
  }

  return docs;
}

export default async function DocsPage() {
  const docs = await getDocs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Documentation</h1>
        <p className="text-muted-foreground mt-1">
          Admin guides and reference materials.
        </p>
      </div>

      <DocsViewer docs={docs} />
    </div>
  );
}
