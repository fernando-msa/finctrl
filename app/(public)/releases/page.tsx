import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";

type ReleaseNote = {
  version: string;
  date?: string;
  highlights: string[];
};

async function getReleaseNotes(limit = 5): Promise<ReleaseNote[]> {
  const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
  const changelog = await readFile(changelogPath, "utf8");

  const sections = changelog.split(/^##\s+/gm).slice(1);

  return sections
    .map((section) => {
      const lines = section.split("\n");
      const header = (lines[0] ?? "").trim();
      const versionMatch = header.match(/^\[(.*?)\](?:\(.*?\))?\s*\((.*?)\)/);
      const fallbackMatch = header.match(/^\[(.*?)\]/);

      const version = versionMatch?.[1] ?? fallbackMatch?.[1] ?? "Sem versão";
      const date = versionMatch?.[2];

      const highlights = lines
        .map((line) => line.trim())
        .filter((line) => line.startsWith("* "))
        .slice(0, 4)
        .map((line) => line.replace(/^\*\s+/, ""));

      return { version, date, highlights };
    })
    .filter((note) => note.version !== "Sem versão")
    .slice(0, limit);
}

export default async function ReleasesPage() {
  const notes = await getReleaseNotes();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-brand-700">Novidades da versão</h1>
        <p className="text-sm text-slate-600">Resumo público das principais mudanças do FinCtrl por release.</p>
        <p className="text-xs text-slate-500">
          Fonte oficial no repositório: <span className="font-medium">CHANGELOG.md</span>
        </p>
      </header>

      <section className="space-y-4">
        {notes.map((note) => (
          <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={note.version}>
            <h2 className="text-lg font-semibold text-slate-900">v{note.version}</h2>
            {note.date ? <p className="text-xs text-slate-500">Publicado em {note.date}</p> : null}

            {note.highlights.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {note.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Sem highlights públicos cadastrados para esta versão.</p>
            )}
          </article>
        ))}
      </section>

      <footer>
        <Link className="text-sm font-medium text-brand-700 underline" href="/login">
          Entrar no FinCtrl
        </Link>
      </footer>
    </main>
  );
}
