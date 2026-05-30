import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute } from '../utils/permissions';
import { ROLE_DISPLAY_NAMES } from '../utils/constants';
import toast from 'react-hot-toast';

const DEMO_ROLES = [
  'admin', 'field_officer', 'verifier', 'program_manager',
  'finance_officer', 'warehouse_officer', 'gis_officer',
  'ngo_partner', 'auditor', 'citizen',
];

export default function LoginPage() {
  const { login, loginAsRole } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'credentials' | 'demo'>('demo');

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(getDefaultRoute(user.role));
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await loginAsRole(selectedRole);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      toast.success(`Logged in as ${ROLE_DISPLAY_NAMES[selectedRole as keyof typeof ROLE_DISPLAY_NAMES]}`);
      navigate(getDefaultRoute(user.role));
    } catch (err) {
      toast.error('Demo login failed');
    } finally {
      setLoading(false);
    }
  };

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
            <button
              onClick={() => setMode('credentials')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'credentials' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('demo')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'demo' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
              }`}
            >
              Demo Mode
            </button>
          </div>

          {mode === 'credentials' ? (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none"
                  placeholder="Enter your password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gov-500 text-white rounded-lg font-medium text-sm hover:bg-gov-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gov-500 focus:border-gov-500 outline-none"
                >
                  {DEMO_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_DISPLAY_NAMES[role as keyof typeof ROLE_DISPLAY_NAMES]}
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

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              disabled
              className="w-full py-2.5 border-2 border-gray-300 text-gray-400 rounded-lg font-medium text-sm cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              OIDC Login with Asgardeo — Coming Soon
            </button>
          </div>
        </div>

        <p className="text-center text-gov-300 text-xs mt-6">
          © {new Date().getFullYear()} Government of Sri Lanka. All rights reserved.
        </p>
      </div>
    </div>
  );
}
