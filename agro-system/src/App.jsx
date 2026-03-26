import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BarChart3,
  Bot,
  Boxes,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardPen,
  LogOut,
  Menu,
  MessageCircle,
  SlidersHorizontal,
  ShieldAlert,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import Swal from "sweetalert2";
import Dashboard from "./components/Dashboard";
import EditShipmentModal from "./components/EditShipmentModal";
import Formulario from "./components/Formulario";
import LoaderOverlay from "./components/LoaderOverlay";
import LoginModal from "./components/LoginModal";
import PdfReportAnalyzer from "./components/PdfReportAnalyzer";
import RiskInsightModal from "./components/RiskInsightModal";
import RiskNotification from "./components/RiskNotification";
import TablaEmbarques from "./components/TablaEmbarques";
import { initialData } from "./data/initialData";
import { analyzeShipment } from "./utils/predictiveEngine";
import { evaluateRisk } from "./utils/riskEngine";

const STORAGE_KEY = "agrovision_shipments_general_db";
const SESSION_KEY = "agrovision_demo_session";

function hydrateData(data) {
  return data.map((item) => {
    const withDefaults = {
      variedad: item.variedad || "Arandano Ventura",
      transporte: item.transporte || "Barco",
      alertas: Number(item.alertas || 0),
      ...item,
    };
    return { ...withDefaults, riesgo: evaluateRisk(withDefaults) };
  });
}

function inCurrentPeriod(dateText, period) {
  if (!dateText || period === "todo") return true;

  const today = new Date();
  const current = new Date(dateText);
  if (Number.isNaN(current.getTime())) return false;

  if (period === "semanal") {
    const past = new Date(today);
    past.setDate(today.getDate() - 7);
    return current >= past && current <= today;
  }

  if (period === "mensual") {
    return (
      current.getFullYear() === today.getFullYear() && current.getMonth() === today.getMonth()
    );
  }

  if (period === "anual") {
    return current.getFullYear() === today.getFullYear();
  }

  return true;
}

function daysToArrival(dateText) {
  const end = new Date(dateText);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
}

