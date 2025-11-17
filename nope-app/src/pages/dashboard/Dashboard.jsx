import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Divider,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Work as WorkIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { dashboardAPI, applicationsAPI, jobsAPI, candidatesAPI, companiesAPI } from '../../services/api';

const StatCard = ({ title, value, icon, color, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: 3,
        borderColor: `${color}.main`,
        transform: 'translateY(-2px)',
      }
    }}
  >
    <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
        <Box sx={{ flex: 1 }}>
          <Typography
            color="text.secondary"
            variant="body2"
            sx={{
              mb: 1.5,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontSize: '0.75rem'
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h3"
            component="div"
            sx={{
              fontWeight: 600,
              color: 'text.primary'
            }}
          >
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 2,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 56,
            minHeight: 56,
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentApplications, setRecentApplications] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [pendingFollowUps, setPendingFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, appsRes, jobsRes] = await Promise.all([
          dashboardAPI.getStats(),
          applicationsAPI.getAll(),
          jobsAPI.getAll(),
        ]);

        setStats(statsRes.data);

        // Get recent applications (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Handle both array and paginated response formats
        const appsData = Array.isArray(appsRes.data)
          ? appsRes.data
          : (appsRes.data.content || appsRes.data.applications || []);
        const recent = appsData
          .filter((app) => {
            if (!app.appliedDate) return false;
            const appDate = new Date(app.appliedDate);
            return appDate >= weekAgo;
          })
          .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate))
          .slice(0, 5);
        setRecentApplications(recent);

        // Get recent open jobs
        const jobsData = Array.isArray(jobsRes.data)
          ? jobsRes.data
          : (jobsRes.data.content || jobsRes.data.jobs || []);
        const recentOpenJobs = jobsData
          .filter((job) => job.status === 'OPEN')
          .slice(0, 5);
        setRecentJobs(recentOpenJobs);

        // Get pending follow-ups (applications in INTERVIEW stage)
        const followUps = appsData
          .filter((app) => app.status === 'INTERVIEW' || app.status === 'OFFER')
          .slice(0, 5);
        setPendingFollowUps(followUps);

        setError('');
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPLIED': return 'info';
      case 'SCREENING': return 'primary';
      case 'INTERVIEW': return 'warning';
      case 'OFFER': return 'success';
      case 'HIRED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 3,
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Dashboard
        </Typography>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/companies')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2.5,
              py: 1,
            }}
          >
            Company
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/jobs')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2.5,
              py: 1,
            }}
          >
            Job
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/candidates')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2.5,
              py: 1,
            }}
          >
            Candidate
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/applications')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              py: 1,
              boxShadow: 2,
              '&:hover': {
                boxShadow: 4,
              }
            }}
          >
            Application
          </Button>
        </Box>
      </Box>

      {/* Stats Cards Row - No wrapping */}
      <Box sx={{ display: 'flex', gap: 3, mb: 3, minWidth: 0 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <StatCard
            title="Total Companies"
            value={stats?.totalCompanies || 0}
            icon={<BusinessIcon sx={{ fontSize: 40, color: 'primary.main' }} />}
            color="primary"
            onClick={() => navigate('/companies')}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <StatCard
            title="Active Jobs"
            value={stats?.totalJobs || 0}
            icon={<WorkIcon sx={{ fontSize: 40, color: 'secondary.main' }} />}
            color="secondary"
            onClick={() => navigate('/jobs')}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <StatCard
            title="Total Candidates"
            value={stats?.totalCandidates || 0}
            icon={<PeopleIcon sx={{ fontSize: 40, color: 'success.main' }} />}
            color="success"
            onClick={() => navigate('/candidates')}
          />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <StatCard
            title="Applications"
            value={stats?.totalApplications || 0}
            icon={<DescriptionIcon sx={{ fontSize: 40, color: 'warning.main' }} />}
            color="warning"
            onClick={() => navigate('/applications')}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>

        {/* Recent Activity Feed */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUpIcon sx={{ color: 'primary.main', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Recent Activity
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/applications')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  View All
                </Button>
              </Box>
              <Divider sx={{ mb: 0 }} />

              {recentApplications.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography variant="body2" color="text.secondary">
                    No recent activity in the last 7 days
                  </Typography>
                </Box>
              ) : (
                <List sx={{ pt: 0 }}>
                  {recentApplications.map((app, index) => (
                    <ListItem
                      key={app.id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 1.5,
                        px: 2,
                        py: 1.5,
                        mb: 0.5,
                        transition: 'background-color 0.2s',
                      }}
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <ListItemIcon sx={{ minWidth: 48 }}>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.main',
                            width: 40,
                            height: 40,
                            fontSize: '1rem',
                            fontWeight: 600,
                          }}
                        >
                          {app.candidate?.name?.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600} component="span">
                              {app.candidate?.name}
                            </Typography>
                            <Chip
                              label={app.status}
                              size="small"
                              color={getStatusColor(app.status)}
                              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }} component="span">
                            Applied for {app.job?.title} •{' '}
                            {app.appliedDate
                              ? new Date(app.appliedDate).toLocaleDateString()
                              : 'N/A'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Follow-ups */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <ScheduleIcon sx={{ color: 'warning.main', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Pending Follow-ups
                  </Typography>
                </Box>
                <Chip
                  label={pendingFollowUps.length}
                  color="warning"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Divider sx={{ mb: 0 }} />

              {pendingFollowUps.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography variant="body2" color="text.secondary">
                    No pending follow-ups
                  </Typography>
                </Box>
              ) : (
                <List sx={{ pt: 0 }}>
                  {pendingFollowUps.map((app) => (
                    <ListItem
                      key={app.id}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 1.5,
                        px: 2,
                        py: 1.5,
                        mb: 0.5,
                        transition: 'background-color 0.2s',
                      }}
                      onClick={() => navigate(`/applications/${app.id}`)}
                    >
                      <ListItemIcon sx={{ minWidth: 48 }}>
                        <NotificationsIcon
                          color="warning"
                          sx={{ fontSize: 28 }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight={600} mb={0.5} component="span">
                            {app.candidate?.name} - {app.job?.title}
                          </Typography>
                        }
                        secondary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Chip
                              label={app.status}
                              size="small"
                              color={getStatusColor(app.status)}
                              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 500 }}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }} component="span">
                              Requires attention
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Open Positions */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Box display="flex" alignItems="center" gap={1}>
                  <WorkIcon sx={{ color: 'secondary.main', fontSize: 24 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Open Positions
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => navigate('/jobs')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                  }}
                >
                  View All Jobs
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {recentJobs.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <Typography variant="body2" color="text.secondary">
                    No open positions at the moment
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {recentJobs.map((job) => (
                    <Paper
                      key={job.id}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1.5,
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: 2,
                          borderColor: 'primary.main',
                          bgcolor: 'action.hover',
                        },
                        transition: 'all 0.2s ease',
                      }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {job.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          mb: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {job.company?.name}
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={0.5}>
                        <Chip
                          label={job.location}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                        <Chip
                          label={job.jobType?.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                        <Chip
                          label="OPEN"
                          size="small"
                          color="success"
                          sx={{ fontSize: '0.65rem', height: 20, fontWeight: 600 }}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
