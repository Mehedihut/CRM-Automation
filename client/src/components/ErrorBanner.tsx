interface Props {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props): JSX.Element | null {
  if (!message) return null;
  return (
    <div className="error-banner" role="alert">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className="error-banner-close" onClick={onDismiss}>
          ×
        </button>
      )}
    </div>
  );
}
