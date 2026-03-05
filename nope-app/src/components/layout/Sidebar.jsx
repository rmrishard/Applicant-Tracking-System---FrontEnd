import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export const DRAWER_WIDTH = 280;
export const COLLAPSED_DRAWER_WIDTH = 80;

const menuItems = [
  {
    text: 'Companies',
    icon: <BusinessIcon />,
    path: '/companies',
    roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
  },
  {
    text: 'Jobs',
    icon: <WorkIcon />,
    path: '/jobs',
    roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
  },
  {
    text: 'Candidates',
    icon: <PeopleIcon />,
    path: '/candidates',
    roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
  },
  {
    text: 'Applications',
    icon: <DescriptionIcon />,
    path: '/applications',
    roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
  },
  {
    text: 'Users',
    icon: <PersonIcon />,
    path: '/users',
    roles: ['ADMIN'],
  },
  {
    text: 'Analytics',
    icon: <BarChartIcon />,
    path: '/analytics',
    roles: ['ADMIN', 'RECRUITER', 'HIRING_MANAGER'],
  },
];

const Sidebar = ({ mobileOpen, onDrawerToggle, collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasRole } = useAuth();

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ mb: 2 }} /> {/* Spacer to push content below the fixed AppBar */}
      {/* Navigation Menu */}
      <List sx={{ px: 2, py: 3, flex: 1 }}>
        {menuItems.map((item) => {
          // Check if user has required role
          if (!hasRole(item.roles)) {
            return null;
          }

          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={isActive}
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  px: 2,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'translateX(4px)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    opacity: collapsed ? 0 : 1,
                    transition: 'opacity 0.2s',
                    whiteSpace: 'nowrap',
                    display: collapsed ? 'none' : 'block'
                  }}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.95rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
            transition: 'width 0.2s',
            borderRight: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
