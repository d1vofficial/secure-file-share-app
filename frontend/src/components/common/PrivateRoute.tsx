import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, mfaRequired } = useSelector(
    (state: RootState) => state.auth
  );

  if (!isAuthenticated || mfaRequired) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;