import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  AttachMoney as AttachMoneyIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { jobsAPI, applicationsAPI } from '../../services/api';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobData();
  }, [id]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        jobsAPI.getById(id),
        applicationsAPI.getAll(),
      ]);

      setJob(jobRes.data);
      // Filter applications for this job
      const appsData = Array.isArray(appsRes.data)
        ? appsRes.data
        : (appsRes.data.content || appsRes.data.applications || []);
      const jobApplications = appsData.filter(app => app.job?.id === parseInt(id));
      setApplications(jobApplications);
      setError('');
    } catch (err) {
      setError('Failed to load job details');
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${job.title}"?`)) {
      try {
        await jobsAPI.delete(id);
        navigate('/jobs');
      } catch (err) {
        setError('Failed to delete job');
        console.error('Error deleting job:', err);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'success';
      case 'ON_HOLD':
        return 'warning';
      case 'FILLED':
        return 'info';
      case 'CLOSED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'APPLIED':
        return 'info';
      case 'SCREENING':
        return 'primary';
      case 'INTERVIEW':
        return 'secondary';
      case 'OFFER':
        return 'success';
      case 'HIRED':
        return 'success';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateStats = () => {
    const total = applications.length;
    const hired = applications.filter(app => app.status === 'HIRED').length;
    const rejected = applications.filter(app => app.status === 'REJECTED').length;
    const inProgress = total - hired - rejected;

    return { total, hired, rejected, inProgress };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!job) {
    return (
      <Box>
        <Alert severity="error">Job not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/jobs')} sx={{ mt: 2 }}>
          Back to Jobs
        </Button>
      </Box>
    );
  }

  const stats = calculateStats();

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/jobs')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4">{job.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              Job Details
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button startIcon={<EditIcon />} onClick={() => navigate('/jobs')} sx={{ mr: 1 }}>
            Edit
          </Button>
          <Button
            startIcon={<DeleteIcon />}
            color="error"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Job Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Job Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <WorkIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Job Title
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">{job.title}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BusinessIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Company
                      </Typography>
                      <Typography variant="body1">{job.company?.name || 'N/A'}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <LocationOnIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <Typography variant="body1">{job.location}</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Job Type
                    </Typography>
                    <Typography variant="body1">{job.jobType?.replace('_', ' ')}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Box mt={0.5}>
                      <Chip label={job.status} color={getStatusColor(job.status)} size="small" />
                    </Box>
                  </Box>
                </Grid>

                {job.salaryRange && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <AttachMoneyIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Salary Range
                        </Typography>
                        <Typography variant="body1">{job.salaryRange}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {job.description && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="flex-start" gap={1} mb={2}>
                      <DescriptionIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Description
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                          {job.description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {job.requirements && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Requirements
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                      {job.requirements}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Statistics
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Total Applications
                </Typography>
                <Chip label={stats.total} color="primary" />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  In Progress
                </Typography>
                <Chip label={stats.inProgress} color="info" />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Hired
                </Typography>
                <Chip label={stats.hired} color="success" />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Rejected
                </Typography>
                <Chip label={stats.rejected} color="error" />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Applications List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Applications ({applications.length})
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/applications')}
                >
                  Add Application
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {applications.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No applications yet for this job
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Candidate</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Applied Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow
                          key={app.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/applications/${app.id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {app.candidate?.name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {app.candidate?.email || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={app.status}
                              size="small"
                              color={getApplicationStatusColor(app.status)}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default JobDetail;
