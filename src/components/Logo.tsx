import React from 'react';
import logoImg from '../assets/logo.png';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
  subtitle,
}) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-20 h-20',
  };

  return (
    <div className={`flex items-center space-x-2 sm:space-x-3 ${className}`}>
      {/* Official SRC LEMONS Badge Logo */}
      <div className={`relative ${sizeMap[size]} flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden shadow-xs border border-lemon-400 bg-white`}>
        <img
          src={logoImg}
          alt="SRC LEMONS"
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <h1 className="text-sm sm:text-base font-black text-charcoal-900 leading-tight tracking-tight">
            SRC LEMONS
          </h1>
          <p className="text-[9px] sm:text-[11px] text-fresh-700 font-bold tracking-wide">
            {subtitle || 'Billing & Accounts'}
          </p>
        </div>
      )}
    </div>
  );
};
