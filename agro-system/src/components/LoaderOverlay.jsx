export default function LoaderOverlay({ message = "Cargando plataforma..." }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/35 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200">
        <div className="mx-auto mb-3 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#2f7cc0]" />
        <p className="text-sm font-semibold text-[#1b4f8a]">{message}</p>
        <p className="mt-1 text-xs text-slate-500">Motor inteligente procesando informacion.</p>
      </div>
    </div>
  );
}
