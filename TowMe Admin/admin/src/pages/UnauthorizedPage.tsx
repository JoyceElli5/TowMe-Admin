import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="glass-card p-8 max-w-lg w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Restricted</h1>
        <p className="text-gray-600 mb-6">
          Your role does not have permission to view this module.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-colors"
        >
          Go To Dashboard
        </Link>
      </div>
    </div>
  );
}