export default function App() {
  const [shipments, setShipments] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [query, setQuery] = useState("");
  const [clienteFilter, setClienteFilter] = useState("");
  const [destinoFilter, setDestinoFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("todo");
  const [riskNotification, setRiskNotification] = useState("");
  const [showStartPrompt, setShowStartPrompt] = useState(true);
  const [analysisPulse, setAnalysisPulse] = useState("IA analizando estabilidad termica y patrones de riesgo.");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [bootLoading, setBootLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [sessionUser, setSessionUser] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [riskDetail, setRiskDetail] = useState(null);
  const [showPendingPanel, setShowPendingPanel] = useState(false);
  const [showAlertFilters, setShowAlertFilters] = useState(false);
  const [alertCountryFilter, setAlertCountryFilter] = useState("");
  const [alertClientFilter, setAlertClientFilter] = useState("");
  const [alertMaxFilter, setAlertMaxFilter] = useState("todas");

  useEffect(() => {
    const bootTimer = window.setTimeout(() => setBootLoading(false), 1200);
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
      setSessionUser(JSON.parse(savedSession));
    }

    if (saved) {
      const parsed = JSON.parse(saved);
      setShipments(hydrateData(parsed));
      return () => window.clearTimeout(bootTimer);
    }

    const seeded = hydrateData(initialData);
    setShipments(seeded);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return () => window.clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    if (shipments.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(shipments));
    }
  }, [shipments]);

  useEffect(() => {
    const messages = [
      "IA analizando estabilidad termica y patrones de riesgo.",
      "IA evaluando uso de termografos por destino en tiempo real.",
      "IA detectando alertas tempranas en la BD General.",
    ];
    const interval = window.setInterval(() => {
      setAnalysisPulse((current) => {
        const currentIndex = messages.indexOf(current);
        const next = currentIndex === -1 ? 0 : (currentIndex + 1) % messages.length;
        return messages[next];
      });
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  const highRiskCount = useMemo(
    () => shipments.filter((item) => item.riesgo === "ALTO").length,
    [shipments],
  );

  const periodData = useMemo(
    () => shipments.filter((item) => inCurrentPeriod(item.fechaSalida, periodFilter)),
    [shipments, periodFilter],
  );

  const pendingShipments = useMemo(() => {
    return shipments.filter((item) => {
      const estado = (item.estado || "").toLowerCase();
      return estado !== "entregado";
    });
  }, [shipments]);

  const analyticsSnapshot = useMemo(() => {
    const byDestino = {};
    const byCliente = {};
    const byMonth = {};
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(now.getDate() + 7);
    const past56Days = new Date();
    past56Days.setDate(now.getDate() - 56);
    const upcomingByDestino = {};
    let upcomingTotal = 0;
    let upcomingHighRisk = 0;
    let last56Count = 0;
    const last56ByDestino = {};
    let monthEarlyCount = 0;
    let monthLateCount = 0;
    const currentMonthLastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthLateStartDay = Math.max(1, currentMonthLastDay - 6);
    const daysElapsedInMonth = now.getDate();

    for (const item of shipments) {
      byDestino[item.destino] = (byDestino[item.destino] || 0) + 1;
      byCliente[item.cliente] = (byCliente[item.cliente] || 0) + 1;
      const outDate = new Date(item.fechaSalida);
      if (!Number.isNaN(outDate.getTime())) {
        const monthKey = `${outDate.getFullYear()}-${String(outDate.getMonth() + 1).padStart(2, "0")}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
        if (outDate >= now && outDate <= next7Days) {
          upcomingTotal += 1;
          upcomingByDestino[item.destino] = (upcomingByDestino[item.destino] || 0) + 1;
          if (item.riesgo === "ALTO") upcomingHighRisk += 1;
        }
        if (outDate >= past56Days && outDate <= now) {
          last56Count += 1;
          last56ByDestino[item.destino] = (last56ByDestino[item.destino] || 0) + 1;
        }
        if (outDate.getFullYear() === now.getFullYear() && outDate.getMonth() === now.getMonth()) {
          if (outDate.getDate() < monthLateStartDay) monthEarlyCount += 1;
          else monthLateCount += 1;
        }
      }
    }

    const topDestino = Object.entries(byDestino).sort((a, b) => b[1] - a[1])[0];
    const topCliente = Object.entries(byCliente).sort((a, b) => b[1] - a[1])[0];
    const topUpcomingDestino = Object.entries(upcomingByDestino).sort((a, b) => b[1] - a[1])[0];
    const topRecentDestino = Object.entries(last56ByDestino).sort((a, b) => b[1] - a[1])[0];
    const recentMonth = Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]))[0];
    const historicalWeeklyAvg = Math.max(1, Math.round(last56Count / 8));
    const finalWeeklyProjection = upcomingTotal > 0 ? upcomingTotal : historicalWeeklyAvg;
    const projectedTopDestino =
      upcomingTotal > 0
        ? topUpcomingDestino?.[0] || "Sin destino"
        : topRecentDestino?.[0] || "Sin destino";
    const projectedTopCount =
      upcomingTotal > 0
        ? topUpcomingDestino?.[1] || 0
        : Math.max(1, Math.round((topRecentDestino?.[1] || 0) / 8));
    const monthTrendText =
      monthLateCount < monthEarlyCount
        ? `En el cierre de mes (${monthLateStartDay}-${currentMonthLastDay}) baja el volumen de pedidos.`
        : `En el cierre de mes (${monthLateStartDay}-${currentMonthLastDay}) el volumen se mantiene o sube.`;
    const currentMonthTotal = monthEarlyCount + monthLateCount;
    const remainingDays = Math.max(currentMonthLastDay - daysElapsedInMonth, 0);
    const avgDailyCurrentMonth = currentMonthTotal > 0 ? currentMonthTotal / Math.max(daysElapsedInMonth, 1) : 0;
    const projectedMonthClose = Math.max(
      currentMonthTotal,
      Math.round(currentMonthTotal + avgDailyCurrentMonth * remainingDays),
    );
    const trendFactor = monthLateCount < monthEarlyCount ? 0.9 : 1.05;
    const projectedNextMonthWeek = Math.max(1, Math.round(historicalWeeklyAvg * trendFactor));
    const monthsEs = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];
    const nextMonthName = monthsEs[(now.getMonth() + 1) % 12];
    const currentMonthName = monthsEs[now.getMonth()];

    return {
      topDestino: topDestino ? `${topDestino[0]} (${topDestino[1]})` : "-",
      topDestinoName: topDestino ? topDestino[0] : "Sin destino",
      topDestinoCount: topDestino ? topDestino[1] : 0,
      topCliente: topCliente ? `${topCliente[0]} (${topCliente[1]})` : "-",
      next7ProjectedTotal: finalWeeklyProjection,
      next7ProjectedTopDestino: projectedTopDestino,
      next7ProjectedTopCount: projectedTopCount,
      next7ProjectedHighRisk: upcomingHighRisk,
      monthTrendText,
      projectedMonthClose,
      projectedNextMonthWeek,
      nextMonthName,
      currentMonthName,
      recentMonth: recentMonth ? `${recentMonth[0]}: ${recentMonth[1]} viajes` : "-",
    };
  }, [shipments]);

  const pendingCountries = useMemo(
    () => [...new Set(pendingShipments.map((item) => item.destino))],
    [pendingShipments],
  );

  const pendingClients = useMemo(
    () => [...new Set(pendingShipments.map((item) => item.cliente))],
    [pendingShipments],
  );

  const prioritizedPending = useMemo(() => {
    const filtered = pendingShipments.filter((item) => {
      const matchCountry = alertCountryFilter ? item.destino === alertCountryFilter : true;
      const matchClient = alertClientFilter ? item.cliente === alertClientFilter : true;
      const matchMax = alertMaxFilter === "maximas" ? Number(item.alertas || 0) >= 3 : true;
      return matchCountry && matchClient && matchMax;
    });

    return filtered.sort((a, b) => {
      const riskWeight = { ALTO: 3, MEDIO: 2, BAJO: 1 };
      const riskDiff = (riskWeight[b.riesgo] || 0) - (riskWeight[a.riesgo] || 0);
      if (riskDiff !== 0) return riskDiff;
      return Number(b.alertas || 0) - Number(a.alertas || 0);
    });
  }, [pendingShipments, alertCountryFilter, alertClientFilter, alertMaxFilter]);

  useEffect(() => {
    setAnalysisLoading(true);
    const timer = window.setTimeout(() => setAnalysisLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, [periodFilter]);

  const handleSave = (shipment) => {
    const historyWithoutCurrent = shipments.filter((item) => item.id !== shipment.id);
    const analysis = analyzeShipment(shipment, historyWithoutCurrent);
    const enriched = {
      ...shipment,
      transporte: shipment.transporte || "Barco",
      alertas: analysis.predictedAlerts,
      aiInsight: analysis.insight,
    };
    enriched.riesgo = evaluateRisk(enriched);

    setShipments((prev) => {
      const exists = prev.some((item) => item.id === enriched.id);
      if (exists) {
        return prev.map((item) => (item.id === enriched.id ? enriched : item));
      }
      return [enriched, ...prev];
    });

    setEditingItem(null);

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Registro guardado y analizado por IA",
      showConfirmButton: false,
      timer: 2600,
      timerProgressBar: true,
      background: "#16a34a",
      color: "#ffffff",
    });

    if (analysis.tempSpikeDay3 || enriched.riesgo === "ALTO") {
      setRiskNotification(
        `${enriched.id}: posible aumento de temperatura al dia 3 en ruta ${enriched.destino}.`,
      );
      window.setTimeout(() => setRiskNotification(""), 5000);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "info",
        title: analysis.insight,
        showConfirmButton: false,
        timer: 4200,
        timerProgressBar: true,
        background: "#15803d",
        color: "#ffffff",
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Eliminar embarque?",
      text: `Se eliminara el registro ${id}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    setShipments((prev) => prev.filter((item) => item.id !== id));
    if (editingItem?.id === id) {
      setEditingItem(null);
    }
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "Embarque eliminado",
      showConfirmButton: false,
      timer: 2200,
      background: "#16a34a",
      color: "#ffffff",
    });
  };

  const handleTripStatusChange = (id, value) => {
    setShipments((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (value === "finalizado") {
          return { ...item, estado: "Entregado" };
        }
        return {
          ...item,
          estado: item.estado === "Retrasado" ? "Retrasado" : "En transito",
        };
      }),
    );
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(
      `Agrovision IA: Total embarques ${shipments.length}, Riesgo alto ${highRiskCount}.`,
    );
    window.open(`https://wa.me/51913420257?text=${text}`, "_blank");
  };

  const handleOpenRiskDetail = (item) => {
    const historyWithoutCurrent = shipments.filter((row) => row.id !== item.id);
    const prediction = analyzeShipment(item, historyWithoutCurrent);
    setRiskDetail({
      ...item,
      predictedAlerts: prediction.predictedAlerts,
      tempSpikeDay3: prediction.tempSpikeDay3,
      aiInsight: item.aiInsight || prediction.insight,
    });
  };

  const handleLogin = (user) => {
    setSessionUser(user);
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setSessionUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const showKpiDetail = (title, summary, insights = [], Icon = BarChart3) => {
    const listItems = insights.map((item) => `<li style="margin-bottom:4px">${item}</li>`).join("");
    const iconSvg = renderToStaticMarkup(<Icon size={16} color="#1d4ed8" strokeWidth={2.4} />);
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
        `<h3 style="margin:0;font-size:22px;color:#1e3a8a">${title}</h3>` +
        `</div>` +
        `<p style="margin:0 0 8px 0"><b>Referencia para la proxima semana:</b> ${summary}</p>` +
        `<p style="margin:0 0 6px 0"><b>Guia para analista:</b></p>` +
        `<ul style="padding-left:18px;margin:6px 0 0 0">${listItems}</ul>` +
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
    <main className="min-h-screen bg-slate-100 text-slate-800">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menu"
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/35 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-[#2f7cc0] p-4 text-white shadow-2xl transition-transform duration-300 lg:transition-all ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${sidebarOpen ? "w-72" : "w-20"}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between">
            <div className={`${sidebarOpen ? "block" : "hidden"} max-w-[200px]`}>
              <h2 className="text-xl font-bold">Agrovision</h2>
              <p className="mt-1 text-sm text-blue-100">Control de embarques</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="rounded-lg bg-white/20 p-2 text-xs font-semibold hover:bg-white/30"
              >
                {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
              <button
                type="button"
                onClick={() => setMobileSidebarOpen(false)}
                className="rounded-lg bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30 lg:hidden"
              >
                X
              </button>
            </div>
          </div>

          <nav className="mt-8 space-y-2 text-sm">
            <p
              className={`flex items-center rounded-lg py-2 transition-colors font-semibold ${
                sidebarOpen
                  ? "w-full justify-start gap-2 bg-white/20 px-3"
                  : "w-full justify-center bg-white/20 px-0"
              } hover:bg-white/30`}
            >
              <BarChart3 size={16} />
              {sidebarOpen ? "Dashboard inteligente" : ""}
            </p>
            <p
              className={`flex items-center rounded-lg py-2 transition-colors ${
                sidebarOpen ? "w-full justify-start gap-2 px-3" : "w-full justify-center px-0"
              } hover:bg-white/20`}
            >
              <ClipboardPen size={16} />
              {sidebarOpen ? "Registro de contenedor" : ""}
            </p>
            <p
              className={`flex items-center rounded-lg py-2 transition-colors ${
                sidebarOpen ? "w-full justify-start gap-2 px-3" : "w-full justify-center px-0"
              } hover:bg-white/20`}
            >
              <Boxes size={16} />
              {sidebarOpen ? "BD General" : ""}
            </p>
            <p
              className={`flex items-center rounded-lg py-2 transition-colors ${
                sidebarOpen ? "w-full justify-start gap-2 px-3" : "w-full justify-center px-0"
              } hover:bg-white/20`}
            >
              <CalendarRange size={16} />
              {sidebarOpen ? "Reportes por periodo" : ""}
            </p>
            <p
              className={`flex items-center rounded-lg py-2 transition-colors ${
                sidebarOpen ? "w-full justify-start gap-2 px-3" : "w-full justify-center px-0"
              } hover:bg-white/20`}
            >
              <Bot size={16} />
              {sidebarOpen ? "IA Predictiva" : ""}
            </p>
          </nav>

          <div
            className={`mt-auto rounded-xl bg-white/15 p-3 text-xs text-blue-50 ${
              sidebarOpen ? "" : "flex items-center justify-center"
            }`}
          >
            {sidebarOpen ? (
              "Motor IA activo 24/7: detecta riesgos, rendimiento por destino y alertas tempranas."
            ) : (
              <Bot size={16} />
            )}
          </div>
        </div>
      </aside>

      <div className={`transition-all duration-300 ${sidebarOpen ? "lg:pl-72" : "lg:pl-20"}`}>
        <div className="p-4 md:p-6">
          <div className="mx-auto max-w-6xl space-y-5">
            <section className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">Centro de control</p>
                  <p className="text-sm font-semibold text-slate-700">
                    Supervisa embarques con analitica en tiempo real
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 lg:hidden"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Menu size={14} />
                      Menu
                    </span>
                  </button>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    IA online
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPendingPanel(true)}
                    className="relative rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Bell size={13} />
                      Alertas de llegada
                    </span>
                    {pendingShipments.length > 0 && (
                      <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                        {pendingShipments.length}
                      </span>
                    )}
                  </button>
                  {sessionUser && (
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                      <span className="inline-flex items-center gap-1">
                        <LogOut size={13} />
                        Cerrar sesion
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </section>

            <header className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h1 className="text-2xl font-bold text-[#1b4f8a] md:text-3xl">
                Sistema Inteligente de Embarques
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Plataforma empresarial para registrar, analizar y predecir riesgos logisticos.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  {analysisPulse}
                </div>
                <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Total: {shipments.length} | Riesgo alto: {highRiskCount}
                </div>
                <button
                  type="button"
                  onClick={openWhatsApp}
                  className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={13} />
                    Enviar resumen a WhatsApp
                  </span>
                </button>
                {sessionUser && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1b4f8a]">
                    <UserRound size={13} />
                    {sessionUser.username} - {sessionUser.role}
                  </div>
                )}
              </div>
            </header>

            <PdfReportAnalyzer />

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article
                onClick={() =>
                  showKpiDetail(
                    "Eficiencia",
                    `Indice operativo actual: <b>${shipments.length ? Math.max(100 - highRiskCount * 3, 72) : 0}%</b>.`,
                    [
                      `Top destino historico: <b>${analyticsSnapshot.topDestino}</b>`,
                      `Cliente con mayor movimiento: <b>${analyticsSnapshot.topCliente}</b>`,
                      `Ultimo mes registrado: <b>${analyticsSnapshot.recentMonth}</b>`,
                    ],
                    BarChart3,
                  )
                }
                className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
              >
                <div className="mb-2 text-lg text-[#2f7cc0]">
                  <BarChart3 size={18} />
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Eficiencia</p>
                <p className="mt-2 text-2xl font-bold text-[#1b4f8a]">
                  {shipments.length ? Math.max(100 - highRiskCount * 3, 72) : 0}%
                </p>
                <p className="text-xs text-slate-500">Indice operativo consolidado</p>
              </article>
              <article
                onClick={() =>
                  showKpiDetail(
                    "Prediccion semanal",
                    `Se estima completar <b>${analyticsSnapshot.projectedMonthClose}</b> viajes al cierre de ${analyticsSnapshot.currentMonthName}.`,
                    [
                      `${analyticsSnapshot.nextMonthName}: se estiman <b>${analyticsSnapshot.projectedNextMonthWeek} viajes</b> en la primera semana.`,
                      `Pais con mayor salida proyectada: <b>${analyticsSnapshot.next7ProjectedTopDestino}</b> (${analyticsSnapshot.next7ProjectedTopCount} viajes).`,
                      `Atento con alertas: en la primera semana de ${analyticsSnapshot.nextMonthName} el historial muestra variaciones de temperatura en esta ruta.`,
                    ],
                    Truck,
                  )
                }
                className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
              >
                <div className="mb-2 text-lg text-emerald-600">
                  <Truck size={18} />
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Prediccion semanal</p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">
                  {analyticsSnapshot.next7ProjectedTotal} embarques
                </p>
                <p className="text-xs text-slate-500">Estimado de flujo proxima semana</p>
              </article>
              <article
                onClick={() =>
                  showKpiDetail(
                    "Nivel de alerta",
                    `Riesgo alto detectado: <b>${highRiskCount}</b> embarques.`,
                    [
                      `Total de registros evaluados: <b>${shipments.length}</b>`,
                      `Destino con mayor frecuencia: <b>${analyticsSnapshot.topDestino}</b>`,
                      `Accion sugerida: seguimiento preventivo en rutas con historial alto.`,
                    ],
                    ShieldAlert,
                  )
                }
                className="cursor-pointer rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md"
              >
                <div className="mb-2 text-lg text-rose-600">
                  <ShieldAlert size={18} />
                </div>
                <p className="text-xs uppercase tracking-wide text-slate-400">Nivel de alerta</p>
                <p className="mt-2 text-2xl font-bold text-rose-600">
                  {highRiskCount > 5 ? "Elevado" : "Controlado"}
                </p>
                <p className="text-xs text-slate-500">Resultado del analisis IA actual</p>
              </article>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-[#1b4f8a]">Filtro de analisis temporal</h2>
                <select
                  value={periodFilter}
                  onChange={(event) => setPeriodFilter(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#2f7cc0]"
                >
                  <option value="todo">Todo el historial</option>
                  <option value="semanal">Semanal (7 dias)</option>
                  <option value="mensual">Mensual</option>
                  <option value="anual">Anual</option>
                </select>
              </div>
            </section>

            <Dashboard data={periodData} />

            <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-3 text-lg font-semibold text-[#1b4f8a]">
                Registro del contenedor recien salido
              </h2>
              <p className="mb-3 text-sm text-slate-500">
                No se registran alertas manuales. El sistema inteligente las calcula automaticamente
                con base en historial, destino y variedad.
              </p>
              <Formulario onSave={handleSave} editingItem={null} onCancelEdit={() => setEditingItem(null)} />
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-[#1b4f8a]">BD General</h2>
              <TablaEmbarques
                data={shipments}
                query={query}
                setQuery={setQuery}
                clienteFilter={clienteFilter}
                setClienteFilter={setClienteFilter}
                destinoFilter={destinoFilter}
                setDestinoFilter={setDestinoFilter}
                riskFilter={riskFilter}
                setRiskFilter={setRiskFilter}
                onEdit={setEditingItem}
                onDelete={handleDelete}
                onRiskClick={handleOpenRiskDetail}
                onTripStatusChange={handleTripStatusChange}
              />
            </section>
          </div>
        </div>
      </div>

      {showStartPrompt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-[#1b4f8a]">Registro prioritario</h3>
            <p className="mt-2 text-sm text-slate-600">
              Bienvenido. Registra primero el contenedor recien salido para mantener el monitoreo al
              dia.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowStartPrompt(false)}
                className="rounded-lg bg-[#2f7cc0] px-4 py-2 text-sm font-semibold text-white"
              >
                Entendido, registrar ahora
              </button>
              <button
                type="button"
                onClick={() => setShowStartPrompt(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPendingPanel && (
        <div className="fixed inset-0 z-[76] flex items-center justify-center bg-slate-900/45 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-amber-200 bg-white p-4 shadow-2xl">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-base font-semibold text-amber-800">
                Embarques en espera ({prioritizedPending.length})
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAlertFilters((prev) => !prev)}
                  className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
                  title="Mostrar filtros"
                >
                  <SlidersHorizontal size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPendingPanel(false)}
                  className="rounded-md p-1 text-amber-700 hover:bg-amber-50"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {showAlertFilters && (
              <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <select
                    value={alertCountryFilter}
                    onChange={(event) => setAlertCountryFilter(event.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700"
                  >
                    <option value="">Todos los paises</option>
                    {pendingCountries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  <select
                    value={alertClientFilter}
                    onChange={(event) => setAlertClientFilter(event.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700"
                  >
                    <option value="">Todos los clientes</option>
                    {pendingClients.map((client) => (
                      <option key={client} value={client}>
                        {client}
                      </option>
                    ))}
                  </select>
                  <select
                    value={alertMaxFilter}
                    onChange={(event) => setAlertMaxFilter(event.target.value)}
                    className="rounded-md border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700"
                  >
                    <option value="todas">Todas las alertas</option>
                    <option value="maximas">Solo alertas maximas (>=3)</option>
                  </select>
                </div>
              </div>
            )}

            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {prioritizedPending.length === 0 && (
                <p className="text-sm text-slate-500">No hay resultados para la prioridad seleccionada.</p>
              )}
              {prioritizedPending.map((item) => {
                const remaining = daysToArrival(item.fechaLlegada);
                return (
                  <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <p className="text-sm font-semibold text-slate-700">
                      {item.id} - {item.destino}
                    </p>
                    <p className="text-xs text-slate-500">
                      Estado: {item.estado} | Cliente: {item.cliente} | Alertas IA: {item.alertas}
                    </p>
                    <p className="text-xs font-semibold text-amber-700">
                      {remaining === null
                        ? "ETA no disponible"
                        : remaining >= 0
                          ? `Faltan ${remaining} dias para llegar`
                          : `Atraso de ${Math.abs(remaining)} dias`}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <RiskNotification message={riskNotification} onClose={() => setRiskNotification("")} />
      <EditShipmentModal item={editingItem} onClose={() => setEditingItem(null)} onSave={handleSave} />
      <RiskInsightModal detail={riskDetail} onClose={() => setRiskDetail(null)} />
      {bootLoading && <LoaderOverlay message="Inicializando sistema empresarial..." />}
      {analysisLoading && !bootLoading && <LoaderOverlay message="Aplicando filtros y actualizando reportes..." />}
      {!sessionUser && !bootLoading && <LoginModal onLogin={handleLogin} />}
    </main>
  );
}
