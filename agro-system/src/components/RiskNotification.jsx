export default function RiskNotification({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[92%] max-w-sm rounded-2xl bg-emerald-600 p-4 text-white shadow-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold">Agrovision Alert Bot</p>
          <p className="mt-1 text-sm">{message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-emerald-700 px-2 py-1 text-xs hover:bg-emerald-800"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
