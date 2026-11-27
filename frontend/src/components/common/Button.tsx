import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'outline' | 'danger';
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  style,
  children,
  ...rest
}) => (
  <button
    className={`btn btn-${variant} ${className}`}
    style={{
      ...(size === 'sm' ? { padding: '6px 12px', fontSize: '0.82rem' } : {}),
      ...style,
    }}
    {...rest}
  >
    {children}
  </button>
);
