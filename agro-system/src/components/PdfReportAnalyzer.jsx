import { useMemo, useState } from "react";
import { FileUp, Sparkles } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

function parseSetPoint(text) {
  const match = text.match(/(?:Range|Set\s*Point)\s*[:\-]?\s*\[?\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C\s*(?:to|-|a)\s*(-?\d+(?:[.,]\d+)?)\s*°?\s*C/i);
  if (!match) return null;
  const min = Number(match[1].replace(",", "."));
  const max = Number(match[2].replace(",", "."));
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

function getTempValues(text) {
  const values = [...text.matchAll(/(-?\d+(?:[.,]\d+)?)\s*°\s*C/gi)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n));
  return values;
}

function getHumidityValues(text) {
  return [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n));
}

function extractField(text, pattern) {
  const match = text.match(pattern);
  return match?.[1]?.trim() || "No identificado";
}

function analyzeText(rawText) {
  const text = rawText || "";
  const setPoint = parseSetPoint(text);
  const tempValues = getTempValues(text);
  const humidityValues = getHumidityValues(text);
  const lightAlerts = (text.match(/Light Alert/gi) || []).length;

  const maxTemp = tempValues.length ? Math.max(...tempValues) : null;
  const minTemp = tempValues.length ? Math.min(...tempValues) : null;
  let excursions = 0;
  if (setPoint && tempValues.length) {
    excursions = tempValues.filter((v) => v < setPoint.min || v > setPoint.max).length;
  }

  const humidityDelta =
    humidityValues.length > 1 ? Math.max(...humidityValues) - Math.min(...humidityValues) : 0;
  const humidityState =
    humidityValues.length === 0
      ? "Sin datos de humedad"
      : humidityDelta <= 12
        ? "Estable"
        : "Fluctuante";

  const risk =
    excursions > 10 || (maxTemp !== null && setPoint && maxTemp > setPoint.max + 2) || lightAlerts >= 3
      ? "ALTO"
      : excursions > 0 || lightAlerts > 0
        ? "MEDIO"
        : "BAJO";

  return {
    resumen: {
      dispositivo: extractField(text, /Device\s*[:\-]?\s*([A-Z0-9-]+)/i),
      origen: extractField(text, /Origin\s*[:\-]?\s*([A-Z0-9\s./-]+)/i),
      destino: extractField(text, /Destination\s*[:\-]?\s*([A-Z0-9\s./-]+)/i),
      transportista: extractField(text, /Carrier\s*[:\-]?\s*([A-Z0-9\s./-]+)/i),
      producto: extractField(text, /(?:Product|Mercancia)\s*[:\-]?\s*([A-Z0-9\s./-]+)/i),
      setPoint: setPoint ? `${setPoint.min}°C a ${setPoint.max}°C` : "No identificado",
    },
    analisis: {
      maxTemp: maxTemp !== null ? `${maxTemp.toFixed(2)}°C` : "No identificado",
      minTemp: minTemp !== null ? `${minTemp.toFixed(2)}°C` : "No identificado",
      excursions,
      lightAlerts,
      humidityState,
      humidityDelta: `${humidityDelta.toFixed(1)}%`,
      risk,
    },
  };
}

export default function PdfReportAnalyzer() {
  const [files, setFiles] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = useMemo(() => files.find((f) => f.id === selectedId), [files, selectedId]);
  const analysis = useMemo(() => analyzeText(selected?.text || ""), [selected]);

  const extractPdfText = async (file) => {
    const buffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: buffer });
    const pdf = await loadingTask.promise;
    let text = "";
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");
      text += `\n${pageText}`;
    }
    return text;
  };

  const handleUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;
    setLoading(true);
    try {
      const processed = [];
      for (const file of selectedFiles) {
        let extractedText = "";
        try {
          extractedText = await extractPdfText(file);
        } catch {
          extractedText = "";
        }
        processed.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          company: "Agrovision",
          sizeKb: Math.round(file.size / 1024),
          uploadedAt: new Date().toLocaleString("es-PE"),
          text: extractedText,
          pages: extractedText ? (extractedText.match(/\n/g) || []).length : 0,
        });
      }
      setFiles((prev) => [...processed, ...prev]);
      setSelectedId((current) => current || processed[0].id);
      event.target.value = "";
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-[#1b4f8a]">Importar y Analizar Reportes PDF</h2>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <label className="text-sm text-slate-600">
          Importar PDFs
          <div className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2">
            <FileUp size={16} className="text-slate-500" />
            <input type="file" accept="application/pdf" multiple onChange={handleUpload} />
            {loading && <span className="text-xs text-slate-500">Analizando PDFs...</span>}
          </div>
        </label>
      </div>

      {files.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <label className="text-sm text-slate-600">
            Reporte cargado
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {files.map((file) => (
                <option key={file.id} value={file.id}>
                  {file.company} | {file.name} ({file.sizeKb} KB)
                </option>
              ))}
            </select>
          </label>
          <div className="rounded-md bg-slate-50 p-3 text-xs text-slate-600">
            {selected ? (
              <>
                <p>
                  <b>Empresa:</b> {selected.company}
                </p>
                <p>
                  <b>Archivo:</b> {selected.name}
                </p>
                <p>
                  <b>Cargado:</b> {selected.uploadedAt}
                </p>
                <p>
                  <b>Texto extraído:</b> {selected.text ? "Sí" : "No"}
                </p>
              </>
            ) : (
              "Selecciona un reporte."
            )}
          </div>
        </div>
      )}

      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
        <div className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">
          <Sparkles size={14} />
          Informe ejecutivo automático
        </div>
        {!selected && <p className="text-sm text-slate-600">Carga y selecciona un PDF para analizar.</p>}
        {selected && !selected.text && (
          <p className="text-sm text-amber-700">
            No se pudo extraer texto del PDF seleccionado. Prueba con otro archivo o una versión con texto legible.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-emerald-100">
                <td className="py-1 pr-2 font-semibold text-slate-700">Dispositivo</td>
                <td className="py-1">{analysis.resumen.dispositivo}</td>
                <td className="py-1 pr-2 font-semibold text-slate-700">Origen</td>
                <td className="py-1">{analysis.resumen.origen}</td>
              </tr>
              <tr className="border-b border-emerald-100">
                <td className="py-1 pr-2 font-semibold text-slate-700">Destino</td>
                <td className="py-1">{analysis.resumen.destino}</td>
                <td className="py-1 pr-2 font-semibold text-slate-700">Set Point</td>
                <td className="py-1">{analysis.resumen.setPoint}</td>
              </tr>
              <tr className="border-b border-emerald-100">
                <td className="py-1 pr-2 font-semibold text-slate-700">Max/Min Temp</td>
                <td className="py-1">
                  {analysis.analisis.maxTemp} / {analysis.analisis.minTemp}
                </td>
                <td className="py-1 pr-2 font-semibold text-slate-700">Excursiones</td>
                <td className="py-1">{analysis.analisis.excursions}</td>
              </tr>
              <tr>
                <td className="py-1 pr-2 font-semibold text-slate-700">Alertas de Luz</td>
                <td className="py-1">{analysis.analisis.lightAlerts}</td>
                <td className="py-1 pr-2 font-semibold text-slate-700">Riesgo estimado</td>
                <td className="py-1 font-semibold">{analysis.analisis.risk}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
