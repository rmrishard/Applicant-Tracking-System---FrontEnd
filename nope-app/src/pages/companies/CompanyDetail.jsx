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
  Language as LanguageIcon,
  LocationOn as LocationOnIcon,
  Business as BusinessIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { companiesAPI, jobsAPI } from '../../services/api';

const CompanyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    industry: '',
    location: '',
    website: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCompanyData();
  }, [id]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const [companyRes, jobsRes] = await Promise.all([
        companiesAPI.getById(id),
        jobsAPI.getAll(),
      ]);

      setCompany(companyRes.data);
      // Filter jobs for this company
      const jobsData = Array.isArray(jobsRes.data)
        ? jobsRes.data
        : (jobsRes.data.content || jobsRes.data.jobs || []);
      const companyJobs = jobsData.filter(job => job.company?.id === parseInt(id));
      setJobs(companyJobs);
      setError('');
    } catch (err) {
      setError('Failed to load company details');
      console.error('Error fetching company:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${company.name}"?`)) {
      try {
        await companiesAPI.delete(id);
        navigate('/companies');
      } catch (err) {
        setError('Failed to delete company');
        console.error('Error deleting company:', err);
      }
    }
  };

  const handleOpenEditDialog = () => {
    if (!company) return;
    setFormData({
      name: company.name,
      phone: company.phone || '',
      industry: company.industry,
      location: company.location,
      website: company.website || '',
      description: company.description || '',
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
      await companiesAPI.update(id, formData);
      await fetchCompanyData();
      handleCloseEditDialog();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update company';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!company) {
    return (
      <Box>
        <Alert severity="error">Company not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/companies')} sx={{ mt: 2 }}>
          Back to Companies
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/companies')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4">{company.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Company Details
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button startIcon={<EditIcon />} onClick={handleOpenEditDialog} sx={{ mr: 1 }}>
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
        {/* Company Information */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Company Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <BusinessIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Industry
                      </Typography>
                      <Typography variant="body1">{company.industry}</Typography>
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
                      <Typography variant="body1">{company.location}</Typography>
                    </Box>
                  </Box>
                </Grid>

                {company.website && (
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <LanguageIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Website
                        </Typography>
                        <Typography variant="body1">
                          <a href={company.website} target="_blank" rel="noopener noreferrer">
                            {company.website}
                          </a>
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                )}

                {company.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {company.description}
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
                Statistics
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Total Jobs
                </Typography>
                <Chip label={jobs.length} color="primary" />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Open Positions
                </Typography>
                <Chip
                  label={jobs.filter(j => j.status === 'OPEN').length}
                  color="success"
                />
              </Box>

              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Filled Positions
                </Typography>
                <Chip
                  label={jobs.filter(j => j.status === 'FILLED').length}
                  color="default"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Jobs List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Jobs ({jobs.length})
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/jobs')}
                >
                  Add Job
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {jobs.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <WorkIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography color="text.secondary">
                    No jobs posted yet for this company
                  </Typography>
                </Box>
              ) : (
                <List>
                  {jobs.map((job, index) => (
                    <ListItem
                      key={job.id}
                      divider={index < jobs.length - 1}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body1" fontWeight="medium">
                              {job.title}
                            </Typography>
                            <Chip
                              label={job.status}
                              size="small"
                              color={job.status === 'OPEN' ? 'success' : 'default'}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {job.location} • {job.jobType?.replace('_', ' ')}
                            {job.salaryRange && ` • ${job.salaryRange}`}
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
      </Grid>

      {/* Edit Company Dialog */}
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
            Edit Company
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
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
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleFormChange}
                  placeholder="https://example.com"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  multiline
                  rows={2}
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
    </Box>
  );
};

export default CompanyDetail;
