import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute } from '../utils/permissions';
import { exchangeCodeForToken } from '../services/oidc';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { completeAsgardeoLogin } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const finishLogin = async () => {
      try {
        const code = params.get('code');
        const state = params.get('state');
        const oidcError = params.get('error');
        if (oidcError) throw new Error(params.get('error_description') || oidcError);
        if (!code) throw new Error('No authorization code found in callback.');

        const tokenResponse = await exchangeCodeForToken(code, state);
        const user = await completeAsgardeoLogin(tokenResponse.access_token, tokenResponse.id_token);
        navigate(getDefaultRoute(user.role), { replace: true });
      } catch (err: any) {
        setError(err.message || 'Asgardeo login could not be completed.');
      }
    };
    finishLogin();
  }, [completeAsgardeoLogin, navigate, params]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md w-full">
          <h1 className="text-lg font-semibold text-gray-900">Login could not be completed</h1>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-5 w-full py-2.5 bg-gov-500 text-white rounded-lg text-sm font-medium hover:bg-gov-600"
          >
            Return to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <LoadingSpinner size="lg" text="Completing sign in..." />
    </div>
  );
}
