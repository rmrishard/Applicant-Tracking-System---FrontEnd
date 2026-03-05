import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  ViewColumn as ViewColumnIcon,
} from '@mui/icons-material';
import { applicationsAPI, jobsAPI, candidatesAPI } from '../../services/api';

const statusOptions = [
  { value: 'SOURCED', label: 'Sourced' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'INTERVIEWING', label: 'Interviewing' },
  { value: 'OFFER', label: 'Offer' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'REJECTED', label: 'Rejected' },
];

const getStatusColor = (status) => {
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

const StatusSelect = ({ currentStatus, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e) => {
    onChange(e.target.value);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Chip
        label={currentStatus}
        color={getStatusColor(currentStatus)}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        sx={{
          fontSize: '0.75rem',
          fontWeight: 600,
          borderRadius: 1.5,
          cursor: 'pointer',
          '&:hover': { opacity: 0.8 }
        }}
      />
    );
  }

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select
        value={currentStatus}
        onChange={handleChange}
        autoFocus
        onBlur={() => setIsEditing(false)}
        onClick={(e) => e.stopPropagation()}
        sx={{
          borderRadius: 1.5,
          '& .MuiSelect-select': {
            py: 0.5,
            fontSize: '0.875rem',
          }
        }}
      >
        {statusOptions.map(opt => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const Applications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [formData, setFormData] = useState({
    jobId: '',
    candidateId: '',
    status: 'SOURCED',
    notes: '',
  });

  useEffect(() => {
    fetchApplications();
    fetchJobs();
    fetchCandidates();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.content || response.data.applications || []);
      setApplications(data);
      setError('');
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error fetching applications:', err);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await jobsAPI.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.content || response.data.jobs || []);
      setJobs(data.filter(job => job.status === 'OPEN'));
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setJobs([]);
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await candidatesAPI.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.content || response.data.candidates || []);
      setCandidates(data);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setCandidates([]);
    }
  };

  const handleOpenDialog = (application = null) => {
    if (application) {
      setEditingApplication(application);
      setFormData({
        jobId: application.job?.id || '',
        candidateId: application.candidate?.id || '',
        status: application.status,
        notes: application.notes || '',
      });
    } else {
      setEditingApplication(null);
      setFormData({
        jobId: '',
        candidateId: '',
        status: 'SOURCED',
        notes: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingApplication(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingApplication) {
        await applicationsAPI.update(editingApplication.id, formData);
      } else {
        await applicationsAPI.create(formData);
      }
      fetchApplications();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save application');
      console.error('Error saving application:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await applicationsAPI.delete(id);
        fetchApplications();
      } catch (err) {
        setError('Failed to delete application');
        console.error('Error deleting application:', err);
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await applicationsAPI.updateStatus(id, newStatus);
      fetchApplications();
    } catch (err) {
      setError('Failed to update status');
      console.error('Error updating status:', err);
    }
  };


  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job?.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
          mb: 4,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Applications
        </Typography>
        <Box display="flex" gap={1.5} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<ViewColumnIcon />}
            onClick={() => navigate('/applications/kanban')}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              px: 2.5,
            }}
          >
            Kanban View
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
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
            Add Application
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box p={3} display="flex" gap={2} flexWrap="wrap">
          <TextField
            fullWidth
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              flex: 1,
              minWidth: { xs: '100%', sm: 300 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="ALL">All Status</MenuItem>
              <MenuItem value="SOURCED">Sourced</MenuItem>
              <MenuItem value="CONTACTED">Contacted</MenuItem>
              <MenuItem value="INTERVIEWING">Interviewing</MenuItem>
              <MenuItem value="OFFER">Offer</MenuItem>
              <MenuItem value="NOT_INTERESTED">Not Interested</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Candidate</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Job Title</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Applied Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={6}>
                      <DescriptionIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1" color="text.secondary">
                        {searchTerm || statusFilter !== 'ALL'
                          ? 'No applications found'
                          : 'No applications yet. Add your first application!'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map((app) => (
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
                      <Typography variant="body2" fontWeight={600}>{app.candidate?.name || 'N/A'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.candidate?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{app.job?.title || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <StatusSelect
                        currentStatus={app.status}
                        onChange={(newStatus) => handleStatusChange(app.id, newStatus)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(app);
                        }}
                        sx={{
                          '&:hover': {
                            bgcolor: 'primary.lighter',
                          }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(app.id);
                        }}
                        sx={{
                          ml: 0.5,
                          '&:hover': {
                            bgcolor: 'error.lighter',
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 2, pt: 3, fontWeight: 600 }}>
            {editingApplication ? 'Edit Application' : 'Add New Application'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Candidate</InputLabel>
                  <Select
                    name="candidateId"
                    value={formData.candidateId}
                    label="Candidate"
                    onChange={handleChange}
                    disabled={!!editingApplication}
                  >
                    {candidates.map((candidate) => (
                      <MenuItem key={candidate.id} value={candidate.id}>
                        {candidate.name} - {candidate.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Job</InputLabel>
                  <Select
                    name="jobId"
                    value={formData.jobId}
                    label="Job"
                    onChange={handleChange}
                    disabled={!!editingApplication}
                  >
                    {jobs.map((job) => (
                      <MenuItem key={job.id} value={job.id}>
                        {job.title} - {job.company?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleChange}
                  >
                    {statusOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  placeholder="Add notes about this application..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={handleCloseDialog}
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
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                borderRadius: 2,
              }}
            >
              {editingApplication ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Applications;
