import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { RootState } from '../../store';

const FileView: React.FC = () => {
  const { fileId } = useParams<{ fileId: string }>();
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = useSelector((state: RootState) => state.auth.token);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!fileId || !token) {
      toast.error('Unauthorized access');
      navigate('/login');
      return;
    }

    const disableCopyPaste = (event: ClipboardEvent) => {
      event.preventDefault();
      toast.warn('Copying is disabled');
    };

    const disableRightClick = (event: MouseEvent) => event.preventDefault();

    const blockKeys = (event: KeyboardEvent) => {
      if (
        event.key === 'F12' || 
        (event.ctrlKey && event.shiftKey && event.key === 'I') || 
        (event.ctrlKey && (event.key === 'c' || event.key === 'p'))
      ) {
        event.preventDefault();
        toast.warn('Action blocked');
      }
    };

    document.addEventListener('copy', disableCopyPaste);
    document.addEventListener('cut', disableCopyPaste);
    document.addEventListener('contextmenu', disableRightClick);
    document.addEventListener('keydown', blockKeys);
    document.body.style.userSelect = 'none';

    const fetchFile = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/files/files/${fileId}/?action=view`,
          {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob'
          }
        );

        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        setFileType(response.headers['content-type'] || '');
        const url = URL.createObjectURL(blob);
        setFileContent(url);
      } catch (error) {
        toast.error('Failed to load file');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();

    return () => {
      document.removeEventListener('copy', disableCopyPaste);
      document.removeEventListener('cut', disableCopyPaste);
      document.removeEventListener('contextmenu', disableRightClick);
      document.removeEventListener('keydown', blockKeys);
      document.body.style.userSelect = 'auto';
      if (fileContent) URL.revokeObjectURL(fileContent);
    };
  }, [fileId, token, navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderFilePreview = () => {
    if (!fileContent) return null;

    if (fileType.startsWith('image/')) {
      return <img src={fileContent} alt="File preview" className="max-w-full pointer-events-none select-none" />;
    }

    if (fileType === 'application/pdf') {
      return (
        <div className="relative w-full h-screen">
          <div className="absolute inset-0 z-10 bg-transparent pointer-events-none select-none"></div>
          <iframe
            src={`${fileContent}#toolbar=0`}
            className="w-full h-full"
            title="PDF preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          />
        </div>
      );
    }

    if (fileType === 'text/html' || fileType.startsWith('text/') || fileType === 'application/json') {
      return (
        <div className="relative w-full h-screen">
          <div className="absolute inset-0 z-10 bg-transparent pointer-events-none select-none"></div>
          <iframe
            src={fileContent}
            className="w-full h-full"
            title="Text preview"
            sandbox="allow-scripts allow-same-origin"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          />
        </div>
      );
    }

    if (
      fileType.includes('officedocument') ||
      fileType.includes('msword') ||
      fileType.includes('ms-excel') ||
      fileType.includes('ms-powerpoint')
    ) {
      const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileContent)}&embedded=true&rm=minimal`;
      return (
        <div className="relative w-full h-screen">
          <div className="absolute inset-0 z-10 bg-transparent pointer-events-none select-none"></div>
          <iframe
            src={googleViewerUrl}
            className="w-full h-full"
            title="Office document preview"
            sandbox="allow-same-origin allow-scripts"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          />
        </div>
      );
    }

    if (fileType.startsWith('video/')) {
      return (
        <video controls className="w-full pointer-events-none select-none">
          <source src={fileContent} type={fileType} />
          Your browser does not support the video tag.
        </video>
      );
    }

    if (fileType.startsWith('audio/')) {
      return (
        <audio controls className="w-full pointer-events-none select-none">
          <source src={fileContent} type={fileType} />
          Your browser does not support the audio tag.
        </audio>
      );
    }

    return (
      <div className="text-center py-4">
        <p>This file type cannot be previewed in the browser</p>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4 select-none">
      <div className="bg-white shadow rounded-lg p-4">
        {!fileContent ? (
          <div className="text-center py-4">
            <p>No file content available</p>
          </div>
        ) : (
          <>
            <p>File Type: {fileType}</p>
            {renderFilePreview()}
          </>
        )}
      </div>
    </div>
  );
};

export default FileView;
