interface Props {
  status: string;
}

export function StatusBadge({ status }: Props) {
  const cls = badgeClass(status);
  return <span className={`badge ${cls}`}>{prettify(status)}</span>;
}

function badgeClass(status: string): string {
  // For known statuses use a status-specific class; fall back to neutral.
  const known = [
    "NEW",
    "CONTACTED",
    "INTERESTED",
    "FOLLOW_UP",
    "CONVERTED",
    "LOST",
    "DONE",
    "CANCELLED",
    "APPROVED",
    "REJECTED",
  ];
  if (known.includes(status)) return `badge-${status}`;
  return "badge-neutral";
}

function prettify(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
