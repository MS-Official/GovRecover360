import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute } from '../utils/permissions';
import { ROLE_DISPLAY_NAMES } from '../utils/constants';
import {
  getAuthMode,
  getSignUpUrl,
  isAsgardeoConfigured,
  startAsgardeoLogin,
  startAsgardeoRegistration,
} from '../services/oidc';
import toast from 'react-hot-toast';

const DEMO_ROLES = [
  'admin', 'field_officer', 'verifier', 'program_manager',
  'finance_officer', 'warehouse_officer', 'gis_officer',
  'ngo_partner', 'auditor', 'citizen',
];

const DEMO_ROLE_LABELS: Record<string, string> = {
  admin: 'Admin Demo',
  field_officer: 'Officer Demo',
  verifier: 'Verifier Demo',
  program_manager: 'Manager Demo',
  finance_officer: 'Finance Demo',
  warehouse_officer: 'Warehouse Demo',
  gis_officer: 'GIS Demo',
  ngo_partner: 'NGO Demo',
  auditor: 'Auditor Demo',
  citizen: 'Citizen Demo',
};

type Mode = 'signin' | 'register' | 'demo';

export default function LoginPage() {
  const { login, register, loginAsRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedRole, setSelectedRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>(location.pathname === '/register' ? 'register' : 'signin');
  const [signInForm, setSignInForm] = useState({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const authMode = getAuthMode();
  const asgardeoReady = isAsgardeoConfigured();
  const signUpUrl = getSignUpUrl();

  useEffect(() => {
    setMode(location.pathname === '/register' ? 'register' : 'signin');
  }, [location.pathname]);

  useEffect(() => {
    const error = new URLSearchParams(location.search).get('error');
    if (error) toast.error(error);
  }, [location.search]);

  const handleLocalLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const user = await login(signInForm.identifier.trim(), signInForm.password);
      toast.success('Signed in successfully');
      navigate(getDefaultRoute(user.role));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid username/email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleAsgardeoLogin = async () => {
    setLoading(true);
    try {
      await startAsgardeoLogin();
    } catch (err: any) {
      toast.error(err.message || 'Asgardeo login could not start');
      setLoading(false);
    }
  };

  const handleLocalRegister = async (event: FormEvent) => {
    event.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const user = await register({
        full_name: registerForm.full_name.trim(),
        username: registerForm.username.trim(),
        email: registerForm.email.trim(),
        password: registerForm.password,
      });
      toast.success('Account created successfully');
      navigate(getDefaultRoute(user.role));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAsgardeoRegister = async () => {
    if (startAsgardeoRegistration()) return;
    toast.error('User self-registration must be enabled in Asgardeo Console.');
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await loginAsRole(selectedRole);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      toast.success(`Logged in as ${ROLE_DISPLAY_NAMES[selectedRole as keyof typeof ROLE_DISPLAY_NAMES]}`);
      navigate(getDefaultRoute(user.role));
    } catch {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: Mode; label: string }[] = [
    { key: 'signin', label: 'Sign In' },
    { key: 'register', label: 'Register' },
    { key: 'demo', label: 'Demo Mode' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gov-900 via-gov-800 to-gov-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <svg className="w-10 h-10 text-gov-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">GovRecover360</h1>
          <p className="text-gov-200 mt-1">Disaster Recovery Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === tab.key ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {mode === 'signin' && (
            <form onSubmit={handleLocalLogin} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sign in to GovRecover360</h2>
                <p className="text-sm text-gray-500 mt-1">Use your platform account or government identity provider.</p>
              </div>
              <div>
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                  Username or email
                </label>
                <input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  value={signInForm.identifier}
                  onChange={(e) => setSignInForm((current) => ({ ...current, identifier: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={signInForm.password}
                  onChange={(e) => setSignInForm((current) => ({ ...current, password: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gov-500 text-white rounded-lg font-medium text-sm hover:bg-gov-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-500">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              {!asgardeoReady && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  Asgardeo is not configured. Use Demo Mode or update environment variables.
                </div>
              )}
              <button
                type="button"
                onClick={handleAsgardeoLogin}
                disabled={loading || !asgardeoReady}
                className="w-full py-2.5 bg-gov-500 text-white rounded-lg font-medium text-sm hover:bg-gov-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Starting sign in...' : 'Sign in with Asgardeo'}
              </button>
              {!['asgardeo', 'hybrid'].includes(authMode) && (
                <p className="text-xs text-gray-500">Current frontend auth mode is {authMode}. Use `VITE_AUTH_MODE=hybrid` to show local and Asgardeo flows together.</p>
              )}
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleLocalRegister} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Create an account</h2>
                <p className="text-sm text-gray-500 mt-1">Create a platform account or register with Asgardeo.</p>
              </div>
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input id="full_name" type="text" autoComplete="name" value={registerForm.full_name} onChange={(e) => setRegisterForm((current) => ({ ...current, full_name: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none" />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input id="username" type="text" autoComplete="username" value={registerForm.username} onChange={(e) => setRegisterForm((current) => ({ ...current, username: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input id="email" type="email" autoComplete="email" value={registerForm.email} onChange={(e) => setRegisterForm((current) => ({ ...current, email: e.target.value }))} required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none" />
              </div>
              <div>
                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input id="new_password" type="password" autoComplete="new-password" value={registerForm.password} onChange={(e) => setRegisterForm((current) => ({ ...current, password: e.target.value }))} required minLength={8} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none" />
              </div>
              <div>
                <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input id="confirm_password" type="password" autoComplete="new-password" value={registerForm.confirmPassword} onChange={(e) => setRegisterForm((current) => ({ ...current, confirmPassword: e.target.value }))} required minLength={8} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-gov-500 text-white rounded-lg font-medium text-sm hover:bg-gov-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Creating account...' : 'Register'}
              </button>
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-500">or</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <button type="button" onClick={handleAsgardeoRegister} disabled={!signUpUrl} className="w-full py-2.5 bg-gov-500 text-white rounded-lg font-medium text-sm hover:bg-gov-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Create account with Asgardeo
              </button>
              <p className="text-xs text-gray-500">After creating your account, return here and sign in with Asgardeo.</p>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Back to Sign In
              </button>
            </form>
          )}

          {mode === 'demo' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Local demo mode</h2>
                <p className="text-sm text-gray-500 mt-1">Use seeded demo roles without an external identity provider.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none"
                >
                  {DEMO_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {DEMO_ROLE_LABELS[role] || ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES]}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2.5 bg-gov-500 text-white rounded-lg font-medium text-sm hover:bg-gov-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Enter Dashboard'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-gov-300 text-xs mt-6">
          © {new Date().getFullYear()} Government of Sri Lanka. All rights reserved.
        </p>
      </div>
    </div>
  );
}
