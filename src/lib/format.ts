export function formatFCFA(amount: number) {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export function formatDateFr(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
