const variantClasses = {
  primary: "bg-brand text-white border-brand hover:bg-blue-700",
  secondary: "bg-white text-ink-base border-surface-line hover:bg-surface-muted",
  quiet: "bg-transparent text-ink-base border-transparent hover:bg-surface-muted",
};

export function Button({
  children,
  type = "button",
  variant = "secondary",
  className = "",
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition duration-150 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
