import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { store } from './store';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import PrivateRoute from './components/common/PrivateRoute';
import FileView from './components/dashboard/FileView';
import 'react-toastify/dist/ReactToastify.css';
// import dotenv from 'dotenv';

// dotenv.config(); // Load environment variables from .env

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/view/:fileId" element={<FileView />} />
          </Routes>
          <ToastContainer />
        </div>
      </Router>
    </Provider>
  );
}

export default App;