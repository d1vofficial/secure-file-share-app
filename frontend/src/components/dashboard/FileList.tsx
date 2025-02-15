import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Share2, Eye, Download } from 'lucide-react';
import { RootState } from '../../store';
import axios from 'axios';
import { toast } from 'react-toastify';
import { File } from '../../types';  // Import existing File type
import ShareModal from './ShareModal';

interface FileListProps {
  isSharedFiles?: boolean;
}

const FileList: React.FC<FileListProps> = ({ isSharedFiles = false }) => {
  const files = useSelector((state: RootState) => 
    isSharedFiles ? state.files.sharedFiles : state.files.files
  ) as File[];
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  // const handleDownload = async (fileId: string, fileName: string) => {
  //   try {
  //     const response = await axios.get(
  //       `${import.meta.env.VITE_APP_API_URL}/api/files/files/${fileId}/download/`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem('token')}`,
  //         },
  //         responseType: 'blob',
  //       }
  //     );

  //     const url = URL.createObjectURL(new Blob([response.data]));
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.setAttribute('download', fileName);
  //     document.body.appendChild(link);
  //     link.click();
  //     URL.revokeObjectURL(url);
  //     link.remove();
  //   } catch (error) {
  //     toast.error('Failed to download file');
  //   }
  // };
  const token = useSelector((state: RootState) => state.auth.token);
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
        const response = await axios.get(
            `${API_URL}/files/files/${fileId}/?action=download`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                responseType: 'blob',
            }
        );

        const url = URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
    } catch (error: any) {

        const errorMessage = error?.error || 'Failed to download file';
        toast.error(errorMessage);
    }
};


  const handleShare = (file: File) => {
    setSelectedFile(file);
    setShowShareModal(true);
  };

  if (!files || files.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        {isSharedFiles ? 'No files shared with you' : 'No files uploaded yet'}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {files.map((file) => (
            <li key={file.id}>
              <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-600 truncate">
                    {file.file_name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(file.uploaded_at).toLocaleDateString()} · {(file.file_size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/view/${file.id}`}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Link>
                  
                  {(!isSharedFiles || file.permission === 'DOWNLOAD') && (
                    <button
                      onClick={() => handleDownload(file.id, file.file_name)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </button>
                  )}

                  {!isSharedFiles && (
                    <button
                      onClick={() => handleShare(file)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200"
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showShareModal && selectedFile && (
        <ShareModal 
          file={selectedFile} 
          onClose={() => {
            setShowShareModal(false);
            setSelectedFile(null);
          }} 
        />
      )}
    </>
  );
};

export default FileList;