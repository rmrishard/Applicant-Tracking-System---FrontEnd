import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Header from './Header';
import Sidebar, { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH } from './Sidebar';
import Breadcrumbs from './Breadcrumbs';

const DashboardLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <Header
        onDrawerToggle={handleDrawerToggle}
        onToggleCollapse={handleToggleCollapse}
        collapsed={collapsed}
      />
      <Sidebar
        mobileOpen={mobileOpen}
        onDrawerToggle={handleDrawerToggle}
        collapsed={collapsed}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH}px)` },
          transition: 'width 0.2s',
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar sx={{ mb: 4 }} /> {/* Reliable spacer for fixed AppBar */}
        <Box>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
