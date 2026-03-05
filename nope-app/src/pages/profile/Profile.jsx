import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Alert,
  Avatar,
  Divider,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Save as SaveIcon,
  Shield as ShieldIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    username: user?.username || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password change
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }
    }

    try {
      // Step 1: Update profile information (firstName, lastName, email)
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        username: formData.username,
        role: user.role, // Keep existing role
      };

      const response = await usersAPI.update(user.id, updateData);

      // Step 2: Change password separately if provided
      if (formData.newPassword) {
        await usersAPI.changePassword(user.id, formData.newPassword);
      }

      // Update auth context with new user data
      if (updateUser) {
        updateUser(response.data);
      }

      setSuccess(formData.newPassword
        ? 'Profile and password updated successfully'
        : 'Profile updated successfully');
      setEditing(false);

      // Clear password fields
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to update profile';
      setError(errorMsg);
      console.error('Error updating profile:', err);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      username: user?.username || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const getRoleColor = (role) => {
    return role === 'ADMIN' ? 'error' : 'primary';
  };

  const getRoleLabel = (role) => {
    return role?.replace('_', ' ') || '';
  };

  const getInitials = (first, last) => {
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first[0].toUpperCase();
    return 'U';
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">My Profile</Typography>
        {!editing && (
          <Button
            variant="contained"
            startIcon={<PersonIcon />}
            onClick={() => setEditing(true)}
          >
            Edit Profile
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                <Box position="relative">
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: user?.role === 'ADMIN' ? 'error.main' : 'primary.main',
                      fontSize: '3rem',
                      fontWeight: 600,
                      boxShadow: 2,
                    }}
                  >
                    {getInitials(user?.firstName, user?.lastName)}
                  </Avatar>
                  {editing && (
                    <Tooltip title="Change Picture">
                      <IconButton
                        color="primary"
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: 'background.paper',
                          boxShadow: 2,
                          '&:hover': { bgcolor: 'background.default' },
                        }}
                        component="label"
                      >
                        <input hidden accept="image/*" type="file" />
                        <PhotoCameraIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Box textAlign="center">
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    @{user?.username}
                  </Typography>
                  <Box mt={1.5} display="inline-flex" alignItems="center" gap={1} px={2} py={0.5} borderRadius={2} bgcolor={`${getRoleColor(user?.role)}.lighter`}>
                    {user?.role === 'ADMIN' ? <ShieldIcon fontSize="small" color="error" /> : <PersonIcon fontSize="small" color="primary" />}
                    <Typography variant="body2" fontWeight={600} color={`${getRoleColor(user?.role)}.main`}>
                      {getRoleLabel(user?.role)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Profile Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!editing}
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
                      disabled={!editing}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editing}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled
                      helperText="Username cannot be changed"
                    />
                  </Grid>

                  {editing && (
                    <>
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Change Password (Optional)
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="New Password"
                          name="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={handleChange}
                          helperText="Leave blank to keep current password"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          name="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={!formData.newPassword}
                        />
                      </Grid>
                    </>
                  )}

                  {editing && (
                    <Grid item xs={12}>
                      <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                        <Button onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="contained"
                          startIcon={<SaveIcon />}
                        >
                          Save Changes
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Profile;
