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
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { companiesAPI } from '../../services/api';

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    industry: '',
    location: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companiesAPI.getAll();
      // Handle both array and paginated response formats
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.content || response.data.companies || []);
      setCompanies(data);
      setError('');
    } catch (err) {
      setError('Failed to load companies');
      console.error('Error fetching companies:', err);
      setCompanies([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (company = null) => {
    if (company) {
      setEditingCompany(company);
      setFormData({
        name: company.name,
        phone: company.phone || '',
        industry: company.industry,
        location: company.location,
        website: company.website || '',
        description: company.description || '',
      });
    } else {
      setEditingCompany(null);
      setFormData({
        name: '',
        phone: '',
        industry: '',
        location: '',
        website: '',
        description: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCompany(null);
    setFormData({
      name: '',
      phone: '',
      industry: '',
      location: '',
      website: '',
      description: '',
    });
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
      if (editingCompany) {
        await companiesAPI.update(editingCompany.id, formData);
      } else {
        await companiesAPI.create(formData);
      }
      fetchCompanies();
      handleCloseDialog();
    } catch (err) {
      setError('Failed to save company');
      console.error('Error saving company:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await companiesAPI.delete(id);
        fetchCompanies();
      } catch (err) {
        setError('Failed to delete company');
        console.error('Error deleting company:', err);
      }
    }
  };

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.industry?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          Companies
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
          Add Company
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
          <TextField
            fullWidth
            placeholder="Search companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
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
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'background.default' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Industry</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Website</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Added By</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={6} display="flex" flexDirection="column" alignItems="center">
                      <BusinessIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        {searchTerm ? 'No companies found' : 'No companies yet'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mb={searchTerm ? 3 : 0}>
                        {searchTerm ? `We couldn't find any companies matching "${searchTerm}"` : 'Add your first company to get started!'}
                      </Typography>
                      {searchTerm && (
                        <Button variant="outlined" onClick={() => setSearchTerm('')}>
                          Clear Search
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow
                    key={company.id}
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
                    onClick={() => navigate(`/companies/${company.id}`)}
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <BusinessIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={600}>{company.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {company.phone || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={company.industry}
                        size="small"
                        sx={{ fontSize: '0.75rem', borderRadius: 1.5 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {company.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {company.website ? (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            color: 'inherit',
                            textDecoration: 'none',
                            fontSize: '0.875rem',
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="primary"
                            sx={{
                              '&:hover': {
                                textDecoration: 'underline',
                              }
                            }}
                          >
                            {company.website}
                          </Typography>
                        </a>
                      ) : (
                        <Typography variant="body2" color="text.secondary">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {company.createdBy?.name || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Tooltip title="Edit Company" placement="top">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(company);
                            }}
                            sx={{
                              '&:hover': {
                                bgcolor: 'primary.lighter',
                              }
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Company" placement="top">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(company.id);
                            }}
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
            {editingCompany ? 'Edit Company' : 'Add New Company'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 2 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  required
                />
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
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
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
              {editingCompany ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Companies;
