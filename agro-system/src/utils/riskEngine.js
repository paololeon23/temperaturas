export function evaluateRisk(shipment) {
  const destino = (shipment.destino || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const termografo = (shipment.termografo || "").toLowerCase();

  if (destino === "taiwan" || termografo === "emerson usb") {
    return "ALTO";
  }

  if (Number(shipment.alertas || 0) >= 2) {
    return "MEDIO";
  }

  return "BAJO";
}
