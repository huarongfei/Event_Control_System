import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useAuthStore } from './stores/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MatchList from './pages/MatchList';
import MatchControl from './pages/MatchControl';
import DisplayScreen from './pages/DisplayScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="text-primary-cyan text-xl">加载中...</div>
      </div>
    );
  }

  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { loadUser } = useAuthStore();

  React.useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00F5FF',
          colorBgBase: '#0A0E27',
          colorTextBase: '#FFFFFF',
          colorBgContainer: '#121A3A',
          colorBorder: '#232D56',
          colorText: '#B8BFD6',
          colorTextSecondary: '#8B93B0',
          fontFamily: 'DIN Next, system-ui, sans-serif',
          borderRadius: 8,
        },
        components: {
          Layout: {
            headerBg: '#0A0E27',
            siderBg: '#121A3A',
            triggerBg: '#1A2454',
          },
          Menu: {
            darkItemBg: '#121A3A',
            darkItemSelectedBg: '#1A2454',
            darkItemHoverBg: '#232D56',
            darkItemColor: '#B8BFD6',
            darkItemSelectedColor: '#00F5FF',
          },
          Button: {
            defaultBg: '#1A2454',
            defaultColor: '#B8BFD6',
            defaultBorderColor: '#232D56',
          },
          Card: {
            colorBgContainer: '#121A3A',
            colorBorder: '#232D56',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
            <Route path="/matches" element={<PrivateRoute element={<MatchList />} />} />
            <Route path="/matches/:id/control" element={<PrivateRoute element={<MatchControl />} />} />
            <Route path="/display/:id" element={<DisplayScreen />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default App;
