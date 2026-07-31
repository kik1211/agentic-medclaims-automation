import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { useLayoutContext } from '../contexts/LayoutContext';

export interface WireButtonProps {
  children?: React.ReactNode;
  id?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
}

export const WireButton: React.FC<WireButtonProps> = ({
  children,
  id,
  className = '',
  variant = 'primary',
  onClick,
}) => {
  const base =
    'border-2 border-gray-800 px-4 py-2 font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer';
  const variants = {
    primary: 'bg-gray-800 text-white hover:bg-gray-700',
    secondary: 'bg-white text-gray-800 hover:bg-gray-100',
    outline: 'bg-transparent text-gray-800 hover:bg-gray-100 border-dashed',
  };
  return (
    <button id={id} onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

export interface WireInputProps {
  placeholder?: string;
  type?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const WireInput: React.FC<WireInputProps> = ({
  placeholder,
  type = 'text',
  className = '',
  icon: Icon,
  defaultValue,
  value,
  onChange,
  disabled,
}) => (
  <div className={`relative ${className}`}>
    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />}
    <input
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`border-2 border-gray-800 bg-white px-3 py-2 w-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 ${Icon ? 'pl-9' : ''}`}
    />
  </div>
);

export interface WireCardProps {
  children?: React.ReactNode;
  className?: string;
  title?: string;
}

export const WireCard: React.FC<WireCardProps> = ({ children, className = '', title }) => (
  <div className={`border-2 border-gray-800 bg-white p-4 flex flex-col ${className}`}>
    {title && <h3 className="font-bold text-lg border-b-2 border-gray-800 pb-2 mb-4">{title}</h3>}
    {children}
  </div>
);

export interface WireBadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'high';
  className?: string;
}

export const WireBadge: React.FC<WireBadgeProps> = ({
  children,
  variant = 'default',
  className = '',
}) => {
  const variants = {
    default: 'border-gray-800 text-gray-800',
    high: 'border-gray-800 bg-gray-200 text-gray-900 font-bold',
  };
  return (
    <span
      className={`border-2 px-2 py-1 text-xs font-bold uppercase tracking-wider ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export interface WireSidebarProps {
  activeId: string;
}

export const WireSidebar: React.FC<WireSidebarProps> = ({ activeId }) => {
  const navigate = useNavigate();
  const { isAppLayout } = useLayoutContext();

  // If rendered inside a screen while wrapped in AppLayout, suppress redundant sidebar
  if (isAppLayout) {
    return null;
  }

  const items = [
    { id: 'nav-dashboard', label: 'Dashboard', path: ROUTES.DASHBOARD },
    { id: 'nav-pre-auth', label: 'Pre-Authorization', path: ROUTES.PRE_AUTH },
    { id: 'nav-discharge', label: 'Discharge Auth', path: ROUTES.DISCHARGE },
    { id: 'nav-final-claims', label: 'Final Claims', path: ROUTES.FINAL_CLAIMS },
    { id: 'nav-pipeline', label: 'Claims Pipeline', path: ROUTES.PIPELINE },
    { id: 'nav-denial', label: 'Denial Recovery', path: ROUTES.DENIAL },
    { id: 'nav-reports', label: 'Reports', path: ROUTES.REPORTS },
    { id: 'nav-settings', label: 'Settings', path: ROUTES.SETTINGS },
  ];

  return (
    <div className="w-64 border-r-2 border-gray-800 bg-gray-50 flex flex-col h-full shrink-0">
      <div
        className="p-4 border-b-2 border-gray-800 cursor-pointer flex items-center justify-between"
        onClick={() => navigate(ROUTES.OVERVIEW)}
      >
        <h1 className="font-black text-xl tracking-tighter uppercase">ClaimPilot</h1>
        <span className="text-[10px] bg-gray-200 border border-gray-800 px-1 py-0.5 font-mono">
          Map
        </span>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            id={item.id}
            onClick={() => navigate(item.path)}
            className={`px-4 py-2 border-2 text-sm font-bold cursor-pointer transition-colors ${activeId === item.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-transparent hover:border-gray-300 text-gray-600'}`}
          >
            {item.label}
          </div>
        ))}
      </nav>
    </div>
  );
};

export const WireHeader: React.FC = () => {
  const navigate = useNavigate();
  const { isAppLayout } = useLayoutContext();

  // If rendered inside a screen while wrapped in AppLayout, suppress redundant header
  if (isAppLayout) {
    return null;
  }

  return (
    <header className="h-16 border-b-2 border-gray-800 bg-white flex items-center justify-between px-6 shrink-0">
      <div className="font-bold text-gray-800">Sri Ramakrishna Hospital, Coimbatore</div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 border-2 border-gray-800 px-3 py-1 bg-gray-100">
          <div className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"></div>
          <span className="text-xs font-bold uppercase">Agent Active</span>
        </div>
        <button
          id="btn-notifications"
          onClick={() => navigate(ROUTES.NOTIFICATIONS)}
          className="p-2 border-2 border-gray-800 hover:bg-gray-100 relative cursor-pointer"
        >
          <Bell className="w-5 h-5" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-800 border-2 border-white rounded-full"></div>
        </button>
        <div className="w-10 h-10 border-2 border-gray-800 bg-gray-200 flex items-center justify-center rounded-full">
          <User className="w-5 h-5 text-gray-600" />
        </div>
      </div>
    </header>
  );
};

export interface ScreenContainerProps {
  id?: string;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  id,
  title,
  children,
  className = '',
}) => {
  const { isAppLayout } = useLayoutContext();

  if (isAppLayout) {
    return (
      <div
        id={id}
        className={`flex-1 flex flex-col w-full h-full bg-white relative overflow-auto ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      id={id}
      className={`w-[1024px] h-[768px] border-4 border-gray-800 bg-white flex flex-col shadow-2xl relative overflow-hidden ${className}`}
    >
      <div className="absolute top-0 left-0 bg-gray-800 text-white px-3 py-1 text-xs font-mono font-bold z-50">
        {title}
      </div>
      {children}
    </div>
  );
};
