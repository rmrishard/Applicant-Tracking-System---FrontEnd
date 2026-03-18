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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationOnIcon,
  Work as WorkIcon,
  LinkedIn as LinkedInIcon,
  Description as DescriptionIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { candidatesAPI, applicationsAPI } from '../../services/api';

const CandidateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openResumeDialog, setOpenResumeDialog] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    experience: '',
    skills: '',
    linkedInUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const getResumeUrl = (path) => {
    if (!path) return '#';
    if (path.startsWith('http')) return path;
    
    const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    
    try {
      // If baseUrl is just a path like '/', URL constructor might need origin
      const absoluteBase = baseUrl.startsWith('http') 
        ? baseUrl 
        : new URL(baseUrl, window.location.origin).toString();
        
      const url = new URL(path, absoluteBase);
      return url.toString();
    } catch (e) {
      console.error('Error constructing resume URL:', e);
      return path;
    }
  };

  useEffect(() => {
    fetchCandidateData();
  }, [id]);

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      const [candidateRes, appsRes] = await Promise.all([
        candidatesAPI.getById(id),
        applicationsAPI.getAll(),
      ]);

      setCandidate(candidateRes.data);
      // Filter applications for this candidate
      const appsData = Array.isArray(appsRes.data)
        ? appsRes.data
        : (appsRes.data.content || appsRes.data.applications || []);
      const candidateApplications = appsData.filter(
        (app) => app.candidate?.id === parseInt(id)
      );
      setApplications(candidateApplications);
      setError('');
    } catch (err) {
      setError('Failed to load candidate details');
      console.error('Error fetching candidate:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${candidate.name}"?`)) {
      try {
        await candidatesAPI.delete(id);
        navigate('/candidates');
      } catch (err) {
        setError('Failed to delete candidate');
        console.error('Error deleting candidate:', err);
      }
    }
  };

  const handleResumeUpload = async () => {
    if (!resumeFile) return;

    try {
      setUploading(true);
      await candidatesAPI.uploadResume(id, resumeFile);
      setOpenResumeDialog(false);
      setResumeFile(null);
      fetchCandidateData();
      setError('');
    } catch (err) {
      setError('Failed to upload resume');
      console.error('Error uploading resume:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEditDialog = () => {
    if (!candidate) return;
    // Split name into firstName and lastName
    const nameParts = candidate.name?.trim().split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    setFormData({
      firstName: firstName,
      lastName: lastName,
      email: candidate.email,
      phone: candidate.phone || '',
      location: candidate.location || '',
      experience: candidate.experience || '',
      skills: candidate.skills || '',
      linkedInUrl: candidate.linkedInUrl || '',
    });
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await candidatesAPI.update(id, formData);
      await fetchCandidateData();
      handleCloseEditDialog();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update candidate';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const getApplicationStatusColor = (status) => {
    switch (status) {
      case 'SOURCED':
        return 'info';
      case 'CONTACTED':
        return 'primary';
      case 'INTERVIEWING':
        return 'warning';
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
    const active = applications.filter(
      (app) => !['OFFER', 'REJECTED', 'NOT_INTERESTED'].includes(app.status)
    ).length;
    const offer = applications.filter((app) => app.status === 'OFFER').length;
    const rejected = applications.filter((app) => app.status === 'REJECTED' || app.status === 'NOT_INTERESTED').length;

    return { total, active, offer, rejected };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!candidate) {
    return (
      <Box>
        <Alert severity="error">Candidate not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/candidates')}
          sx={{ mt: 2 }}
        >
          Back to Candidates
        </Button>
      </Box>
    );
  }

  const stats = calculateStats();

  return (
    <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 3,
          mb: 4,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton
            onClick={() => navigate('/candidates')}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {candidate.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Candidate Profile
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenResumeDialog(true)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Upload Resume
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleOpenEditDialog}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Candidate Information */}
        <Grid item xs={12} md={8}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Candidate Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={4}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <EmailIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>{candidate.email}</Typography>
                    </Box>
                  </Box>
                </Grid>

                {candidate.phone && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <PhoneIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Phone
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>{candidate.phone}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {candidate.location && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <LocationOnIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Location
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>{candidate.location}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {candidate.experience && (
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <WorkIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Experience
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>{candidate.experience}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {candidate.linkedInUrl && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <LinkedInIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          LinkedIn Profile
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          <a
                            href={candidate.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'inherit', wordBreak: 'break-all' }}
                          >
                            {candidate.linkedInUrl}
                          </a>
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {candidate.skills && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 2 }}>
                      Skills
                    </Typography>
                    <Box display="flex" gap={1.5} flexWrap="wrap">
                      {candidate.skills.split(',').map((skill, index) => (
                        <Chip
                          key={index}
                          label={skill.trim()}
                          color="primary"
                          sx={{
                            borderRadius: 1.5,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            px: 1,
                          }}
                        />
                      ))}
                    </Box>
                  </Grid>
                )}

                {candidate.resumePath && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <DescriptionIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Resume
                        </Typography>
                        <Box display="flex" gap={2} mt={0.5}>
                            <Button
                            variant="text"
                            component="a"
                            href={getResumeUrl(candidate.resumePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              p: 0,
                              textTransform: 'none',
                              color: 'primary.main',
                              textDecoration: 'underline',
                              '&:hover': { textDecoration: 'none', bgcolor: 'transparent' },
                              minWidth: 'auto',
                            }}
                          >
                            View Resume
                          </Button>
                          <Typography variant="body2" color="text.secondary">|</Typography>
                          <Button
                            variant="text"
                            component="a"
                            href={getResumeUrl(candidate.resumePath)}
                            download
                            sx={{
                              p: 0,
                              textTransform: 'none',
                              color: 'primary.main',
                              textDecoration: 'underline',
                              '&:hover': { textDecoration: 'none', bgcolor: 'transparent' },
                              minWidth: 'auto',
                            }}
                          >
                            Download Resume
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics */}
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
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                Application Statistics
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Total Applications
                </Typography>
                <Chip
                  label={stats.total}
                  color="primary"
                  sx={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 45 }}
                />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Active
                </Typography>
                <Chip
                  label={stats.active}
                  color="info"
                  sx={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 45 }}
                />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Offer
                </Typography>
                <Chip
                  label={stats.offer}
                  color="success"
                  sx={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 45 }}
                />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  Rejected
                </Typography>
                <Chip
                  label={stats.rejected}
                  color="error"
                  sx={{ fontSize: '0.875rem', fontWeight: 600, minWidth: 45 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Applications List */}
        <Grid item xs={12}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Application History ({applications.length})
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/applications')}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 3,
                  }}
                >
                  Add Application
                </Button>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {applications.length === 0 ? (
                <Box textAlign="center" py={6}>
                  <DescriptionIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                  <Typography variant="body1" color="text.secondary">
                    No applications yet for this candidate
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.default' }}>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Job Title</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Company</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Applied Date</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Notes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {applications.map((app) => (
                        <TableRow
                          key={app.id}
                          hover
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'action.hover',
                            },
                            transition: 'background-color 0.2s',
                          }}
                          onClick={() => navigate(`/applications/${app.id}`)}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {app.job?.title || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {app.job?.company?.name || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {app.appliedDate
                                ? new Date(app.appliedDate).toLocaleDateString()
                                : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={app.status}
                              size="small"
                              color={getApplicationStatusColor(app.status)}
                              sx={{ fontSize: '0.75rem', fontWeight: 600, borderRadius: 1.5 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                              {app.notes
                                ? app.notes.length > 50
                                  ? `${app.notes.substring(0, 50)}...`
                                  : app.notes
                                : 'No notes'}
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

      {/* Edit Candidate Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <form onSubmit={handleUpdate}>
          <DialogTitle sx={{ pb: 2, pt: 3, fontWeight: 600 }}>
            Edit Candidate
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  placeholder="+1234567890"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleFormChange}
                  placeholder="City, State"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Years of Experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleFormChange}
                  placeholder="e.g., 5 years"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleFormChange}
                  placeholder="JavaScript, React, Node.js, etc."
                  helperText="Separate skills with commas"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="LinkedIn Profile URL"
                  name="linkedInUrl"
                  value={formData.linkedInUrl}
                  onChange={handleFormChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={handleCloseEditDialog}
              disabled={saving}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : <EditIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                borderRadius: 2,
              }}
            >
              {saving ? 'Updating...' : 'Update'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Resume Upload Dialog */}
      <Dialog
        open={openResumeDialog}
        onClose={() => setOpenResumeDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ pb: 2, fontWeight: 600 }}>Upload Resume</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <input
              accept=".pdf,.doc,.docx"
              style={{ display: 'none' }}
              id="resume-file-input"
              type="file"
              onChange={(e) => setResumeFile(e.target.files[0])}
            />
            <label htmlFor="resume-file-input">
              <Button variant="outlined" component="span" fullWidth>
                Choose File
              </Button>
            </label>
            {resumeFile && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Selected: {resumeFile.name}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpenResumeDialog(false)}
            disabled={uploading}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleResumeUpload}
            variant="contained"
            disabled={!resumeFile || uploading}
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              px: 3,
              borderRadius: 2,
            }}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateDetail;
