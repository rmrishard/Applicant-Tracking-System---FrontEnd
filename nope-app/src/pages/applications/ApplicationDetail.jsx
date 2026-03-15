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
  Select,
  MenuItem,
  TextField,
  Paper,
  List,
  ListItem,
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

  useEffect(() => {
    fetchApplicationData();
  }, [id]);

  const fetchApplicationData = async () => {
    try {
      setLoading(true);
      const response = await applicationsAPI.getById(id);
      setApplication(response.data);
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
      case 'SOURCED': return 'info';
      case 'CONTACTED': return 'primary';
      case 'INTERVIEWING': return 'warning';
      case 'OFFER': return 'success';
      case 'NOT_INTERESTED': return 'error';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusSteps = () => {
    const statuses = ['SOURCED', 'CONTACTED', 'INTERVIEWING', 'OFFER'];
    const currentIndex = statuses.indexOf(application?.status);

    if (application?.status === 'REJECTED' || application?.status === 'NOT_INTERESTED') {
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
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/applications')} sx={{ mt: 2 }}>
          Back to Applications
        </Button>
      </Box>
    );
  }

  const steps = getStatusSteps();
  const activeStep = steps.findIndex(step => step.active);

  return (
    <Box sx={{ width: '100%', px: { xs: 1.5, sm: 2, md: 2.5 }, py: 2 }}>
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
            onClick={() => navigate('/applications')}
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
              Application #{application.id}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {application.candidate?.name} • {application.job?.title}
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate('/applications')}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
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
        {/* Main Content (Left Column) - Information & Progress */}
        <Grid item xs={12} md={8}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Application Information Card */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Application Details
                </Typography>
                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={4}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <PersonIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Candidate
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            mt: 0.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                          }}
                          onClick={() => navigate(`/candidates/${application.candidate?.id}`)}
                        >
                          {application.candidate?.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {application.candidate?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <WorkIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Applied Role
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            mt: 0.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            '&:hover': { color: 'primary.main', textDecoration: 'underline' }
                          }}
                          onClick={() => navigate(`/jobs/${application.job?.id}`)}
                        >
                          {application.job?.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {application.job?.company?.name || 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <EventIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Submission Date
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {application.appliedDate ? new Date(application.appliedDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="flex-start" gap={2}>
                      <NoteIcon sx={{ color: 'primary.main', fontSize: 24, mt: 0.5 }} />
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Current Status
                        </Typography>
                        <Box mt={1}>
                          <FormControl fullWidth size="small">
                            <Select
                              value={application.status}
                              onChange={(e) => handleStatusChange(e.target.value)}
                              sx={{ borderRadius: 2 }}
                            >
                              <MenuItem value="SOURCED">Sourced</MenuItem>
                              <MenuItem value="CONTACTED">Contacted</MenuItem>
                              <MenuItem value="INTERVIEWING">Interviewing</MenuItem>
                              <MenuItem value="OFFER">Offer</MenuItem>
                              <MenuItem value="NOT_INTERESTED">Not Interested</MenuItem>
                              <MenuItem value="REJECTED">Rejected</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Application Progress Card */}
            <Card
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  Pipeline Progress
                </Typography>
                <Divider sx={{ mb: 3 }} />

                {application.status === 'REJECTED' || application.status === 'NOT_INTERESTED' ? (
                  <Box textAlign="center" py={4} bgcolor="error.lighter" borderRadius={2} border="1px dashed" borderColor="error.main">
                    <Chip
                      label={application.status === 'REJECTED' ? 'APPLICATION REJECTED' : 'NOT INTERESTED'}
                      color="error"
                      sx={{ mb: 2, fontWeight: 700 }}
                    />
                    <Typography variant="body2" color="error.dark">
                      This application cycle has ended.
                    </Typography>
                  </Box>
                ) : (
                  <Stepper activeStep={activeStep} orientation="vertical" sx={{ px: 2 }}>
                    {steps.map((step) => (
                      <Step key={step.label} completed={step.completed}>
                        <StepLabel
                          StepIconComponent={step.completed ? CompletedIcon : step.active ? undefined : PendingIcon}
                        >
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: step.active ? 700 : 500,
                              color: step.completed ? 'success.main' : step.active ? 'primary.main' : 'text.secondary'
                            }}
                          >
                            {step.label}
                          </Typography>
                        </StepLabel>
                        <StepContent>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {step.active ? 'This is the current stage of the candidate in the hiring pipeline.' : step.completed ? 'Stage successfully completed.' : 'Next potential stage.'}
                          </Typography>
                        </StepContent>
                      </Step>
                    ))}
                  </Stepper>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>

        {/* Sidebar (Right Column) - Notes */}
        <Grid item xs={12} md={4}>
          <Card
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              height: 'fit-content',
              position: { md: 'sticky' },
              top: 24,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <NoteIcon sx={{ color: 'primary.main' }} />
                Notes & Communication
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Add a note or update..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Button
                variant="contained"
                fullWidth
                onClick={handleAddNote}
                disabled={!newNote.trim()}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1
                }}
              >
                Add Note
              </Button>

              <Box mt={4}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.75rem' }}>
                  Timeline
                </Typography>
                {notes && notes.length > 0 ? (
                  <Box sx={{ maxHeight: 500, overflow: 'auto', pr: 1 }}>
                    <List sx={{ p: 0 }}>
                      {notes.map((note, index) => (
                        <ListItem
                          key={note.id}
                          sx={{
                            px: 0,
                            py: 2,
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            borderBottom: index < notes.length - 1 ? '1px solid' : 'none',
                            borderColor: 'divider'
                          }}
                        >
                          <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                              {note.createdBy?.name || 'System'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(note.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'text.primary', lineHeight: 1.6 }}>
                            {note.content}
                          </Typography>
                          <Chip
                            label={note.noteType || 'GENERAL'}
                            size="small"
                            variant="outlined"
                            sx={{ mt: 1.5, height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : (
                  <Box textAlign="center" py={4} bgcolor="action.hover" borderRadius={2}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No notes yet
                    </Typography>
                  </Box>
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
