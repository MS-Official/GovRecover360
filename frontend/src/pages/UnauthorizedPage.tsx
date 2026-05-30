import { useNavigate } from 'react-router-dom';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute } from '../utils/permissions';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturn = () => {
    if (user) {
      navigate(getDefaultRoute(user.role));
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <LockClosedIcon className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Access Denied</h1>
        <p className="text-gray-500 mb-8 text-lg">
          You do not have permission to access this resource.
        </p>
        <button
          onClick={handleReturn}
          className="inline-flex items-center px-6 py-3 bg-gov-500 text-white rounded-lg text-sm font-medium hover:bg-gov-600 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
