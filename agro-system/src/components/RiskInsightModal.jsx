function riskBadgeStyle(risk) {
  if (risk === "ALTO") return "bg-red-100 text-red-700";
  if (risk === "MEDIO") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

export default function RiskInsightModal({ detail, onClose }) {
  if (!detail) return null;
  const nowLabel = new Date().toLocaleString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-[78] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1b4f8a]">Analisis predictivo del embarque</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Codigo</p>
            <p className="font-semibold text-slate-700">{detail.id}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Riesgo actual</p>
            <p className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${riskBadgeStyle(detail.riesgo)}`}>
              {detail.riesgo}
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Destino</p>
            <p className="font-semibold text-slate-700">{detail.destino}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase text-slate-500">Variedad</p>
            <p className="font-semibold text-slate-700">{detail.variedad || "-"}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <p className="text-xs uppercase text-emerald-700">Prediccion IA</p>
          <p className="mt-1 text-sm font-semibold text-emerald-900">
            Alertas estimadas: {detail.predictedAlerts} | {detail.tempSpikeDay3 ? "Posible alza termica dia 3" : "Sin pico termico dia 3"}
          </p>
          <p className="mt-1 text-sm text-emerald-800">{detail.aiInsight}</p>
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 p-3">
          <p className="text-xs uppercase text-slate-500">Recomendaciones operativas</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Verificar set point y termografo antes de zarpe en la ventana actual.</li>
            <li>Monitoreo reforzado entre dia 2 y dia 4 del viaje proyectado.</li>
            <li>Escalar a calidad si la tendencia supera el umbral del corte vigente.</li>
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Corte dinamico: {nowLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
