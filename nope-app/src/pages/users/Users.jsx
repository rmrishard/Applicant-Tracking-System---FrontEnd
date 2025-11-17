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
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Shield as ShieldIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Users = () => {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'RECRUITER',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      // Handle both array and paginated response formats
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data.content || response.data.users || []);
      setUsers(data);
      setError('');
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        username: user.username,
        password: '', // Don't populate password for editing
        role: user.role,
      });
    } else {
      setEditingUser(null);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        role: 'RECRUITER',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      role: 'RECRUITER',
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
      if (editingUser) {
        // Update user profile
        const updatePayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          role: formData.role,
        };
        await usersAPI.update(editingUser.id, updatePayload);

        // Change password separately if provided
        if (formData.password) {
          await usersAPI.changePassword(editingUser.id, formData.password);
        }
      } else {
        // Create new user (password is required)
        const createPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          username: formData.username,
          password: formData.password,
          role: formData.role,
        };
        await usersAPI.create(createPayload);
      }
      fetchUsers();
      handleCloseDialog();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to save user';
      setError(errorMsg);
      console.error('Error saving user:', err);
    }
  };

  const handleDelete = async (userToDelete) => {
    // Check if current user is admin
    if (!hasRole('ADMIN')) {
      setError('Only administrators can delete users');
      return;
    }

    // Prevent deleting yourself
    if (userToDelete.id === currentUser.id) {
      setError('You cannot delete your own account');
      return;
    }

    // Prevent regular users from being able to delete (extra safety check)
    if (userToDelete.role === 'ADMIN' && !hasRole('ADMIN')) {
      setError('You do not have permission to delete this user');
      return;
    }

    if (window.confirm(`Are you sure you want to delete user "${userToDelete.name}"?`)) {
      try {
        await usersAPI.delete(userToDelete.id);
        fetchUsers();
        setError('');
      } catch (err) {
        setError('Failed to delete user');
        console.error('Error deleting user:', err);
      }
    }
  };

  const canDeleteUser = (userToDelete) => {
    // Only admins can delete
    if (!hasRole('ADMIN')) return false;

    // Can't delete yourself
    if (userToDelete.id === currentUser.id) return false;

    return true;
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'error';
      case 'RECRUITER':
        return 'primary';
      case 'HIRING_MANAGER':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    return role?.replace('_', ' ') || '';
  };

  const getRoleIcon = (role) => {
    if (role === 'ADMIN') {
      return <ShieldIcon />;
    }
    return <PersonIcon />;
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">User Management</Typography>
        {hasRole('ADMIN') && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add User
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card>
        <Box p={2}>
          <TextField
            fullWidth
            placeholder="Search users by name, username, or role..."
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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Box py={3}>
                      <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography color="text.secondary">
                        {searchTerm ? 'No users found' : 'No users yet. Add your first user!'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getRoleIcon(user.role)}
                        <Typography fontWeight="medium">{user.name}</Typography>
                        {user.id === currentUser.id && (
                          <Chip label="You" size="small" color="info" />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleLabel(user.role)}
                        size="small"
                        color={getRoleColor(user.role)}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {hasRole('ADMIN') && (
                        <>
                          <Tooltip title="Edit user">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenDialog(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          {canDeleteUser(user) ? (
                            <Tooltip title="Delete user">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(user)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title={user.id === currentUser.id ? "Cannot delete yourself" : "Cannot delete this user"}>
                              <span>
                                <IconButton size="small" disabled>
                                  <BlockIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </>
                      )}
                      {!hasRole('ADMIN') && (
                        <Typography variant="caption" color="text.secondary">
                          No actions available
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {editingUser ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
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
              <Grid item xs={12}>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={!!editingUser}
                  helperText={editingUser ? "Username cannot be changed" : ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!editingUser}
                  helperText={editingUser ? "Leave blank to keep current password" : ""}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="RECRUITER">Recruiter</MenuItem>
                </TextField>
              </Grid>
              {formData.role === 'ADMIN' && (
                <Grid item xs={12}>
                  <Alert severity="warning">
                    Admin users have full access to all features.
                  </Alert>
                </Grid>
              )}
              {formData.role === 'RECRUITER' && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    Recruiters can manage companies, jobs, candidates, and applications.
                  </Alert>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Users;
