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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Paper,
  Stack,
  Avatar,
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
  Person as PersonIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon,
  AttachFile as AttachFileIcon,
} from '@mui/icons-material';
import { jobsAPI, applicationsAPI, candidatesAPI, companiesAPI, usersAPI } from '../../services/api';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0); // 0 for existing, 1 for new
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    skills: '',
    linkedInUrl: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    salaryRange: '',
    jobType: 'FULL_TIME',
    status: 'OPEN',
    companyId: '',
    recruiterId: '',
  });

  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'SOURCED', label: 'Sourced' },
    { value: 'CONTACTED', label: 'Contacted' },
    { value: 'INTERVIEWING', label: 'Interviewing' },
    { value: 'OFFER', label: 'Offer' },
    { value: 'NOT_INTERESTED', label: 'Not Interested' },
    { value: 'REJECTED', label: 'Rejected' },
  ];

  useEffect(() => {
    fetchJobData();
  }, [id]);

  const fetchJobData = async () => {
    try {
      setLoading(true);
      const [jobRes, appsRes, candidatesRes, companiesRes, usersRes] = await Promise.all([
        jobsAPI.getById(id),
        applicationsAPI.getAll(),
        candidatesAPI.getAll(),
        companiesAPI.getAll(),
        usersAPI.getAll(),
      ]);

      setJob(jobRes.data);
      // Filter applications for this job
      const appsData = Array.isArray(appsRes.data)
        ? appsRes.data
        : (appsRes.data.content || appsRes.data.applications || []);
      const jobApplications = appsData.filter(app => app.job?.id === parseInt(id));
      setApplications(jobApplications);

      // Set candidates for dropdown
      const candidatesData = Array.isArray(candidatesRes.data)
        ? candidatesRes.data
        : (candidatesRes.data.content || candidatesRes.data.candidates || []);
      setCandidates(candidatesData);

      // Set companies for edit dropdown
      const compsData = Array.isArray(companiesRes.data)
        ? companiesRes.data
        : (companiesRes.data.content || companiesRes.data.companies || []);
      setCompanies(compsData);

      // Set users (simplified fetch for recruiter dropdown)
      const usersData = Array.isArray(usersRes.data)
        ? usersRes.data
        : (usersRes.data.content || usersRes.data.users || []);
      setUsers(usersData);

      setError('');
    } catch (err) {
      setError('Failed to load job details');
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setTabValue(1);
    setSelectedCandidateId('');
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      location: '',
      experience: '',
      skills: '',
      linkedInUrl: '',
      notes: '',
    });
  };

  const handleCloseDialog = () => {
    if (saving) return;
    setOpenDialog(false);
  };

  const handleOpenEditDialog = () => {
    if (!job) return;
    setJobFormData({
      title: job.title,
      description: job.description,
      requirements: job.requirements || '',
      location: job.location,
      salaryRange: job.salaryRange || '',
      jobType: job.jobType,
      status: job.status,
      companyId: String(job.company?.id || ''),
      recruiterId: String(job.assignedRecruiter?.id || ''),
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleJobFormChange = (e) => {
    setJobFormData({
      ...jobFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleJobUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await jobsAPI.update(id, jobFormData);
      await fetchJobData();
      handleCloseEditDialog();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update job';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      let candidateId = selectedCandidateId;

      // If adding new candidate
      if (tabValue === 1) {
        const finalEmail = (!formData.email || formData.email.trim() === '') 
          ? `noemail_${Date.now()}@ats.com` 
          : formData.email;

        const candidateRes = await candidatesAPI.create({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: finalEmail,
          phone: formData.phone,
          location: formData.location,
          experience: formData.experience,
          skills: formData.skills,
          linkedInUrl: formData.linkedInUrl,
        });
        candidateId = candidateRes.data.id;
      }

      if (!candidateId) {
        throw new Error('Please select or create a candidate');
      }

      // Create application
      await applicationsAPI.create({
        jobId: parseInt(id),
        candidateId: candidateId,
        status: 'SOURCED',
        notes: formData.notes,
      });

      await fetchJobData();
      handleCloseDialog();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to add applicant';
      setError(errorMsg);
    } finally {
      setSaving(false);
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

  const getFileUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBaseUrl}${cleanPath}`;
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      await jobsAPI.uploadAttachments(id, files);
      await fetchJobData();
    } catch (err) {
      setError('Failed to upload files');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this attachment?')) return;
    try {
      setSaving(true);
      await jobsAPI.deleteAttachment(attachmentId);
      await fetchJobData();
    } catch (err) {
      setError('Failed to delete attachment');
    } finally {
      setSaving(false);
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

  const getJobTypeLabel = (type) => {
    return type?.replace('_', ' ') || '';
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'SOURCED':
        return 'info';
      case 'CONTACTED':
        return 'primary';
      case 'INTERVIEWING':
        return 'secondary';
      case 'OFFER':
        return 'success';
      case 'NOT_INTERESTED':
        return 'error';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateStats = () => {
    const total = applications.length;
    const offer = applications.filter(app => app.status === 'OFFER').length;
    const rejected = applications.filter(app => app.status === 'REJECTED' || app.status === 'NOT_INTERESTED').length;
    const inProgress = total - offer - rejected;

    return { total, offer, rejected, inProgress };
  };

  const filteredApplications = applications.filter(app =>
    statusFilter === 'ALL' || app.status === statusFilter
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!job) {
    return (
      <Box p={3}>
        <Alert severity="error">Job not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/jobs')} sx={{ mt: 2 }}>
          Back to Jobs
        </Button>
      </Box>
    );
  }

  const stats = calculateStats();

  return (
    <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 }, py: 3 }}>
      {/* Navigation & Header Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/jobs')}
          sx={{
            textTransform: 'none',
            color: 'text.secondary',
            fontWeight: 500,
            '&:hover': { color: 'primary.main', bgcolor: 'transparent' }
          }}
        >
          Back to Jobs
        </Button>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<EditIcon />}
            onClick={handleOpenEditDialog}
            sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
          >
            Delete
          </Button>
          <Button
            variant="contained"
            size="medium"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              fontWeight: 600
            }}
          >
            Add Applicant
          </Button>
        </Stack>
      </Box>

      {/* Main Grid */}
      <Grid container spacing={4}>
        {/* Left Column (Job Details) */}
        <Grid item xs={12} lg={8.5}>
          <Box mb={4}>
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.03em' }}>
                {job.title}
              </Typography>
              <Chip
                label={job.status}
                color={getStatusColor(job.status)}
                sx={{
                  fontWeight: 700,
                  borderRadius: 1.5,
                  height: 28,
                  fontSize: '0.75rem',
                  px: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              />
            </Box>
            <Typography variant="h5" color="text.secondary" sx={{ fontWeight: 400, opacity: 0.8 }}>
              {job.company?.name || 'Unknown Company'}
            </Typography>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              mb: 4,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}
          >
            <Grid container spacing={4}>
              <Grid item xs={6} sm={3}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)', color: 'primary.main', width: 40, height: 40 }}>
                    <WorkIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>TYPE</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{getJobTypeLabel(job.jobType)}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'rgba(46, 125, 50, 0.08)', color: 'success.main', width: 40, height: 40 }}>
                    <AttachMoneyIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>SALARY</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{job.salaryRange || 'Disclosed'}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'rgba(237, 108, 2, 0.08)', color: 'warning.main', width: 40, height: 40 }}>
                    <LocationOnIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>LOCATION</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{job.location || 'Remote'}</Typography>
                  </Box>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: 'rgba(211, 47, 47, 0.08)', color: 'error.main', width: 40, height: 40 }}>
                    <DescriptionIcon fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>POSTED</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          <Stack spacing={4}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                Job Description
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  fontSize: '1rem',
                  maxWidth: '100%'
                }}
              >
                {job.description}
              </Typography>
            </Box>

            {job.requirements && (
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
                  Requirements
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: 'text.secondary',
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    fontSize: '1rem',
                    maxWidth: '100%'
                  }}
                >
                  {job.requirements}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 1, opacity: 0.5 }} />
            
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Job Attachments
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                  disabled={uploading}
                  size="small"
                  sx={{ borderRadius: 2, textTransform: 'none', px: 2 }}
                >
                  {uploading ? 'Uploading...' : 'Upload Files'}
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileChange}
                  />
                </Button>
              </Box>
              
              {job.attachments && job.attachments.length > 0 ? (
                <Grid container spacing={2}>
                  {job.attachments.map((file) => (
                    <Grid item xs={12} sm={6} key={file.id}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderRadius: 3,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'background.paper',
                          transition: 'all 0.2s',
                          '&:hover': { 
                            bgcolor: 'rgba(0,0,0,0.01)',
                            borderColor: 'primary.light',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                          }
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                          <Avatar sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)', color: 'primary.main', width: 36, height: 36 }}>
                            <AttachFileIcon sx={{ fontSize: 20 }} />
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {file.fileName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {(file.fileSize / 1024).toFixed(1)} KB
                            </Typography>
                          </Box>
                        </Box>
                        <Stack direction="row" spacing={0.5}>
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => window.open(getFileUrl(file.fileUrl), '_blank')}
                            title="View File"
                          >
                            <DescriptionIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleDeleteAttachment(file.id)}
                            title="Delete File"
                          >
                            <DeleteIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ py: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3, bgcolor: 'rgba(0,0,0,0.01)' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', opacity: 0.7 }}>
                    No attachments uploaded for this job yet.
                  </Typography>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 1, opacity: 0.5 }} />

            <Box pt={2}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Applications ({filteredApplications.length})
                </Typography>
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>Status Filter</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    {statusOptions.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden'
                }}
              >
                {applications.length === 0 ? (
                  <Box textAlign="center" py={8} px={3}>
                    <DescriptionIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3, mb: 2 }} />
                    <Typography color="text.secondary" variant="body1" sx={{ fontStyle: 'italic' }}>
                      No applications have been received for this role yet.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>CANDIDATE</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>STATUS</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>APPLIED DATE</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.secondary' }}>ACTION</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredApplications.map((app) => (
                          <TableRow
                            key={app.id}
                            hover
                            sx={{
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.01)' }
                            }}
                            onClick={() => navigate(`/applications/${app.id}`)}
                          >
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Avatar
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    bgcolor: 'primary.main',
                                    color: 'white'
                                  }}
                                >
                                  {app.candidate?.name?.charAt(0) || '?'}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    {app.candidate?.name || 'N/A'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {app.candidate?.email || 'N/A'}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={app.status}
                                size="small"
                                variant="outlined"
                                color={getApplicationStatusColor(app.status)}
                                sx={{ fontWeight: 700, fontSize: '0.65rem', borderRadius: 1 }}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" color="primary">
                                <ArrowBackIcon sx={{ transform: 'rotate(180deg)', fontSize: 18 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Box>
          </Stack>
        </Grid>

        {/* Right Column (Sidebar) */}
        <Grid item xs={12} lg={3.5}>
          <Stack spacing={4}>
            {/* Performance Card */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 5,
                bgcolor: 'primary.dark',
                color: 'white',
                boxShadow: '0 8px 24px rgba(25, 118, 210, 0.2)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Application Funnel</Typography>
                <Stack spacing={2.5}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Applicants</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{stats.total}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Qualified / In Pipeline</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{stats.inProgress}</Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 700 }}>Offer Extended</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 900, color: '#4caf50' }}>{stats.offer}</Typography>
                  </Box>
                </Stack>
              </Box>
              {/* Decorative Circle */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.05)',
                }}
              />
            </Paper>

            {/* Hiring Team */}
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', mb: 3 }}>
                Hiring Team
              </Typography>
              <Stack spacing={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'rgba(2, 136, 209, 0.1)', color: 'info.main' }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>Assigned Recruiter</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {job.assignedRecruiter?.name || 'Unassigned'}
                    </Typography>
                  </Box>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', color: 'secondary.main' }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontWeight: 600 }}>Job Owner</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {job.createdBy?.name || 'System'}
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>

            {/* Timestamps */}
            <Box px={1}>
              <Typography variant="caption" display="block" color="text.disabled" sx={{ mb: 0.5 }}>
                Created: {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
              </Typography>
              <Typography variant="caption" display="block" color="text.disabled">
                Last Updated: {job.updatedAt ? new Date(job.updatedAt).toLocaleString() : 'N/A'}
              </Typography>
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Add Applicant Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 1, fontWeight: 800, fontSize: '1.5rem' }}>Add Applicant</DialogTitle>
          <Box sx={{ px: 2, mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{
                '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: '0.95rem' }
              }}
            >
              <Tab label="Existing Candidate" />
              <Tab label="New Candidate" />
            </Tabs>
          </Box>
          <DialogContent sx={{ pt: 1 }}>
            {tabValue === 0 ? (
              <Box py={1}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Candidate</InputLabel>
                  <Select
                    value={selectedCandidateId}
                    label="Select Candidate"
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    required={tabValue === 0}
                    sx={{ borderRadius: 2.5 }}
                  >
                    {candidates.map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </MenuItem>
                    ))}
                    {candidates.length === 0 && (
                      <MenuItem disabled>No candidates found. Create a new one!</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
            ) : (
              <Box py={1}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleFormChange}
                      required={tabValue === 1}
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleFormChange}
                      required={tabValue === 1}
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Experience"
                      name="experience"
                      value={formData.experience}
                      onChange={handleFormChange}
                      placeholder="e.g. 5y"
                      size="small"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            <TextField
              fullWidth
              label="Application Notes"
              name="notes"
              value={formData.notes}
              onChange={handleFormChange}
              multiline
              rows={2}
              sx={{ mt: tabValue === 0 ? 0 : 2, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
              size="small"
              placeholder="Internal notes about the candidate..."
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={handleCloseDialog} disabled={saving} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
              sx={{ borderRadius: 2.5, textTransform: 'none', px: 4, fontWeight: 700 }}
            >
              {saving ? 'Processing...' : 'Add to Job'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Job Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 1 } }}
      >
        <form onSubmit={handleJobUpdate}>
          <DialogTitle sx={{ pb: 1, fontWeight: 800, fontSize: '1.5rem' }}>Edit Job</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Job Title"
                    name="title"
                    value={jobFormData.title}
                    onChange={handleJobFormChange}
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      value={jobFormData.status}
                      label="Status"
                      onChange={handleJobFormChange}
                      sx={{ borderRadius: 2.5 }}
                    >
                      <MenuItem value="OPEN">Open</MenuItem>
                      <MenuItem value="ON_HOLD">On Hold</MenuItem>
                      <MenuItem value="FILLED">Filled</MenuItem>
                      <MenuItem value="CLOSED">Closed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Company</InputLabel>
                    <Select
                      name="companyId"
                      value={jobFormData.companyId}
                      label="Company"
                      onChange={handleJobFormChange}
                      sx={{ borderRadius: 2.5 }}
                    >
                      {companies.map((company) => (
                        <MenuItem key={company.id} value={String(company.id)}>
                          {company.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Assign Recruiter</InputLabel>
                    <Select
                      name="recruiterId"
                      value={jobFormData.recruiterId}
                      label="Assign Recruiter"
                      onChange={handleJobFormChange}
                      sx={{ borderRadius: 2.5 }}
                    >
                      <MenuItem value="">Unassigned</MenuItem>
                      {users.map((user) => (
                        <MenuItem key={user.id} value={String(user.id)}>
                          {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()} ({user.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Logistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Job Type</InputLabel>
                    <Select
                      name="jobType"
                      value={jobFormData.jobType}
                      label="Job Type"
                      onChange={handleJobFormChange}
                      sx={{ borderRadius: 2.5 }}
                    >
                      <MenuItem value="FULL_TIME">Full Time</MenuItem>
                      <MenuItem value="PART_TIME">Part Time</MenuItem>
                      <MenuItem value="CONTRACT">Contract</MenuItem>
                      <MenuItem value="INTERNSHIP">Internship</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Location"
                    name="location"
                    value={jobFormData.location}
                    onChange={handleJobFormChange}
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Salary Range"
                    name="salaryRange"
                    value={jobFormData.salaryRange}
                    onChange={handleJobFormChange}
                    placeholder="e.g., $60k - $80k"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', mb: 2, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Description & Requirements
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Job Description"
                    name="description"
                    value={jobFormData.description}
                    onChange={handleJobFormChange}
                    multiline
                    rows={4}
                    required
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Requirements"
                    name="requirements"
                    value={jobFormData.requirements}
                    onChange={handleJobFormChange}
                    multiline
                    rows={4}
                    placeholder="List the key requirements..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
            <Button onClick={handleCloseEditDialog} disabled={saving} color="inherit" sx={{ fontWeight: 600, textTransform: 'none' }}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <EditIcon />}
              sx={{ borderRadius: 2.5, textTransform: 'none', px: 4, fontWeight: 700, boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)' }}
            >
              {saving ? 'Updating...' : 'Update Job'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );

};

export default JobDetail;
