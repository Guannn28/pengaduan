import { createElement, forwardRef, useEffect, useId, useRef } from "react";
import { AlertCircle, CheckCircle2, Loader2, Search, X } from "lucide-react";

export const Button = forwardRef(function Button({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}, ref) {
  return (
  <button
    ref={ref}
    className={`button button-${variant} ${className}`.trim()}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    {...props}
  >
    {loading && <Loader2 className="inline-spinner" size={17} aria-hidden="true" />}
    {children}
  </button>
  );
});

export const IconButton = ({ label, className = "", children, ...props }) => (
  <button
    className={`icon-button ${className}`.trim()}
    type="button"
    aria-label={label}
    title={label}
    {...props}
  >
    {children}
  </button>
);

export const Card = ({ as = "section", className = "", children, ...props }) =>
  createElement(as, { className: `card ${className}`.trim(), ...props }, children);

export const PageHeader = ({ eyebrow, title, description, actions }) => (
  <section className="page-header">
    <div>
      {eyebrow && <p className="page-header-eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="page-header-actions">{actions}</div>}
  </section>
);

export const InlineMessage = ({ type = "error", children }) => (
  <div className={`inline-message inline-message-${type}`} role={type === "error" ? "alert" : "status"}>
    {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
    <span>{children}</span>
  </div>
);

export const SearchField = ({ label = "Cari", className = "", ...props }) => {
  const id = useId();
  return (
    <label className={`search-field ${className}`.trim()} htmlFor={id}>
      <span className="sr-only">{label}</span>
      <Search size={17} aria-hidden="true" />
      <input id={id} type="search" {...props} />
    </label>
  );
};

export const LoadingSkeleton = ({ rows = 4 }) => (
  <div className="loading-skeleton" role="status" aria-label="Memuat data">
    {Array.from({ length: rows }, (_, index) => (
      <div className="loading-skeleton-row" key={index}>
        <span />
        <span />
        <span />
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    {icon && <div className="empty-state-icon" aria-hidden="true">{icon}</div>}
    <h3>{title}</h3>
    <p>{description}</p>
    {action && <div className="empty-state-action">{action}</div>}
  </div>
);

export const BottomNavigation = ({
  items,
  activeValue,
  onSelect,
  ariaLabel,
  className = "",
}) => (
  <nav
    className={`mobile-bottom-nav ${className}`.trim()}
    aria-label={ariaLabel}
  >
    {items.map((item) => {
      const Icon = item.icon;
      const isActive = activeValue === item.value;

      return (
        <button
          key={item.value}
          type="button"
          className={isActive ? "mobile-bottom-nav-item active" : "mobile-bottom-nav-item"}
          onClick={() => onSelect(item.value)}
          aria-current={isActive ? "page" : undefined}
        >
          <Icon size={19} strokeWidth={2.4} aria-hidden="true" />
          <span>{item.shortLabel || item.label}</span>
        </button>
      );
    })}
  </nav>
);

export const ConfirmationDialog = ({
  open,
  title,
  description,
  confirmLabel = "Konfirmasi",
  onConfirm,
  onClose,
  busy = false,
}) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [open, busy, onClose]);

  if (!open) return null;
  return (
    <div className="dialog-layer" role="presentation">
      <button className="dialog-backdrop" type="button" onClick={onClose} aria-label="Tutup dialog" />
      <section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
        <div className="dialog-icon"><AlertCircle size={22} /></div>
        <div>
          <h2 id="confirm-title">{title}</h2>
          <p id="confirm-description">{description}</p>
        </div>
        <div className="dialog-actions">
          <Button ref={cancelRef} variant="secondary" type="button" onClick={onClose} disabled={busy}>Batal</Button>
          <Button variant="destructive" type="button" onClick={onConfirm} loading={busy}>{confirmLabel}</Button>
        </div>
      </section>
    </div>
  );
};

export const SidePanel = ({ open, title, description, onClose, children, footer }) => {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    panelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onCloseRef.current?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="side-panel-layer">
      <button className="side-panel-backdrop" type="button" onClick={onClose} aria-label="Tutup panel" />
      <aside className="side-panel" role="dialog" aria-modal="true" aria-labelledby="side-panel-title" tabIndex="-1" ref={panelRef}>
        <header className="side-panel-header">
          <div>
            <h2 id="side-panel-title">{title}</h2>
            {description && <p>{description}</p>}
          </div>
          <IconButton label="Tutup panel" onClick={onClose}><X size={20} /></IconButton>
        </header>
        <div className="side-panel-body">{children}</div>
        {footer && <footer className="side-panel-footer">{footer}</footer>}
      </aside>
    </div>
  );
};
