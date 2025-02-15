import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, Copy, Check } from 'lucide-react';
import { AppDispatch, RootState } from '../../store';
import { shareFile, generateShareableLink } from '../../store/slices/fileSlice';
import { File } from '../../types';
import { toast } from 'react-toastify';
import axios from 'axios';

interface ShareModalProps {
  file: File;
  onClose: () => void;
}

interface User {
  id: number;
  username: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ file, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [userId, setUserId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [permission, setPermission] = useState<'VIEW' | 'DOWNLOAD'>('VIEW');
  const [oneTimeUse, setOneTimeUse] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserName, setSelectedUserName] = useState('');
  const API_URL = import.meta.env.VITE_API_URL;
  const token = useSelector((state: RootState) => state.auth.token);

  // Fetch users from the backend
  useEffect(() => {
    axios
      .get(`${API_URL}/auth/users/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        if (response.data && response.data.users) {
          setUsers(response.data.users);
        }
      })
      .catch((error) => {
        toast.error('Failed to fetch users');
      });
  }, [token]);

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserName) {
      toast.error('Please select a user');
      return;
    }
    // Find userId based on selected username
    const selectedUser = users.find(user => user.username === selectedUserName);
    if (!selectedUser) {
      toast.error('Invalid user selected');
      return;
    }
    setUserId(selectedUser.id.toString());
    try {
      await dispatch(
        shareFile({
          fileId: file.id,
          userId: selectedUser.id,
          permission: permission,
          expiresAt: new Date(expiryDate).toISOString(),
        })
      ).unwrap();
      toast.success('File shared successfully!');
      onClose();
    } catch (err: any) {
      console.error('Error during file sharing:', err); // Debugging log

      let errorMessage = 'Failed to share file';

      if (err?.non_field_errors?.length) {
        errorMessage = err.non_field_errors.join(', '); // Extracts and formats error messages
      } else if (err?.errors) {
        errorMessage = typeof err.errors === 'string' ? err.errors : JSON.stringify(err.errors);
      } else if (err?.message) {
        errorMessage = err.message;
      }

    toast.error(errorMessage);
    }
  };

  const handleGenerateLink = async () => {
    try {
      const result = await dispatch(
        generateShareableLink({
          fileId: file.id,
          expiresAt: new Date(expiryDate).toISOString(),
          oneTimeUse,
        })
      ).unwrap();
      setGeneratedLink(result.url);
    } catch (error) {
      toast.error('Failed to generate link');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl p-8 m-4 max-w-xl w-full">
        <h2 className="text-2xl font-bold mb-6">Share File</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Share with User</h3>
            <form onSubmit={handleShare} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  User ID
                </label>
                {/* <input
                  type="number"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                /> */}
                <select
                  value={selectedUserName}
                  onChange={(e) => setSelectedUserName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.username}>
                      {user.username}
                    </option>
                  ))}
            </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Permission
                </label>
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as 'VIEW' | 'DOWNLOAD')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="VIEW">View</option>
                  <option value="DOWNLOAD">Download</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Share
              </button>
            </form>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Generate Shareable Link</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Expiry Date
                </label>
                <input
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={oneTimeUse}
                  onChange={(e) => setOneTimeUse(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  One-time use only
                </label>
              </div>
              <button
                onClick={handleGenerateLink}
                className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Link className="mr-2 h-4 w-4" />
                Generate Link
              </button>
              {generatedLink && (
                <div className="mt-4">
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <span className="text-sm text-gray-600 truncate">
                      {generatedLink}
                    </span>
                    <button
                      onClick={copyToClipboard}
                      className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    >
                      {linkCopied ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ShareModal;