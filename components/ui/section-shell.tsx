export function SectionShell({ title, description }: { title: string; description: string }) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="text-slate-600">{description}</p>
    </section>
  );
}
