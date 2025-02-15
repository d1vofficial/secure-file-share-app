import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Upload, Share2, LogOut, Shield } from 'lucide-react';
import { AppDispatch, RootState } from '../../store';
import { logout, disableMFA } from '../../store/slices/authSlice';
import { listFiles } from '../../store/slices/fileSlice';
import FileUpload from './FileUpload';
import FileList from './FileList';
import MFASetup from './MFASetup';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const mfaEnabled = user?.mfa_enabled;;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMFAModal, setShowMFAModal] = useState(false);

  console.log(user);

  useEffect(() => {
    dispatch(listFiles());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleDisableMFA = async () => {
    if (!user) {
      toast.error('User is not authenticated.');
      return;
    }
    try {
      await dispatch(disableMFA({ user_id: user.id })).unwrap();
      toast.success('MFA disabled successfully!');
    } catch (error) {
      toast.error('Failed to disable MFA');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">
                Secure File Sharing
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </button>
              {!mfaEnabled ? (
              <button
                onClick={() => setShowMFAModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Shield className="mr-2 h-4 w-4" />
                Setup MFA
              </button>
              ) : 
              (
                <button
                  onClick={handleDisableMFA}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Disable MFA
                </button>
                )
              }
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <FileList />
        </div>
      </main>

      {showUploadModal && (
        <FileUpload onClose={() => setShowUploadModal(false)} />
      )}
      {showMFAModal && <MFASetup onClose={() => setShowMFAModal(false)} />}
    </div>
  );
};

export default Dashboard;