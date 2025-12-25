import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Auth/Login';
import RFQList from './components/RFQ/RFQList';
import RFQDetail from './components/RFQ/RFQDetail';
import RFQForm from './components/RFQ/RFQForm';
import Settings from './components/Settings/Settings';
import Layout from './components/Layout/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="spinner"></div>;
  }

  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/rfq" />} />
      <Route
        path="/rfq"
        element={
          <PrivateRoute>
            <Layout>
              <RFQList />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/rfq/new"
        element={
          <PrivateRoute>
            <Layout>
              <RFQForm />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/rfq/:id"
        element={
          <PrivateRoute>
            <Layout>
              <RFQDetail />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/rfq/:id/edit"
        element={
          <PrivateRoute>
            <Layout>
              <RFQForm />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <PrivateRoute>
            <Layout>
              <Settings />
            </Layout>
          </PrivateRoute>
        }
      />
      <Route path="/" element={<Navigate to="/rfq" />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;

