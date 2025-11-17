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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  Rating,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Work as WorkIcon,
  Business as BusinessIcon,
  Event as EventIcon,
  Note as NoteIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material';
import { applicationsAPI, applicationNotesAPI } from '../../services/api';

// Wrapper components to filter out non-DOM props from StepIcon
const CompletedIcon = (props) => {
  const { completed, active, error, ...iconProps } = props;
  return <CheckCircleIcon {...iconProps} />;
};

const PendingIcon = (props) => {
  const { completed, active, error, ...iconProps } = props;
  return <RadioButtonUncheckedIcon {...iconProps} />;
};

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchApplicationData();
  }, [id]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getById(id);
      setApplication(response.data);
      setRating(response.data.rating || 0);
      setFeedback(response.data.feedback || '');
      setError('');

      // Fetch notes separately
      await fetchNotes();
    } catch (err) {
      setError('Failed to load application details');
      console.error('Error fetching application:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await applicationNotesAPI.getByApplication(id);
      setNotes(response.data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
      // Don't show error to user for notes fetch failure
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this application?')) {
      try {
        await applicationsAPI.delete(id);
        navigate('/applications');
      } catch (err) {
        setError('Failed to delete application');
        console.error('Error deleting application:', err);
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await applicationsAPI.updateStatus(id, newStatus);
      fetchApplicationData();
    } catch (err) {
      setError('Failed to update status');
      console.error('Error updating status:', err);
    }
  };

  const handleSaveRating = async () => {
    try {
      await applicationsAPI.update(id, {
        ...application,
        rating,
        feedback,
      });
      setError('');
      fetchApplicationData();
    } catch (err) {
      setError('Failed to save rating and feedback');
      console.error('Error saving rating:', err);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await applicationNotesAPI.create(id, {
        content: newNote,
        noteType: 'GENERAL',
      });
      setNewNote('');
      await fetchNotes();
    } catch (err) {
      setError('Failed to add note');
      console.error('Error adding note:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPLIED':
        return 'info';
      case 'SCREENING':
        return 'primary';
      case 'INTERVIEW':
        return 'warning';
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

  const getStatusSteps = () => {
    const statuses = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];
    const currentIndex = statuses.indexOf(application?.status);

    // If status is REJECTED, show all as incomplete except APPLIED
    if (application?.status === 'REJECTED') {
      return statuses.map((status, index) => ({
        label: status,
        completed: index === 0,
        active: false,
      }));
    }

    return statuses.map((status, index) => ({
      label: status,
      completed: index < currentIndex,
      active: index === currentIndex,
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!application) {
    return (
      <Box>
        <Alert severity="error">Application not found</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/applications')}
          sx={{ mt: 2 }}
        >
          Back to Applications
        </Button>
      </Box>
    );
  }

  const steps = getStatusSteps();
  const activeStep = steps.findIndex(step => step.active);

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/applications')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4">Application #{application.id}</Typography>
            <Typography variant="body2" color="text.secondary">
              {application.candidate?.name} - {application.job?.title}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Button startIcon={<EditIcon />} onClick={() => navigate('/applications')} sx={{ mr: 1 }}>
            Edit
          </Button>
          <Button startIcon={<DeleteIcon />} color="error" onClick={handleDelete}>
            Delete
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Application Information */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <PersonIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Candidate
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        sx={{ cursor: 'pointer', color: 'primary.main' }}
                        onClick={() => navigate(`/candidates/${application.candidate?.id}`)}
                      >
                        {application.candidate?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {application.candidate?.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <WorkIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Job
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        sx={{ cursor: 'pointer', color: 'primary.main' }}
                        onClick={() => navigate(`/jobs/${application.job?.id}`)}
                      >
                        {application.job?.title}
                      </Typography>
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
                      <Typography variant="body1">
                        {application.job?.company?.name || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <EventIcon color="action" />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Applied Date
                      </Typography>
                      <Typography variant="body1">
                        {application.appliedDate
                          ? new Date(application.appliedDate).toLocaleDateString()
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Box mt={1}>
                    <FormControl fullWidth size="small">
                      <Select
                        value={application.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                      >
                        <MenuItem value="APPLIED">Applied</MenuItem>
                        <MenuItem value="SCREENING">Screening</MenuItem>
                        <MenuItem value="INTERVIEW">Interview</MenuItem>
                        <MenuItem value="OFFER">Offer</MenuItem>
                        <MenuItem value="HIRED">Hired</MenuItem>
                        <MenuItem value="REJECTED">Rejected</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Application Progress */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Application Progress
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {application.status === 'REJECTED' ? (
                <Box textAlign="center" py={3}>
                  <Chip
                    label="APPLICATION REJECTED"
                    color="error"
                    size="large"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    This application was not successful
                  </Typography>
                </Box>
              ) : (
                <Stepper activeStep={activeStep} orientation="vertical">
                  {steps.map((step, index) => (
                    <Step key={step.label} completed={step.completed}>
                      <StepLabel
                        StepIconComponent={
                          step.completed
                            ? CompletedIcon
                            : step.active
                            ? undefined
                            : PendingIcon
                        }
                      >
                        <Typography
                          variant="body1"
                          fontWeight={step.active ? 'bold' : 'normal'}
                          color={step.completed ? 'success.main' : step.active ? 'primary.main' : 'text.secondary'}
                        >
                          {step.label}
                        </Typography>
                      </StepLabel>
                      <StepContent>
                        <Typography variant="caption" color="text.secondary">
                          {step.active ? 'Current stage' : step.completed ? 'Completed' : 'Pending'}
                        </Typography>
                      </StepContent>
                    </Step>
                  ))}
                </Stepper>
              )}
            </CardContent>
          </Card>

          {/* Rating and Feedback */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Rating & Feedback
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box mb={2}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Candidate Rating
                </Typography>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Rating
                    value={rating}
                    onChange={(e, newValue) => setRating(newValue)}
                    size="large"
                  />
                  <Typography variant="body2" color="text.secondary">
                    {rating > 0 ? `${rating} / 5` : 'Not rated'}
                  </Typography>
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Feedback"
                multiline
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add your feedback about this candidate..."
                sx={{ mb: 2 }}
              />

              <Button variant="contained" onClick={handleSaveRating}>
                Save Rating & Feedback
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Notes Section */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <NoteIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Notes & Communication
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                sx={{ mb: 1 }}
              />
              <Button
                variant="contained"
                fullWidth
                size="small"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
              >
                Add Note
              </Button>

              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Notes History
                </Typography>
                {notes && notes.length > 0 ? (
                  <Paper variant="outlined" sx={{ p: 0, maxHeight: 400, overflow: 'auto' }}>
                    <List>
                      {notes.map((note, index) => (
                        <ListItem
                          key={note.id}
                          divider={index < notes.length - 1}
                          sx={{ flexDirection: 'column', alignItems: 'flex-start' }}
                        >
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            {new Date(note.createdAt).toLocaleString()} - {note.noteType || 'GENERAL'}
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {note.content}
                          </Typography>
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No notes yet
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApplicationDetail;
