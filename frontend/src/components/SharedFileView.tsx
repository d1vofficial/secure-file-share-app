import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Download } from 'lucide-react';
import { toast } from 'react-toastify';

interface SharedFile {
  id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  file_size: number;
  permission: 'VIEW' | 'DOWNLOAD';
}

const SharedFileView: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const [fileDetails, setFileDetails] = useState<SharedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [viewerKey] = useState(`viewer-${Math.random()}`); // Unique key for viewer

  useEffect(() => {
    const fetchFileDetails = async () => {
      try {
        const response = await axios.get<SharedFile>(
          `${import.meta.env.VITE_APP_API_URL}/api/files/shared-link/${linkId}/`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setFileDetails(response.data);
        
        // If it's a viewable file type, fetch the content immediately
        if (response.data.permission === 'VIEW' || response.data.permission === 'DOWNLOAD') {
          await fetchFileContent();
        }
      } catch (error) {
        toast.error('Failed to fetch file details');
      } finally {
        setLoading(false);
      }
    };

    if (linkId) {
      fetchFileDetails();
    }
  }, [linkId]);

  const fetchFileContent = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/api/files/shared-link/${linkId}/view/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          responseType: 'blob',
        }
      );

      // Handle different file types appropriately
      const blob = new Blob([response.data], { type: fileDetails?.file_type });
      
      if (fileDetails?.file_type.startsWith('image/')) {
        const url = URL.createObjectURL(blob);
        setFileContent(url);
      } else if (fileDetails?.file_type.startsWith('text/') || 
                 fileDetails?.file_type === 'application/json') {
        const text = await blob.text();
        setFileContent(text);
      } else {
        // For other file types, we'll show a preview not available message
        setFileContent(null);
      }
    } catch (error) {
      toast.error('Failed to load file content');
    }
  };

  const handleDownload = async () => {
    if (fileDetails?.permission !== 'DOWNLOAD') {
      toast.error('You do not have permission to download this file');
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_URL}/api/files/shared-link/${linkId}/download/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          responseType: 'blob',
        }
      );

      const url = URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileDetails?.file_name || 'download');
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const renderFilePreview = () => {
    if (!fileContent) {
      return (
        <div className="text-center p-4 bg-gray-50 rounded">
          <p>Preview not available for this file type</p>
        </div>
      );
    }

    if (fileDetails?.file_type.startsWith('image/')) {
      return (
        <div className="flex justify-center">
          <img 
            src={fileContent} 
            alt={fileDetails.file_name}
            className="max-w-full h-auto"
            style={{ pointerEvents: 'none' }} // Prevent drag & save
            onContextMenu={(e) => e.preventDefault()} // Prevent right-click
          />
        </div>
      );
    }

    return (
      <div 
        className="bg-gray-50 p-4 rounded overflow-auto max-h-[500px]"
        style={{ 
          userSelect: 'none', // Prevent text selection
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
      >
        <pre className="whitespace-pre-wrap">{fileContent}</pre>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!fileDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700">File Not Found</h2>
          <p className="text-gray-500">The shared file link may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Shared File</h1>
            <div className="flex items-center space-x-2">
              {fileDetails.permission === 'DOWNLOAD' && (
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </button>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h2 className="text-lg font-medium text-gray-900">{fileDetails.file_name}</h2>
              <p className="text-sm text-gray-500">
                Type: {fileDetails.file_type}
              </p>
              <p className="text-sm text-gray-500">
                Size: {(fileDetails.file_size / 1024).toFixed(2)} KB
              </p>
              <p className="text-sm text-gray-500">
                Uploaded: {new Date(fileDetails.uploaded_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                Permission: {fileDetails.permission}
              </p>
            </div>

            <div key={viewerKey} className="mt-4">
              {renderFilePreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedFileView; 