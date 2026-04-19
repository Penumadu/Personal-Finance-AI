import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, subtitle }) => {
  return (
    <div className={`glass rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}>
      {(title || subtitle) && (
        <div className="px-6 py-5 border-b border-gray-100/50 bg-white/40 rounded-t-2xl">
          {title && <h3 className="text-lg font-heading font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;