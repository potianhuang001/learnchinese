/**
 * Reusable Card component — white rounded surface with shadow.
 */
import React from 'react';

export default function Card({ className = '', children, ...props }) {
  return (
    <div className={`card p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}
