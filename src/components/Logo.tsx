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
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Official SRC LEMONS Badge Logo */}
      <div className={`relative ${sizeMap[size]} flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden shadow-md border-2 border-lemon-400 bg-white`}>
        <img
          src={logoImg}
          alt="SRC LEMONS"
          className="w-full h-full object-cover rounded-full"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <h1 className="text-base sm:text-lg font-black text-charcoal-900 leading-tight tracking-tight">
            SRC LEMONS
          </h1>
          <p className="text-[10px] sm:text-xs text-fresh-700 font-bold tracking-wide">
            {subtitle || 'Billing & Accounts'}
          </p>
        </div>
      )}
    </div>
  );
};
