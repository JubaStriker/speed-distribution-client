import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store/store';
import { loginThunk } from '../store/authSlice';
import { Package, Zap, BarChart3, ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(overrideEmail?: string, overridePassword?: string) {
    const loginEmail = overrideEmail ?? email;
    const loginPassword = overridePassword ?? password;
    if (!loginEmail || !loginPassword) return;
    setError('');
    setLoading(true);
    try {
      await dispatch(loginThunk({ email: loginEmail, password: loginPassword })).unwrap();
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
          <p className="text-gray-500 text-sm mb-4">Sign in to your account to continue</p>

          <button
            type="button"
            onClick={() => {
              setEmail('admin@demo.com');
              setPassword('Admin12345');
              setError('');
              handleLogin('admin@demo.com', 'Admin12345');
            }}
            className="w-full mb-5 border border-dashed border-blue-400 text-blue-600 bg-blue-50 hover:bg-blue-100 text-sm font-medium py-2 rounded-lg transition-colors"
          >
            Use Demo Credentials
          </button>

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
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
