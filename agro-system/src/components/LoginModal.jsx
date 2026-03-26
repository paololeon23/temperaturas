import { useState } from "react";

export default function LoginModal({ onLogin }) {
  const [username, setUsername] = useState("Christopher");
  const [role, setRole] = useState("Analista Logistico");

  const submit = (event) => {
    event.preventDefault();
    onLogin({
      username: username.trim() || "Usuario",
      role,
      loginAt: new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <h2 className="text-2xl font-bold text-[#1b4f8a]">Iniciar sesion</h2>
        <p className="mt-1 text-sm text-slate-500">Sistema empresarial de embarques Agrovision</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <label className="block text-sm text-slate-600">
            Usuario
            <input
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#2f7cc0]"
            />
          </label>
          <label className="block text-sm text-slate-600">
            Perfil
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-[#2f7cc0]"
            >
              <option>Analista Logistico</option>
              <option>Supervisor de Calidad</option>
              <option>Administrador</option>
            </select>
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-[#2f7cc0] px-4 py-2 text-sm font-semibold text-white hover:bg-[#22649d]"
          >
            Ingresar al sistema
          </button>
        </form>
      </div>
    </div>
  );
}
