interface Props {
  status: string;
}

export function StatusBadge({ status }: Props): JSX.Element {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>;
}
