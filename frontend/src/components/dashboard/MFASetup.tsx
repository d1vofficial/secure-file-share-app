import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// import { QRCodeSVG } from 'qrcode.react';
import { Shield, X } from 'lucide-react';
import { AppDispatch, RootState } from '../../store';
import { enableMFA, verifyMFA } from '../../store/slices/authSlice';
import { toast } from 'react-toastify';

interface MFASetupProps {
  onClose: () => void;
}

const MFASetup: React.FC<MFASetupProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { mfaSetupData } = useSelector((state: RootState) => state.auth);
  const user = useSelector((state: RootState) => state.auth.user);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'initial' | 'verify'>('initial');

  const handleEnableMFA = async () => {
    try {
      await dispatch(enableMFA()).unwrap();
      setStep('verify');
      toast.success('MFA enabled successfully!');
      
    } catch (error) {
      toast.error('Failed to enable MFA');
    }
  };

  const handleVerifyMFA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('User is not authenticated.');
      return;
    }
    if (verificationCode.trim().length < 6) {
      toast.error('Please enter a verification code');
      return;
    }
    try {
      await dispatch(
        verifyMFA({ user_id: user.id, code: verificationCode })
      ).unwrap();
      toast.success('MFA verified successfully!');
      onClose();
    } catch (err) {
      // console.error('Error during MFA verification:', err);
      toast.error('MFA verification failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="relative bg-white rounded-lg shadow-xl p-8 m-4 max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Two-Factor Authentication
          </h2>
          {step === 'initial' ? (
            <div className="mt-4">
              <p className="text-gray-600">
                Enhance your account security by enabling two-factor
                authentication.
              </p>
              <button
                onClick={handleEnableMFA}
                className="mt-6 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Enable 2FA
              </button>
            </div>
          ) : (
            <div className="mt-4">
              {/* {mfaSetupData?.qr_code && (
                <div className="flex justify-center mb-4">
                  <QRCodeSVG value={mfaSetupData.qr_code} size={200} />
                </div>
              )} */}
              <p className="text-sm text-gray-600 mb-4">
                Open your authenticator app and enter the
                verification code below.
              </p>
              {mfaSetupData?.secret && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    Manual entry code:
                  </p>
                  <code className="block mt-1 p-2 bg-gray-50 rounded text-sm">
                    {mfaSetupData.secret}
                  </code>
                </div>
              )}
              {/* <form onSubmit={handleVerifyMFA}>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Verify
                </button>
              </form> */}
              <form onSubmit={handleVerifyMFA}>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter verification code"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Verify
                </button>
              </form>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MFASetup;