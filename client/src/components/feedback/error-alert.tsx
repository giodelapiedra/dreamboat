interface ErrorAlertProps {
  title?: string;
  message: string;
}

export function ErrorAlert({ title = "Something went wrong", message }: ErrorAlertProps): React.JSX.Element {
  return (
    <div className="alert alert-error" role="alert">
      <strong>{title}</strong>
      <p>{message}</p>
    </div>
  );
}
