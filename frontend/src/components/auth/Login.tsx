import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, User } from 'lucide-react';
import { login, verifyMFA } from '../../store/slices/authSlice';
import { AppDispatch, RootState } from '../../store';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error, mfaRequired, pendingMfaUserId } = useSelector(
    (state: RootState) => state.auth
  );

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    mfaCode: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mfaRequired && pendingMfaUserId) {
        await dispatch(
          verifyMFA({ user_id: pendingMfaUserId, code: formData.mfaCode })
        ).unwrap();
        navigate('/');
      } else {
        await dispatch(
          login({
            username: formData.username,
            password: formData.password,
          })
        ).unwrap();
        if (!mfaRequired) {
          navigate('/');
        }
      }
    } catch (err) {
      toast.error('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          {mfaRequired ? 'Enter MFA Code' : 'Login'}
        </h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {!mfaRequired ? (
            <>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <User size={20} />
                  </span>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-400">
                    <Lock size={20} />
                  </span>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                MFA Code
              </label>
              <input
                type="text"
                value={formData.mfaCode}
                onChange={(e) =>
                  setFormData({ ...formData, mfaCode: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={loading}
          >
            {loading
              ? 'Loading...'
              : mfaRequired
              ? 'Verify MFA Code'
              : 'Sign In'}
          </button>
        </form>
        {!mfaRequired && (
          <p className="mt-4 text-center text-gray-600">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-blue-500 hover:text-blue-600"
            >
              Register
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;