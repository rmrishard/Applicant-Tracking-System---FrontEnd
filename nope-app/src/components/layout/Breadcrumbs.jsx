import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbNameMap = {
    '/dashboard': 'Dashboard',
    '/companies': 'Companies',
    '/jobs': 'Jobs',
    '/candidates': 'Candidates',
    '/applications': 'Applications',
    '/users': 'User Management',
    '/analytics': 'Analytics & Reports',
  };

  // If we're on the dashboard or no path, don't show breadcrumbs
  if (pathnames.length === 0 || (pathnames.length === 1 && pathnames[0] === 'dashboard')) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <MuiBreadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
        <Link
          component={RouterLink}
          to="/dashboard"
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'text.secondary',
            '&:hover': {
              color: 'primary.main',
            },
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="small" />
          Home
        </Link>

        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const breadcrumbName = breadcrumbNameMap[to];

          // If it's an ID (numeric), show it differently
          const isId = !isNaN(value);

          return last ? (
            <Typography color="text.primary" key={to} fontWeight="medium">
              {isId ? `Details #${value}` : breadcrumbName || value}
            </Typography>
          ) : (
            <Link
              component={RouterLink}
              to={to}
              key={to}
              sx={{
                textDecoration: 'none',
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                },
              }}
            >
              {isId ? `#${value}` : breadcrumbName || value}
            </Link>
          );
        })}
      </MuiBreadcrumbs>
    </Box>
  );
};

export default Breadcrumbs;
