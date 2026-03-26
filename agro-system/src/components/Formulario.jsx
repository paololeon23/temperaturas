import { useEffect, useState } from "react";

const initialForm = {
  id: "",
  operacion: "BB-25",
  cliente: "The Fruitist",
  variedad: "Arandano Ventura",
  transporte: "Barco",
  destino: "USA",
  termografo: "Escavox",
  fechaSalida: "",
  fechaLlegada: "",
  estado: "En transito",
};

const opciones = {
  operacion: ["BB-25", "BB-26", "BB-27"],
  cliente: ["The Fruitist", "Hortifrut", "Driscoll's"],
  variedad: ["Arandano Ventura", "Arandano Sekoya"],
  destino: ["USA", "Taiwan", "China", "Corea", "Holanda"],
  transporte: ["Barco", "Avion"],
  termografo: ["Escavox", "Emerson USB", "Frigga", "LogTag"],
  estado: ["En transito", "Retrasado", "Entregado"],
};

function generateCode() {
  return `BB25-${Math.floor(Math.random() * 900 + 100)}`;
}

export default function Formulario({ onSave, editingItem, onCancelEdit }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (editingItem) {
      setForm(editingItem);
    } else {
      setForm({ ...initialForm, id: generateCode() });
    }
  }, [editingItem]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
    if (!editingItem) {
      setForm({ ...initialForm, id: generateCode() });
    }
  };

  const renderInput = (name, label, type = "text", extraClass = "") => (
    <label className={`text-sm text-slate-600 ${extraClass}`}>
      {label}
      <input
        required
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2f7cc0]"
      />
    </label>
  );

  const renderSelect = (name, label, values, extraClass = "") => (
    <label className={`text-sm text-slate-600 ${extraClass}`}>
      {label}
      <select
        required
        name={name}
        value={form[name]}
        onChange={handleChange}
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#2f7cc0]"
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <section className="rounded-2xl bg-white p-2">
      <h2 className="mb-4 text-lg font-semibold text-[#1b4f8a]">
        {editingItem ? "Editar embarque" : "Registrar nuevo embarque"}
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {renderInput("id", "Codigo", "text", "lg:col-span-4")}
        {renderSelect("operacion", "Operacion", opciones.operacion, "lg:col-span-4")}
        {renderSelect("cliente", "Cliente", opciones.cliente, "lg:col-span-4")}

        {renderSelect("variedad", "Variedad", opciones.variedad, "lg:col-span-4")}
        {renderSelect("destino", "Destino", opciones.destino, "lg:col-span-4")}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 lg:col-span-4">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {renderSelect("transporte", "Transporte", opciones.transporte)}
            {renderSelect("estado", "Estado", opciones.estado)}
          </div>
        </div>

        {renderSelect("termografo", "Termografo", opciones.termografo, "lg:col-span-4")}
        {renderInput("fechaSalida", "Fecha salida", "date", "lg:col-span-4")}
        {renderInput("fechaLlegada", "Fecha llegada", "date", "lg:col-span-4")}

        <div className="flex flex-wrap gap-2 pt-2 lg:col-span-12">
          <button
            type="submit"
            className="rounded-lg bg-[#2f7cc0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#22649d]"
          >
            {editingItem ? "Actualizar" : "Guardar"}
          </button>

          {editingItem && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
            >
              Cancelar edicion
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
