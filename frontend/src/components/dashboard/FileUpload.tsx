import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useDispatch } from 'react-redux';
import { Upload, X } from 'lucide-react';
import { uploadFile } from '../../store/slices/fileSlice';
import { AppDispatch } from '../../store';
import { encryptFile } from '../../utils/encryption';
import { toast } from 'react-toastify';

interface FileUploadProps {
  onClose: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      try {
        for (const file of acceptedFiles) {
          console.log('Original file:', file);
          
          // const encryptedData = await encryptFile(file);
          // console.log('Encrypted data length:', new Uint8Array(encryptedData).length);
          
          const clientFile = new File([file], file.name, {
            type: file.type,
          });
          // console.log('Encrypted file:', encryptedFile);
          
          const result = await dispatch(uploadFile(clientFile)).unwrap();
          console.log('Upload result:', result);
        }
        toast.success('Files uploaded successfully!');
        onClose();
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload files');
      }
    },
    [dispatch, onClose]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024, // 100MB max file size
  });

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl p-8 m-4 max-w-xl w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4">Upload Files</h2>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag and drop files here, or click to select files'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Maximum file size: 100MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;