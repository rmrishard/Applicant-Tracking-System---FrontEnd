import { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  TableSortLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { candidatesAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const Candidates = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [experienceFilter, setExperienceFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
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

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await candidatesAPI.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.content || response.data.candidates || []);
      setCandidates(data);
      setError('');
    } catch (err) {
      setError('Failed to load candidates');
      console.error('Error fetching candidates:', err);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (candidate = null) => {
    if (candidate) {
      setEditingCandidate(candidate);
      // Split name into firstName and lastName for editing
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
    } else {
      setEditingCandidate(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        experience: '',
        skills: '',
        linkedInUrl: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCandidate(null);
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
      if (editingCandidate) {
        await candidatesAPI.update(editingCandidate.id, formData);
      } else {
        await candidatesAPI.create(formData);
      }
      fetchCandidates();
      handleCloseDialog();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to save candidate';
      setError(errorMsg);
      console.error('Error saving candidate:', err);
      console.error('Backend error:', err.response?.data);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this candidate?')) {
      try {
        await candidatesAPI.delete(id);
        fetchCandidates();
      } catch (err) {
        setError('Failed to delete candidate');
        console.error('Error deleting candidate:', err);
      }
    }
  };

  const getYearsOfExperience = (experienceStr) => {
    if (!experienceStr) return 0;
    const match = experienceStr.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
  };

  const filteredCandidates = candidates
    .filter((candidate) => {
      // Search filter
      const matchesSearch =
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.location?.toLowerCase().includes(searchTerm.toLowerCase());

      // Experience filter
      let matchesExperience = true;
      if (experienceFilter !== 'ALL') {
        const years = getYearsOfExperience(candidate.experience);
        switch (experienceFilter) {
          case 'ENTRY':
            matchesExperience = years >= 0 && years <= 2;
            break;
          case 'MID':
            matchesExperience = years >= 3 && years <= 5;
            break;
          case 'SENIOR':
            matchesExperience = years >= 6 && years <= 10;
            break;
          case 'EXPERT':
            matchesExperience = years > 10;
            break;
          default:
            matchesExperience = true;
        }
      }

      // Location filter
      const matchesLocation =
        !locationFilter ||
        candidate.location?.toLowerCase().includes(locationFilter.toLowerCase());

      return matchesSearch && matchesExperience && matchesLocation;
    })
    .sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'name':
          compareValue = a.name.localeCompare(b.name);
          break;
        case 'experience':
          compareValue = getYearsOfExperience(a.experience) - getYearsOfExperience(b.experience);
          break;
        case 'location':
          compareValue = (a.location || '').localeCompare(b.location || '');
          break;
        case 'email':
          compareValue = (a.email || '').localeCompare(b.email || '');
          break;
        default:
          compareValue = 0;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setExperienceFilter('ALL');
    setLocationFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

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
          Candidates
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
          Add Candidate
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
        <Box p={3}>
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            <TextField
              fullWidth
              placeholder="Search candidates by name, email, skills, or location..."
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
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
                px: 2.5,
              }}
            >
              Filters
            </Button>
          </Box>

          <Collapse in={showFilters}>
            <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Experience Level</InputLabel>
                    <Select
                      value={experienceFilter}
                      label="Experience Level"
                      onChange={(e) => setExperienceFilter(e.target.value)}
                    >
                      <MenuItem value="ALL">All Levels</MenuItem>
                      <MenuItem value="ENTRY">Entry Level (0-2 years)</MenuItem>
                      <MenuItem value="MID">Mid Level (3-5 years)</MenuItem>
                      <MenuItem value="SENIOR">Senior (6-10 years)</MenuItem>
                      <MenuItem value="EXPERT">Expert (10+ years)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    placeholder="Filter by location..."
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={sortBy}
                      label="Sort By"
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <MenuItem value="name">Name</MenuItem>
                      <MenuItem value="experience">Experience</MenuItem>
                      <MenuItem value="location">Location</MenuItem>
                      <MenuItem value="email">Email</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button size="small" onClick={clearFilters}>
                  Clear All Filters
                </Button>
              </Box>
            </Box>
          </Collapse>

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </Typography>
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => handleSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortBy === 'email'}
                    direction={sortBy === 'email' ? sortOrder : 'asc'}
                    onClick={() => handleSort('email')}
                  >
                    Contact
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortBy === 'location'}
                    direction={sortBy === 'location' ? sortOrder : 'asc'}
                    onClick={() => handleSort('location')}
                  >
                    Location
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortBy === 'experience'}
                    direction={sortBy === 'experience' ? sortOrder : 'asc'}
                    onClick={() => handleSort('experience')}
                  >
                    Experience
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Skills</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCandidates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={6}>
                      <PeopleIcon sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1" color="text.secondary">
                        {searchTerm
                          ? 'No candidates found'
                          : 'No candidates yet. Add your first candidate!'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCandidates.map((candidate) => (
                  <TableRow
                    key={candidate.id}
                    hover
                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <PeopleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={600}>{candidate.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                          <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2">{candidate.email}</Typography>
                        </Box>
                        {candidate.phone && (
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary">{candidate.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.location || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {candidate.experience || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {candidate.skills ? (
                        <Box display="flex" gap={0.5} flexWrap="wrap">
                          {candidate.skills.split(',').slice(0, 3).map((skill, index) => (
                            <Chip
                              key={index}
                              label={skill.trim()}
                              size="small"
                              sx={{ fontSize: '0.7rem', borderRadius: 1.5 }}
                            />
                          ))}
                          {candidate.skills.split(',').length > 3 && (
                            <Chip
                              label={`+${candidate.skills.split(',').length - 3}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', borderRadius: 1.5 }}
                            />
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                        sx={{ '&:hover': { bgcolor: 'info.lighter' } }}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDialog(candidate)}
                        sx={{ ml: 0.5, '&:hover': { bgcolor: 'primary.lighter' } }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(candidate.id)}
                        sx={{ ml: 0.5, '&:hover': { bgcolor: 'error.lighter' } }}
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
        maxWidth="md"
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
            {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
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
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="City, State"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Years of Experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g., 5 years"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Skills"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
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
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
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
              {editingCandidate ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Candidates;
