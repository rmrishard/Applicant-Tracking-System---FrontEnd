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
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { jobsAPI, companiesAPI, usersAPI } from '../../services/api';

const Jobs = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [assignedToFilter, setAssignedToFilter] = useState('ALL');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
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

  useEffect(() => {
    fetchJobs();
    fetchCompanies();
    fetchUsers();
  }, [currentUser]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.content || response.data.jobs || []);
      setJobs(data);
      setError('');
    } catch (err) {
      setError('Failed to load jobs');
      console.error('Error fetching jobs:', err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companiesAPI.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.content || response.data.companies || []);
      setCompanies(data);
    } catch (err) {
      console.error('Error fetching companies:', err);
      setCompanies([]);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log('Fetching all users...');
      const response = await usersAPI.getAll();
      let data = [];

      // Extract data based on different possible structures
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data && response.data.content) {
        data = response.data.content;
      } else if (response.data && response.data.users) {
        data = response.data.users;
      } else if (response.data && typeof response.data === 'object') {
        // Handle cases where the data might be nested inside the transform output
        data = response.data.content || response.data.users || [];
      }

      console.log(`Fetched ${data.length} users successfully.`);

      // De-duplicate and ensure current user is present
      const userMap = new Map();
      data.forEach(user => user && user.id && userMap.set(String(user.id), user));
      if (currentUser && currentUser.id) {
        userMap.set(String(currentUser.id), currentUser);
      }

      const finalUsers = Array.from(userMap.values());
      setUsers(finalUsers);
    } catch (err) {
      console.error('Error fetching all users, trying by-role fallback:', err);
      try {
        const [recruitersRes, adminsRes] = await Promise.allSettled([
          usersAPI.getByRole('RECRUITER'),
          usersAPI.getByRole('ADMIN'),
        ]);

        const userMap = new Map();

        [recruitersRes, adminsRes].forEach(res => {
          if (res.status === 'fulfilled' && res.value?.data) {
            const list = Array.isArray(res.value.data) ? res.value.data : [];
            list.forEach(user => user && user.id && userMap.set(String(user.id), user));
          }
        });

        if (currentUser && currentUser.id) {
          userMap.set(String(currentUser.id), currentUser);
        }

        const unique = Array.from(userMap.values());
        setUsers(unique.length > 0 ? unique : (currentUser ? [currentUser] : []));
      } catch (fallbackErr) {
        console.error('Fallback user fetch also failed:', fallbackErr);
        setUsers(currentUser ? [currentUser] : []);
      }
    }
  };


  const handleOpenDialog = (job = null) => {
    if (job) {
      setEditingJob(job);
      setFormData({
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
    } else {
      setEditingJob(null);
      setFormData({
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
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingJob(null);
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
      if (editingJob) {
        await jobsAPI.update(editingJob.id, formData);
      } else {
        await jobsAPI.create(formData);
      }
      fetchJobs();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save job');
      console.error('Error saving job:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await jobsAPI.delete(id);
        fetchJobs();
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
        return 'error';
      case 'CLOSED':
        return 'default';
      default:
        return 'default';
    }
  };

  const getJobTypeLabel = (type) => {
    return type?.replace('_', ' ') || '';
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || job.status === statusFilter;

    const matchesAssignedTo =
      assignedToFilter === 'ALL' ||
      (assignedToFilter === 'UNASSIGNED' && !job.assignedRecruiter) ||
      (job.assignedRecruiter?.id === parseInt(assignedToFilter));

    return matchesSearch && matchesStatus && matchesAssignedTo;
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
          Jobs
        </Typography>
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
          Add Job
        </Button>
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
            placeholder="Search jobs..."
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
              <MenuItem value="OPEN">Open</MenuItem>
              <MenuItem value="ON_HOLD">On Hold</MenuItem>
              <MenuItem value="FILLED">Filled</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Assigned To</InputLabel>
            <Select
              value={assignedToFilter}
              label="Assigned To"
              onChange={(e) => setAssignedToFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="ALL">All Users</MenuItem>
              <MenuItem value="UNASSIGNED">Unassigned</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={String(u.id)}>
                  {u.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Job Title</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Added By</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Assigned To</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box py={6} display="flex" flexDirection="column" alignItems="center">
                      <WorkIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm || statusFilter !== 'ALL' ? 'No jobs found' : 'No jobs yet'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={searchTerm || statusFilter !== 'ALL' ? 3 : 0}>
                        {searchTerm || statusFilter !== 'ALL' ? "We couldn't find any jobs matching your filters." : 'Add your first job to get started!'}
                      </Typography>
                      {(searchTerm || statusFilter !== 'ALL') && (
                        <Button
                          variant="outlined"
                          onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('ALL');
                            setAssignedToFilter('ALL');
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredJobs.map((job) => (
                  <TableRow
                    key={job.id}
                    hover
                    sx={{
                      cursor: 'pointer',
                      '&:nth-of-type(odd)': {
                        bgcolor: 'background.default',
                      },
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <WorkIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={600}>{job.title}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{job.company?.name || 'N/A'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">{job.location}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getJobTypeLabel(job.jobType)}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {job.createdBy?.name || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {job.assignedRecruiter?.name || 'Unassigned'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        size="small"
                        color={getStatusColor(job.status)}
                        sx={{ fontSize: '0.75rem', fontWeight: 600, borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Tooltip title="Edit Job" placement="top">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenDialog(job)}
                            sx={{
                              '&:hover': {
                                bgcolor: 'primary.lighter',
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Job" placement="top">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(job.id)}
                            sx={{
                              '&:hover': {
                                bgcolor: 'error.lighter',
                              }
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
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
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ pb: 2, pt: 3, fontWeight: 600 }}>
            {editingJob ? 'Edit Job' : 'Add New Job'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleChange}
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
                  <InputLabel>Job Type</InputLabel>
                  <Select
                    name="jobType"
                    value={formData.jobType}
                    label="Job Type"
                    onChange={handleChange}
                  >
                    <MenuItem value="FULL_TIME">Full Time</MenuItem>
                    <MenuItem value="PART_TIME">Part Time</MenuItem>
                    <MenuItem value="CONTRACT">Contract</MenuItem>
                    <MenuItem value="INTERNSHIP">Internship</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth required>
                  <InputLabel>Company</InputLabel>
                  <Select
                    name="companyId"
                    value={formData.companyId}
                    label="Company"
                    onChange={handleChange}
                  >
                    {companies.map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary Range"
                  name="salaryRange"
                  value={formData.salaryRange}
                  onChange={handleChange}
                  placeholder="e.g., $60k - $80k"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Assign Recruiter</InputLabel>
                  <Select
                    name="recruiterId"
                    value={formData.recruiterId}
                    label="Assign Recruiter"
                    onChange={handleChange}
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Job Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  placeholder="List the key requirements..."
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
              {editingJob ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Jobs;
