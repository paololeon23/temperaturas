import Formulario from "./Formulario";

export default function EditShipmentModal({ item, onClose, onSave }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#1b4f8a]">Editar embarque</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>
        <Formulario onSave={onSave} editingItem={item} onCancelEdit={onClose} />
      </div>
    </div>
  );
}
