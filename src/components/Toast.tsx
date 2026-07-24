type ToastProps = {
  message: string;
};

export function Toast({ message }: ToastProps) {
  return <div id="toast" className={message ? "show" : ""}>{message}</div>;
}
