import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, required, hint, children }) => (
  <div style={{ marginBottom: 14 }}>
    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 5 }}>
      {label} {required && <span style={{ color: 'var(--danger-text)' }}>*</span>}
    </label>
    {children}
    {hint && <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 4 }}>{hint}</div>}
  </div>
);
