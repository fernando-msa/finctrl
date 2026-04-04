import { redirect } from "next/navigation";
import { getSessionUid } from "@/lib/firebase/auth";
import { listFgtsEntries } from "@/server/repositories/fgts-repository";
import { FgtsEntry } from "@/types/finance";

const modalityLabel: Record<FgtsEntry["modality"], string> = {
  saque_aniversario: "Saque-aniversário",
  saque_rescisao: "Saque-rescisão",
  indefinido: "Não informado"
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default async function FgtsPage() {
  let uid: string;
  try {
    uid = await getSessionUid();
  } catch (error) {
    console.error("[fgts] sessão sem UID válido, fallback para legado:", error);
    redirect("/pages/fgts.html" as any);
  }

  let entries: FgtsEntry[] = [];
  try {
    entries = await listFgtsEntries(uid);
  } catch (error) {
    console.error("[fgts] falha ao buscar dados de FGTS no Firestore, fallback para legado:", error);
    redirect("/pages/fgts.html" as any);
  }

  const totalBalance = entries.reduce((acc, entry) => acc + entry.balance, 0);
  const birthdayModeCount = entries.filter((entry) => entry.modality === "saque_aniversario").length;

  return (
    <section className="space-y-4">
      <header className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">FGTS</h1>
        <p className="mt-1 text-sm text-slate-600">Acompanhe saldos e modalidades das contas vinculadas.</p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Kpi label="Saldo total" value={formatCurrency(totalBalance)} />
          <Kpi label="Contas vinculadas" value={String(entries.length)} />
          <Kpi label="Saque-aniversário" value={String(birthdayModeCount)} />
        </div>
      </header>

      <article className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Conta</th>
              <th className="px-4 py-3 font-medium">Modalidade</th>
              <th className="px-4 py-3 font-medium">Saldo</th>
              <th className="px-4 py-3 font-medium">Atualizado em</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-slate-500" colSpan={4}>
                  Nenhum registro de FGTS cadastrado ainda.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr className="border-t border-slate-100" key={entry.id}>
                  <td className="px-4 py-3">{entry.accountLabel}</td>
                  <td className="px-4 py-3">{modalityLabel[entry.modality]}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(entry.balance)}</td>
                  <td className="px-4 py-3">{entry.updatedAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </article>
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <strong className="text-lg text-brand-700">{value}</strong>
    </div>
  );
}
