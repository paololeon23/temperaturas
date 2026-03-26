import { ShieldAlert } from "lucide-react";
import { Pencil, Trash2 } from "lucide-react";

function riskColor(risk) {
  if (risk === "ALTO") return "border border-red-200 bg-red-50 text-red-600";
  if (risk === "MEDIO") return "border border-amber-200 bg-amber-50 text-amber-600";
  return "border border-emerald-200 bg-emerald-50 text-emerald-600";
}

function daysToArrival(dateText) {
  const end = new Date(dateText);
  if (Number.isNaN(end.getTime())) return "-";
  const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
  if (diff >= 0) return `${diff} por llegar`;
  return `${Math.abs(diff)} atraso`;
}

export default function TablaEmbarques({
  data,
  query,
  setQuery,
  clienteFilter,
  setClienteFilter,
  destinoFilter,
  setDestinoFilter,
  riskFilter,
  setRiskFilter,
  onEdit,
  onDelete,
  onRiskClick,
  onTripStatusChange,
}) {
  const clientes = [...new Set(data.map((item) => item.cliente))];
  const destinos = [...new Set(data.map((item) => item.destino))];

  const filtered = data.filter((item) => {
    const allText =
      `${item.id} ${item.operacion} ${item.cliente} ${item.variedad} ${item.destino} ${item.termografo} ${item.estado}`.toLowerCase();
    const matchQuery = allText.includes(query.toLowerCase());
    const matchCliente = clienteFilter ? item.cliente === clienteFilter : true;
    const matchDestino = destinoFilter ? item.destino === destinoFilter : true;
    const matchRisk = riskFilter ? (item.riesgo || "").toLowerCase() === riskFilter : true;
    return matchQuery && matchCliente && matchDestino && matchRisk;
  });

  return (
    <section className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
        <input
          placeholder="Buscar por codigo, cliente, destino..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#2f7cc0]"
        />
        <select
          value={clienteFilter}
          onChange={(event) => setClienteFilter(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#2f7cc0]"
        >
          <option value="">Todos los clientes</option>
          {clientes.map((cliente) => (
            <option key={cliente} value={cliente}>
              {cliente}
            </option>
          ))}
        </select>
        <select
          value={destinoFilter}
          onChange={(event) => setDestinoFilter(event.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#2f7cc0]"
        >
          <option value="">Todos los destinos</option>
          {destinos.map((destino) => (
            <option key={destino} value={destino}>
              {destino}
            </option>
          ))}
        </select>
        <div className="relative">
          <ShieldAlert
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <select
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-8 pr-2 text-sm text-slate-700 outline-none focus:border-[#2f7cc0]"
          >
            <option value="">Todos (riesgo)</option>
            <option value="alto">Alto</option>
            <option value="medio">Medio</option>
            <option value="bajo">Bajo</option>
          </select>
        </div>
      </div>

      <div className="max-h-[520px] overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-[1400px] text-left text-[13px] text-slate-700">
          <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] uppercase tracking-wide text-slate-600">
            <tr>
              <th className="px-3 py-2">Codigo</th>
              <th className="px-3 py-2">Cliente</th>
              <th className="px-3 py-2">Variedad</th>
              <th className="px-3 py-2">Destino</th>
              <th className="px-3 py-2">Transp.</th>
              <th className="px-3 py-2">Termografo</th>
              <th className="px-3 py-2">Salida</th>
              <th className="px-3 py-2">Llegada</th>
              <th className="px-3 py-2">Dias</th>
              <th className="px-3 py-2">Alertas IA</th>
              <th className="px-3 py-2">Riesgo</th>
              <th className="px-3 py-2">Viaje</th>
              <th className="px-3 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-blue-50/40">
                <td className="px-3 py-2 font-medium">{item.id}</td>
                <td className="px-3 py-2">{item.cliente}</td>
                <td className="px-3 py-2">{item.variedad || "-"}</td>
                <td className="px-3 py-2">{item.destino}</td>
                <td className="px-3 py-2">{item.transporte || "-"}</td>
                <td className="px-3 py-2">{item.termografo}</td>
                <td className="px-3 py-2 whitespace-nowrap">{item.fechaSalida || "-"}</td>
                <td className="px-3 py-2 whitespace-nowrap">{item.fechaLlegada || "-"}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {daysToArrival(item.fechaLlegada)}
                  </span>
                </td>
                <td className="px-3 py-2">{item.alertas}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => onRiskClick(item)}
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${riskColor(item.riesgo)}`}
                  >
                    {item.riesgo}
                  </button>
                </td>
                <td className="px-3 py-2">
                  <select
                    value={(item.estado || "").toLowerCase() === "entregado" ? "finalizado" : "en_ruta"}
                    onChange={(event) => onTripStatusChange(item.id, event.target.value)}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                  >
                    <option value="en_ruta">En ruta</option>
                    <option value="finalizado">Finalizado</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="rounded-md bg-[#2f7cc0] p-1.5 text-white transition hover:bg-[#22649d]"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      className="rounded-md bg-red-600 p-1.5 text-white transition hover:bg-red-500"
                      title="Eliminar"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-slate-400" colSpan={12}>
                  No hay registros para los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
