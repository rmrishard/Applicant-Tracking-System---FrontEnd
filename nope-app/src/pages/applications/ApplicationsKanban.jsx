import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Tooltip,
  Paper,
  Button,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  ViewColumn as ViewColumnIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { applicationsAPI } from '../../services/api';

const statusColumns = [
  { id: 'SOURCED', label: 'Sourced', color: '#2196f3' },
  { id: 'CONTACTED', label: 'Contacted', color: '#9c27b0' },
  { id: 'INTERVIEWING', label: 'Interviewing', color: '#ff9800' },
  { id: 'OFFER', label: 'Offer', color: '#4caf50' },
  { id: 'NOT_INTERESTED', label: 'Not Interested', color: '#757575' },
  { id: 'REJECTED', label: 'Rejected', color: '#f44336' },
];

const ApplicationCard = ({ application, onStatusChange, onClick }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('applicationId', application.id);
    e.dataTransfer.setData('currentStatus', application.status);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      sx={{
        mb: 2,
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        '&:active': {
          cursor: 'grabbing',
        },
        '&:hover': {
          boxShadow: 3,
        },
        transition: 'all 0.2s',
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {application.candidate?.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {application.candidate?.name || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {application.candidate?.email}
              </Typography>
            </Box>
          </Box>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => onClick(application.id)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
          <BusinessIcon fontSize="small" color="action" />
          <Typography variant="body2" noWrap>
            {application.job?.title || 'N/A'}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={0.5} mb={1}>
          <Typography variant="caption" color="text.secondary">
            {application.job?.company?.name || 'N/A'}
          </Typography>
        </Box>

        {application.appliedDate && (
          <Typography variant="caption" color="text.secondary">
            Applied: {new Date(application.appliedDate).toLocaleDateString()}
          </Typography>
        )}

        {application.rating > 0 && (
          <Box mt={1}>
            <Chip label={`${application.rating} ⭐`} size="small" color="warning" />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const KanbanColumn = ({ status, applications, onDrop, onClick }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const applicationId = e.dataTransfer.getData('applicationId');
    const currentStatus = e.dataTransfer.getData('currentStatus');

    if (currentStatus !== status.id) {
      onDrop(parseInt(applicationId), status.id);
    }
  };

  const columnApps = applications.filter((app) => app.status === status.id);

  return (
    <Paper
      elevation={isDragOver ? 8 : 1}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        minWidth: 300,
        maxWidth: 300,
        backgroundColor: isDragOver ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: status.color,
          color: 'white',
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            {status.label}
          </Typography>
          <Chip
            label={columnApps.length}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          p: 2,
          flexGrow: 1,
          overflowY: 'auto',
          minHeight: 400,
          maxHeight: 'calc(100vh - 300px)',
        }}
      >
        {columnApps.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
            sx={{ opacity: 0.5 }}
          >
            <Typography variant="body2" color="text.secondary">
              No applications
            </Typography>
          </Box>
        ) : (
          columnApps.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onClick={onClick}
            />
          ))
        )}
      </Box>
    </Paper>
  );
};

const ApplicationsKanban = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = applications.filter(
        (app) =>
          app.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.job?.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredApplications(filtered);
    } else {
      setFilteredApplications(applications);
    }
  }, [searchTerm, applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getAll();
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.content || response.data.applications || []);
      setApplications(data);
      setFilteredApplications(data);
      setError('');
    } catch (err) {
      setError('Failed to load applications');
      console.error('Error fetching applications:', err);
      setApplications([]);
      setFilteredApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId, newStatus) => {
    try {
      await applicationsAPI.updateStatus(applicationId, newStatus);

      // Update local state immediately for better UX
      setApplications((prevApps) =>
        prevApps.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      setError('Failed to update application status');
      console.error('Error updating status:', err);
      // Reload to get the correct state
      fetchApplications();
    }
  };

  const handleCardClick = (applicationId) => {
    navigate(`/applications/${applicationId}`);
  };

  const getStats = () => {
    return statusColumns.map((status) => ({
      ...status,
      count: filteredApplications.filter((app) => app.status === status.id).length,
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const stats = getStats();

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Applications Pipeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Drag and drop to change application status
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<ViewListIcon />}
            onClick={() => navigate('/applications')}
          >
            List View
          </Button>
          <Button variant="contained" startIcon={<ViewColumnIcon />}>
            Kanban View
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Search applications by candidate, job, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Summary Stats */}
      <Box display="flex" gap={2} mb={3} sx={{ overflowX: 'auto', pb: 1 }}>
        {stats.map((stat) => (
          <Chip
            key={stat.id}
            label={`${stat.label}: ${stat.count}`}
            sx={{
              backgroundColor: stat.color,
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        ))}
      </Box>

      {/* Kanban Board */}
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          minHeight: 500,
        }}
      >
        {statusColumns.map((status) => (
          <KanbanColumn
            key={status.id}
            status={status}
            applications={filteredApplications}
            onDrop={handleStatusChange}
            onClick={handleCardClick}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ApplicationsKanban;
