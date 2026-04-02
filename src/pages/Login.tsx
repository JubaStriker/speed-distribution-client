import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { Package } from 'lucide-react';

const DEMO_EMAIL = 'admin@demo.com';
const DEMO_PASSWORD = 'demo1234';

export default function Login() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleLogin(e: FormEvent) {
    e.preventDefault();
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      dispatch({
        type: 'LOGIN',
        payload: { id: 'u-1', email, name: 'Admin User', role: 'admin' },
      });
      navigate('/dashboard');
    } else {
      setError('Invalid email or password.');
    }
  }

  function demoLogin() {
    dispatch({
      type: 'LOGIN',
      payload: { id: 'u-1', email: DEMO_EMAIL, name: 'Admin User', role: 'admin' },
    });
    navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 text-white p-3 rounded-xl mb-3">
              <Package size={28} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SmartInventory</h1>
            <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Sign In
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">or</span>
            </div>
          </div>

          <button
            onClick={demoLogin}
            className="w-full border-2 border-blue-600 text-blue-700 font-semibold py-2.5 rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            Demo Login
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
          </p>
        </div>
      </div>
    </div>
  );
}
