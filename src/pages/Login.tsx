import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Package, Zap, BarChart3, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Package size={20} />
            </div>
            <span className="font-bold text-gray-900 text-lg">SmartInventory</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-7">Sign in to your account to continue</p>

          <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-600 font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right — Branding panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur p-2.5 rounded-xl">
            <Package size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight">SmartInventory</span>
        </div>

        {/* Center motto */}
        <div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4">
            Speed meets<br />smart distribution.
          </h1>
          <p className="text-blue-100 text-base leading-relaxed max-w-sm">
            Manage products, track orders, and keep your supply chain moving — all from one powerful dashboard.
          </p>

          {/* Feature highlights */}
          <div className="mt-10 space-y-4">
            {[
              { icon: <Zap size={18} />, text: 'Real-time inventory tracking' },
              { icon: <BarChart3 size={18} />, text: 'Actionable analytics & reports' },
              { icon: <ShieldCheck size={18} />, text: 'Role-based access control' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-1.5">{icon}</div>
                <span className="text-sm text-blue-50">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-blue-200 text-xs">© {new Date().getFullYear()} SmartInventory. All rights reserved.</p>
      </div>
    </div>
  );
}
