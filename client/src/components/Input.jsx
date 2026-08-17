/**
 * Reusable Input component with label, error and hint support.
 */
import React, { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, error, hint, required = false, className = '', id, ...props }, ref) => {
    const inputId = id || props.name || `input-${Math.random().toString(36).slice(2, 8)}`;
    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="label">
            {label}
            {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
          </label>
        )}
        <input id={inputId} ref={ref} className="input" aria-invalid={Boolean(error)} {...props} />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        {!error && hint && <p className="mt-1 text-sm text-ink-lighter">{hint}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
