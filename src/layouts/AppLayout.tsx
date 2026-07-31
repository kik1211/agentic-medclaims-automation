import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { WireSidebar, WireHeader } from '../components/WireframeUI';
import { ROUTES } from '../constants/routes';
import { ChevronRight, Home } from 'lucide-react';
import { LayoutProvider } from '../contexts/LayoutContext';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveSidebarId = (pathname: string): string => {
    if (pathname.startsWith('/claims/pre-auth')) return 'nav-pre-auth';
    if (pathname.startsWith('/claims/discharge')) return 'nav-discharge';
    if (pathname.startsWith('/claims/final')) return 'nav-final-claims';
    if (pathname.startsWith('/pipeline')) return 'nav-pipeline';
    if (pathname.startsWith('/denial')) return 'nav-denial';
    if (pathname.startsWith('/reports')) return 'nav-reports';
    if (pathname.startsWith('/settings')) return 'nav-settings';
    return 'nav-dashboard';
  };

  const getBreadcrumbs = (pathname: string) => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.map((part, index) => {
      const url = `/${parts.slice(0, index + 1).join('/')}`;
      const label = part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ');
      return { url, label };
    });
  };

  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 font-sans">
      <WireSidebar activeId={getActiveSidebarId(location.pathname)} />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <WireHeader />

        {/* Dynamic Breadcrumbs Bar */}
        <div className="bg-white border-b border-gray-300 px-6 py-2 flex items-center gap-2 text-xs font-bold text-gray-600 shrink-0">
          <button
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="flex items-center gap-1 hover:text-gray-900 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.url}>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <button
                onClick={() => navigate(crumb.url)}
                className={`hover:text-gray-900 cursor-pointer capitalize ${
                  i === breadcrumbs.length - 1 ? 'text-gray-900 font-extrabold' : ''
                }`}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Main Content Outlet */}
        <main className="flex-1 overflow-auto bg-gray-50 flex flex-col">
          <LayoutProvider isAppLayout={true}>
            <Outlet />
          </LayoutProvider>
        </main>
      </div>
    </div>
  );
};
