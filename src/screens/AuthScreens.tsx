import { useNavigate } from 'react-router-dom';
import { WireButton, WireInput, ScreenContainer } from '../components/WireframeUI';
import { Activity } from 'lucide-react';
import { ROUTES } from '../constants/routes';

export const Screen1 = () => {
  const navigate = useNavigate();
  return (
    <ScreenContainer id="screen-1" title="SCREEN 1 - LOGIN PAGE">
      <div className="flex-1 flex bg-gray-100 items-center justify-center p-8">
        <div className="w-full max-w-4xl bg-white border-4 border-gray-800 flex min-h-[500px] shadow-[8px_8px_0px_0px_rgba(31,41,55,1)]">
          <div className="w-1/2 border-r-4 border-gray-800 bg-gray-50 p-12 flex flex-col justify-center">
            <div className="w-16 h-16 border-4 border-gray-800 bg-gray-200 mb-6 flex items-center justify-center">
              <Activity className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
              ClaimPilot India
            </h1>
            <p className="text-gray-600 font-medium text-lg border-l-4 border-gray-800 pl-4">
              AI-Powered Claims Automation for Indian Hospitals.
            </p>
          </div>
          <div className="w-1/2 p-12 flex flex-col justify-center">
            <h2 className="text-2xl font-bold mb-8 uppercase border-b-2 border-gray-800 pb-2">
              Hospital Login
            </h2>
            <div className="space-y-4 mb-8">
              <WireInput placeholder="Hospital Name or ID" />
              <WireInput placeholder="Email Address" type="email" />
              <WireInput placeholder="Password" type="password" />
            </div>
            <WireButton
              id="btn-login"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="w-full mb-4 py-3 text-lg"
            >
              LOGIN
            </WireButton>
            <div className="flex justify-between text-sm font-bold text-gray-600">
              <a href="#" className="hover:underline">
                Forgot Password?
              </a>
              <a href="#" className="hover:underline">
                First time? Request Access
              </a>
            </div>
          </div>
        </div>
      </div>
    </ScreenContainer>
  );
};
