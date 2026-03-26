import { useMemo, useState } from "react";
import { AlertTriangle, Boxes, Percent, Plane, Ship } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import Swal from "sweetalert2";

function groupByCount(data, key) {
  return data.reduce((acc, item) => {
    const value = item[key];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function maxValue(entries) {
  if (entries.length === 0) return 1;
  return Math.max(...entries.map(([, value]) => value), 1);
}

function inPeriod(dateText, period) {
  if (!dateText || period === "todo") return true;
  const now = new Date();
  const current = new Date(dateText);
  if (Number.isNaN(current.getTime())) return false;

  if (period === "semanal") {
    const past = new Date(now);
    past.setDate(now.getDate() - 7);
    return current >= past && current <= now;
  }
  if (period === "calendario") {
    return current.getFullYear() === now.getFullYear() && current.getMonth() === now.getMonth();
  }
  if (period === "anual") {
    return current.getFullYear() === now.getFullYear();
  }
  return true;
}

export default function Dashboard({ data }) {
  const [transportFilter, setTransportFilter] = useState("todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const totalShipments = data.length;
  const highRiskShipments = data.filter((item) => item.riesgo === "ALTO").length;

  const usageByThermograph = groupByCount(data, "termografo");
  const thermographEntries = Object.entries(usageByThermograph);
  const maxUsage = maxValue(thermographEntries);

  const compareData = useMemo(() => {
    return data.filter((item) => {
      const byTransport =
        transportFilter === "todos"
          ? true
          : (item.transporte || "").toLowerCase() === transportFilter;
      const startDate = new Date(item.fechaSalida);
      const hasDate = !Number.isNaN(startDate.getTime());
      const byDateFrom = dateFrom ? (hasDate ? startDate >= new Date(dateFrom) : false) : true;
      const byDateTo = dateTo ? (hasDate ? startDate <= new Date(dateTo) : false) : true;

      return byTransport && byDateFrom && byDateTo;
    });
  }, [data, transportFilter, dateFrom, dateTo]);

  const countrySummary = useMemo(() => {
    const summary = {};
    for (const item of compareData) {
      const country = item.destino || "Sin destino";
      const transport = (item.transporte || "barco").toLowerCase();
      if (!summary[country]) {
        summary[country] = { barco: 0, avion: 0, total: 0 };
      }
      if (transport === "avion") {
        summary[country].avion += 1;
      } else {
        summary[country].barco += 1;
      }
      summary[country].total += 1;
    }
    return Object.entries(summary).sort((a, b) => b[1].total - a[1].total);
  }, [compareData]);

  const maxTrips = maxValue(countrySummary.map(([country, values]) => [country, values.total]));
  const byShip = compareData.filter((item) => (item.transporte || "").toLowerCase() === "barco").length;
  const byPlane = compareData.filter((item) => (item.transporte || "").toLowerCase() === "avion").length;

  const openDetail = (title, detail, bullets = [], Icon = Boxes) => {
    const list = bullets.map((item) => `<li style="margin-bottom:4px">${item}</li>`).join("");
    const iconSvg = renderToStaticMarkup(<Icon size={16} color="#15803d" strokeWidth={2.4} />);
    const nowLabel = new Date().toLocaleString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    Swal.fire({
      html:
        `<div style="text-align:left;font-size:14px;line-height:1.45">` +
        `<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">` +
        `<span style="display:inline-flex;width:30px;height:30px;border-radius:10px;background:#f1f5f9;border:1px solid #dbe4ee;align-items:center;justify-content:center">${iconSvg}</span>` +
        `<h3 style="margin:0;font-size:20px;color:#1e3a8a">${title}</h3>` +
        `</div>` +
        `<p style="margin:0 0 8px 0"><b>Lectura rapida:</b> ${detail}</p>` +
        `<p style="margin:0"><b>Referencia para decision:</b></p>` +
        `<ul style="padding-left:18px;margin-top:8px">${list}</ul>` +
        `<p style="margin-top:10px;font-size:12px;color:#64748b"><b>Corte dinamico:</b> ${nowLabel}</p>` +
        `</div>`,
      showCloseButton: true,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#2f7cc0",
      width: 520,
      padding: "1.1rem",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "!text-sm !px-4 !py-2 !rounded-lg !font-semibold",
      },
    });
  };

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article
          onClick={() =>
            openDetail(
              "Total de embarques",
              `Cantidad de registros en el periodo de analisis actual: <b>${totalShipments}</b>.`,
              [
                `Barco: <b>${byShip}</b>`,
                `Avion: <b>${byPlane}</b>`,
                `Paises activos en comparativa: <b>${countrySummary.length}</b>`,
              ],
              Boxes,
            )
          }
          className="cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
        >
          <div className="mb-2 text-lg text-[#1b4f8a]">
            <Boxes size={18} />
          </div>
          <p className="text-sm text-slate-500">Total de embarques</p>
          <h3 className="mt-1 text-3xl font-bold text-[#1b4f8a]">{totalShipments}</h3>
        </article>

        <article
          onClick={() =>
            openDetail(
              "Embarques con riesgo alto",
              `Registros clasificados como ALTO por IA: <b>${highRiskShipments}</b>.`,
              [
                `Participacion sobre total: <b>${totalShipments ? ((highRiskShipments / totalShipments) * 100).toFixed(1) : "0.0"}%</b>`,
                `Usar modal de riesgo para revisar causas por viaje.`,
              ],
              AlertTriangle,
            )
          }
          className="cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
        >
          <div className="mb-2 text-lg text-rose-600">
            <AlertTriangle size={18} />
          </div>
          <p className="text-sm text-slate-500">Embarques con riesgo alto</p>
          <h3 className="mt-1 text-3xl font-bold text-rose-600">{highRiskShipments}</h3>
        </article>

        <article
          onClick={() =>
            openDetail(
              "% de riesgo alto",
              `Porcentaje de embarques en riesgo ALTO sobre el total analizado.<br/>` +
                `Valor actual: <b>${totalShipments ? ((highRiskShipments / totalShipments) * 100).toFixed(1) : "0.0"}%</b>.`,
              [
                `Total evaluado: <b>${totalShipments}</b>`,
                `Embarques ALTO: <b>${highRiskShipments}</b>`,
              ],
              Percent,
            )
          }
          className="cursor-pointer rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
        >
          <div className="mb-2 text-lg text-[#2f7cc0]">
            <Percent size={18} />
          </div>
          <p className="text-sm text-slate-500">% de riesgo alto</p>
          <h3 className="mt-1 text-3xl font-bold text-[#2f7cc0]">
            {totalShipments ? ((highRiskShipments / totalShipments) * 100).toFixed(1) : "0.0"}%
          </h3>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-base font-semibold text-[#1b4f8a]">Comparativa: viajes por pais y transporte</h4>
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-md border border-slate-300 p-1">
                <button
                  type="button"
                  onClick={() => setTransportFilter("todos")}
                  className={`rounded px-2 py-1 text-xs ${transportFilter === "todos" ? "bg-slate-100" : ""}`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setTransportFilter("barco")}
                  className={`rounded px-2 py-1 text-xs ${transportFilter === "barco" ? "bg-slate-100" : ""}`}
                >
                  <span className="inline-flex items-center gap-1"><Ship size={12} />Barco</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransportFilter("avion")}
                  className={`rounded px-2 py-1 text-xs ${transportFilter === "avion" ? "bg-slate-100" : ""}`}
                >
                  <span className="inline-flex items-center gap-1"><Plane size={12} />Avion</span>
                </button>
              </div>
            </div>
          </div>
          <div className="mb-3 grid grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 md:grid-cols-2">
            <label className="text-xs text-slate-600">
              Desde
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
              />
            </label>
            <label className="text-xs text-slate-600">
              Hasta
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-700"
              />
            </label>
          </div>
          <div className="space-y-3">
            {countrySummary.length === 0 && (
              <p className="text-sm text-slate-500">Sin datos para el periodo seleccionado.</p>
            )}
            {countrySummary.map(([destination, values]) => (
              <div key={destination}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{destination}</span>
                  <span className="text-slate-500">
                    <span className="mr-2 inline-flex items-center gap-1">
                      <Ship size={12} /> {values.barco}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Plane size={12} /> {values.avion}
                    </span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-[#2f7cc0]"
                    style={{ width: `${Math.max((values.total / maxTrips) * 100, 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1"><Ship size={13} />Barco: {byShip}</span>
            <span className="inline-flex items-center gap-1"><Plane size={13} />Avion: {byPlane}</span>
          </div>
        </article>

        <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <h4 className="mb-3 text-base font-semibold text-[#1b4f8a]">
            Comparativa: rendimiento por termografo
          </h4>
          <div className="space-y-3">
            {thermographEntries.length === 0 && (
              <p className="text-sm text-slate-500">Sin datos para el periodo seleccionado.</p>
            )}
            {thermographEntries.map(([thermograph, count]) => (
              <div key={thermograph}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{thermograph}</span>
                  <span className="text-slate-500">{count} usos</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${Math.max((count / maxUsage) * 100, 10)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
