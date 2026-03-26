function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function analyzeShipment(shipment, history) {
  const destino = normalizeText(shipment.destino);
  const variedad = normalizeText(shipment.variedad);

  const sameDestination = history.filter((item) => normalizeText(item.destino) === destino);
  const sameVariety = history.filter((item) => normalizeText(item.variedad) === variedad);
  const highRiskHistory = history.filter((item) => item.riesgo === "ALTO").length;
  const highRiskRate = history.length ? highRiskHistory / history.length : 0;

  let predictedAlerts = 0;
  predictedAlerts += sameDestination.length >= 2 ? 1 : 0;
  predictedAlerts += sameVariety.length >= 2 ? 1 : 0;
  predictedAlerts += destino === "taiwan" ? 2 : 0;
  predictedAlerts += destino === "china" ? 1 : 0;
  predictedAlerts += normalizeText(shipment.termografo) === "emerson usb" ? 1 : 0;
  predictedAlerts += highRiskRate > 0.35 ? 1 : 0;
  predictedAlerts = Math.min(predictedAlerts, 4);

  const tempSpikeDay3 = destino === "taiwan" || destino === "china" || highRiskRate > 0.4;

  let insight = "Operacion estable. Mantener monitoreo termico estandar.";
  if (tempSpikeDay3) {
    insight =
      "IA detecta riesgo de aumento de temperatura al tercer dia de viaje. Revisar cadena de frio.";
  } else if (predictedAlerts >= 2) {
    insight = "IA sugiere seguimiento preventivo por patron historico de variaciones.";
  }

  return {
    predictedAlerts,
    tempSpikeDay3,
    insight,
  };
}
