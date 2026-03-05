import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !(error.config?.url?.includes('/api/users'))) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const transformUser = (user) => {
  if (!user) return null;

  // Handle both camelCase and snake_case
  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';
  const username = user.username || '';

  const fullName = `${firstName} ${lastName}`.trim();

  return {
    ...user,
    name: fullName || username || 'System User',
  };
};

// Helper functions to transform backend responses to frontend format
const transformCompany = (company) => {
  if (!company) return null;
  return {
    ...company,
    createdBy: company.createdBy ? transformUser(company.createdBy) : null,
  };
};

const transformCandidate = (candidate) => {
  if (!candidate) return null;

  // Create name from user fields only if we don't already have one
  let formattedName = candidate.name;
  if (!formattedName && (candidate.firstName || candidate.lastName)) {
    formattedName = `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim();
  }

  return {
    ...candidate,
    name: formattedName,
    // Note: Backend uses 'phone' directly, not 'phoneNumber'
    experience: candidate.experienceYears,
    linkedInUrl: candidate.linkedinUrl, // lowercase 'u'
    company: candidate.currentCompany,
    resumePath: candidate.resumeUrl,
  };
};

const transformJob = (job) => {
  if (!job) return null;

  // Combine minSalary and maxSalary into salaryRange
  let salaryRange = '';
  if (job.minSalary && job.maxSalary) {
    salaryRange = `${job.minSalary}-${job.maxSalary}`;
  } else if (job.minSalary) {
    salaryRange = `${job.minSalary}+`;
  } else if (job.maxSalary) {
    salaryRange = `Up to ${job.maxSalary}`;
  }

  // Ensure we at least have shell objects for users if the backend only sends IDs
  const transformedCreatedBy = job.createdBy ? transformUser(job.createdBy) : null;
  const transformedAssignedRecruiter = (job.assignedRecruiter || job.recruiter) ?
    transformUser(job.assignedRecruiter || job.recruiter) : null;

  return {
    ...job,
    companyId: job.company?.id,
    recruiterId: transformedAssignedRecruiter?.id || job.recruiterId,
    salaryRange: salaryRange,
    company: job.company ? transformCompany(job.company) : null,
    assignedRecruiter: transformedAssignedRecruiter,
    createdBy: transformedCreatedBy,
  };
};

const transformApplication = (application) => {
  if (!application) return null;
  return {
    ...application,
    appliedDate: application.appliedAt,
    candidate: application.candidate ? transformCandidate(application.candidate) : null,
    job: application.job ? transformJob(application.job) : null,
    createdBy: application.createdBy ? transformUser(application.createdBy) : null,
  };
};

// Auth API calls
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data && response.data.user) {
      response.data.user = transformUser(response.data.user);
    } else if (response.data && !response.data.token) {
      // If the response is just the user object
      response.data = transformUser(response.data);
    }
    return response;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    if (response.data) {
      response.data = transformUser(response.data);
    }
    return response;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },
};

// Companies API calls
export const companiesAPI = {
  getAll: async (params) => {
    const response = await api.get('/api/companies', { params });
    const rawData = response.data?.data || response.data;

    if (Array.isArray(rawData)) {
      response.data = rawData.map(transformCompany);
    } else if (rawData?.content) {
      response.data = { ...rawData, content: rawData.content.map(transformCompany) };
    } else if (rawData?.companies) {
      response.data = { ...rawData, content: rawData.companies.map(transformCompany) };
    } else {
      response.data = rawData;
    }
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/companies/${id}`);
    const rawData = response.data?.data || response.data;
    response.data = transformCompany(rawData);
    return response;
  },
  create: async (data) => {
    // Map frontend field names to backend field names (based on actual Entity file)
    // NOTE: Company entity does NOT have an email field!
    const payload = {
      name: data.name,
      phone: data.phone || null, // Backend uses 'phone' directly
      website: data.website || null,
      industry: data.industry || null,
      location: data.location || null,
      description: data.description || null,
    };
    console.log('Creating company with payload:', JSON.stringify(payload, null, 2));
    const response = await api.post('/api/companies', payload);
    const rawData = response.data?.data || response.data;
    response.data = transformCompany(rawData);
    return response;
  },
  update: async (id, data) => {
    // Map frontend field names to backend field names (based on actual Entity file)
    // NOTE: Company entity does NOT have an email field!
    const payload = {
      name: data.name,
      phone: data.phone || null, // Backend uses 'phone' directly
      website: data.website || null,
      industry: data.industry || null,
      location: data.location || null,
      description: data.description || null,
    };
    console.log('Updating company', id, 'with payload:', JSON.stringify(payload, null, 2));
    const response = await api.put(`/api/companies/${id}`, payload);
    const rawData = response.data?.data || response.data;
    response.data = transformCompany(rawData);
    return response;
  },
  delete: (id) => api.delete(`/api/companies/${id}`),
};

// Jobs API calls
export const jobsAPI = {
  getAll: async (params) => {
    const response = await api.get('/api/jobs', { params });
    const rawData = response.data?.data || response.data;

    if (Array.isArray(rawData)) {
      response.data = rawData.map(transformJob);
    } else if (rawData?.content) {
      response.data = { ...rawData, content: rawData.content.map(transformJob) };
    } else if (rawData?.jobs) {
      response.data = { ...rawData, content: rawData.jobs.map(transformJob) };
    } else {
      response.data = rawData;
    }
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/jobs/${id}`);
    const rawData = response.data?.data || response.data;
    response.data = transformJob(rawData);
    return response;
  },
  create: async (data) => {
    // Map frontend field names to backend structure
    // Parse salaryRange (e.g., "80000-120000") into minSalary and maxSalary
    let minSalary = null;
    let maxSalary = null;

    if (data.salaryRange && typeof data.salaryRange === 'string') {
      if (data.salaryRange.includes('-')) {
        const parts = data.salaryRange.split('-');
        const min = parts[0]?.trim();
        const max = parts[1]?.trim();
        minSalary = min && !isNaN(parseFloat(min)) ? parseFloat(min) : null;
        maxSalary = max && !isNaN(parseFloat(max)) ? parseFloat(max) : null;
      } else {
        // Single number provided
        const num = parseFloat(data.salaryRange.trim());
        if (!isNaN(num)) {
          minSalary = num;
          maxSalary = num;
        }
      }
    }

    const payload = {
      title: data.title,
      description: data.description,
      requirements: data.requirements,
      location: data.location,
      jobType: data.jobType,
      status: data.status,
      priority: data.priority || 'MEDIUM',
      minSalary: minSalary,
      maxSalary: maxSalary,
      deadline: data.deadline,
      company: { id: parseInt(data.companyId) },
      assignedRecruiter: data.recruiterId && data.recruiterId !== '' ? { id: parseInt(data.recruiterId) } : null,
      assignedRecruiterId: data.recruiterId && data.recruiterId !== '' ? parseInt(data.recruiterId) : null,
    };

    console.log('Creating job with payload:', JSON.stringify(payload, null, 2));
    const response = await api.post('/api/jobs', payload);
    const rawData = response.data?.data || response.data;
    response.data = transformJob(rawData);
    return response;
  },
  update: async (id, data) => {
    // Map frontend field names to backend structure
    // Parse salaryRange (e.g., "80000-120000") into minSalary and maxSalary
    let minSalary = null;
    let maxSalary = null;

    if (data.salaryRange && typeof data.salaryRange === 'string') {
      if (data.salaryRange.includes('-')) {
        const parts = data.salaryRange.split('-');
        const min = parts[0]?.trim();
        const max = parts[1]?.trim();
        minSalary = min && !isNaN(parseFloat(min)) ? parseFloat(min) : null;
        maxSalary = max && !isNaN(parseFloat(max)) ? parseFloat(max) : null;
      } else {
        // Single number provided
        const num = parseFloat(data.salaryRange.trim());
        if (!isNaN(num)) {
          minSalary = num;
          maxSalary = num;
        }
      }
    }

    const payload = {
      title: data.title,
      description: data.description,
      requirements: data.requirements,
      location: data.location,
      jobType: data.jobType,
      status: data.status,
      priority: data.priority || 'MEDIUM',
      minSalary: minSalary,
      maxSalary: maxSalary,
      deadline: data.deadline,
      company: { id: parseInt(data.companyId) },
      assignedRecruiter: data.recruiterId ? { id: parseInt(data.recruiterId) } : undefined,
    };

    console.log('Updating job', id, 'with payload:', JSON.stringify(payload, null, 2));
    const response = await api.put(`/api/jobs/${id}`, payload);
    const rawData = response.data?.data || response.data;
    response.data = transformJob(rawData);
    return response;
  },
  delete: (id) => api.delete(`/api/jobs/${id}`),
  getByCompany: async (companyId) => {
    const response = await api.get(`/api/jobs/by-company/${companyId}`);
    // Handle paginated response
    if (Array.isArray(response.data)) {
      response.data = response.data.map(transformJob);
    } else if (response.data.content) {
      response.data.content = response.data.content.map(transformJob);
    } else if (response.data.jobs) {
      response.data.content = response.data.jobs.map(transformJob);
    }
    return response;
  },
};

// Candidates API calls
export const candidatesAPI = {
  getAll: async (params) => {
    const response = await api.get('/api/candidates', { params });
    const rawData = response.data?.data || response.data;
    if (Array.isArray(rawData)) {
      response.data = rawData.map(transformCandidate);
    } else if (rawData?.content) {
      response.data = { ...rawData, content: rawData.content.map(transformCandidate) };
    } else if (rawData?.candidates) {
      response.data = { ...rawData, content: rawData.candidates.map(transformCandidate) };
    } else {
      response.data = rawData;
    }
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/candidates/${id}`);
    const rawData = response.data?.data || response.data;
    response.data = transformCandidate(rawData);
    return response;
  },
  create: async (data) => {
    // Map frontend field names to backend field names (based on actual Entity file)
    // Use firstName and lastName directly from form (no need to split name anymore)
    const payload = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email,
      phone: data.phone || null, // Backend uses 'phone', not 'phoneNumber'
      location: data.location || null,
      linkedinUrl: data.linkedInUrl || null, // Backend uses 'linkedinUrl' (lowercase 'u')
      skills: data.skills || null,
      experienceYears: data.experience ? parseInt(data.experience) : null, // Backend uses 'experienceYears'
      currentJobTitle: data.currentJobTitle || null, // New field
      currentCompany: data.company || null,
      summary: data.summary || null, // New field
      resumeUrl: data.resumeUrl || null, // Backend uses 'resumeUrl'
    };
    console.log('Creating candidate with payload:', JSON.stringify(payload, null, 2));
    const response = await api.post('/api/candidates', payload);
    const rawData = response.data?.data || response.data;
    response.data = transformCandidate(rawData);
    return response;
  },
  update: async (id, data) => {
    // Map frontend field names to backend field names (based on actual Entity file)
    // Use firstName and lastName directly from form (no need to split name anymore)
    const payload = {
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      email: data.email,
      phone: data.phone || null, // Backend uses 'phone', not 'phoneNumber'
      location: data.location || null,
      linkedinUrl: data.linkedInUrl || null, // Backend uses 'linkedinUrl' (lowercase 'u')
      skills: data.skills || null,
      experienceYears: data.experience ? parseInt(data.experience) : null, // Backend uses 'experienceYears'
      currentJobTitle: data.currentJobTitle || null, // New field
      currentCompany: data.company || null,
      summary: data.summary || null, // New field
      resumeUrl: data.resumeUrl || null, // Backend uses 'resumeUrl'
    };
    console.log('Updating candidate', id, 'with payload:', JSON.stringify(payload, null, 2));
    const response = await api.put(`/api/candidates/${id}`, payload);
    const rawData = response.data?.data || response.data;
    response.data = transformCandidate(rawData);
    return response;
  },
  delete: (id) => api.delete(`/api/candidates/${id}`),
  uploadResume: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/api/candidates/${id}/resume`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const rawData = response.data?.data || response.data;
    response.data = transformCandidate(rawData);
    return response;
  },
};

// Application Notes API calls
export const applicationNotesAPI = {
  getByApplication: async (applicationId) => {
    const response = await api.get(`/api/applications/${applicationId}/notes`);
    const rawData = response.data?.data || response.data;
    if (Array.isArray(rawData)) {
      response.data = rawData.map(note => ({
        ...note,
        createdBy: note.createdBy ? transformUser(note.createdBy) : null
      }));
    } else {
      response.data = rawData;
    }
    return response;
  },
  create: async (applicationId, noteData) => {
    // noteData should include: content, noteType (optional, defaults to GENERAL)
    const response = await api.post(`/api/applications/${applicationId}/notes`, noteData);
    const rawData = response.data?.data || response.data;
    if (rawData) {
      response.data = {
        ...rawData,
        createdBy: rawData.createdBy ? transformUser(rawData.createdBy) : null
      };
    } else {
      response.data = rawData;
    }
    return response;
  },
  delete: (noteId) => api.delete(`/api/application-notes/${noteId}`),
};

// Applications API calls
export const applicationsAPI = {
  getAll: async (params) => {
    const response = await api.get('/api/applications', { params });
    const rawData = response.data?.data || response.data;
    if (Array.isArray(rawData)) {
      response.data = rawData.map(transformApplication);
    } else if (rawData?.content) {
      response.data = { ...rawData, content: rawData.content.map(transformApplication) };
    } else if (rawData?.applications) {
      response.data = { ...rawData, content: rawData.applications.map(transformApplication) };
    } else {
      response.data = rawData;
    }
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/applications/${id}`);
    const rawData = response.data?.data || response.data;
    response.data = transformApplication(rawData);
    return response;
  },
  create: async (data) => {
    // Backend expects: POST /api/applications/candidate/{candidateId}/job/{jobId}
    const candidateId = data.candidateId;
    const jobId = data.jobId;
    const response = await api.post(`/api/applications/candidate/${candidateId}/job/${jobId}`);
    const rawData = response.data?.data || response.data;
    response.data = transformApplication(rawData);
    return response;
  },
  update: async (id, data) => {
    // Map frontend field names - Applications don't have notes field in backend
    const payload = {
      status: data.status,
      rating: data.rating,
      followUpDate: data.followUpDate,
    };
    const response = await api.put(`/api/applications/${id}`, payload);
    const rawData = response.data?.data || response.data;
    response.data = transformApplication(rawData);
    return response;
  },
  updateStatus: async (id, status) => {
    // Backend expects: PUT /api/applications/{id}/status?status={status}
    const response = await api.put(`/api/applications/${id}/status`, null, {
      params: { status: status }
    });
    const rawData = response.data?.data || response.data;
    response.data = transformApplication(rawData);
    return response;
  },
  delete: (id) => api.delete(`/api/applications/${id}`),
  getByJob: async (jobId) => {
    const response = await api.get(`/api/applications/job/${jobId}`);
    const rawData = response.data?.data || response.data;
    if (Array.isArray(rawData)) {
      response.data = rawData.map(transformApplication);
    } else if (rawData?.content) {
      response.data = { ...rawData, content: rawData.content.map(transformApplication) };
    } else if (rawData?.applications) {
      response.data = { ...rawData, content: rawData.applications.map(transformApplication) };
    } else {
      response.data = rawData;
    }
    return response;
  },
  getByCandidate: async (candidateId) => {
    const response = await api.get(`/api/applications/candidate/${candidateId}`);
    // Handle paginated response
    if (Array.isArray(response.data)) {
      response.data = response.data.map(transformApplication);
    } else if (response.data.content) {
      response.data.content = response.data.content.map(transformApplication);
    } else if (response.data.applications) {
      response.data.content = response.data.applications.map(transformApplication);
    }
    return response;
  },
};


// Users API calls
export const usersAPI = {
  getAll: async (params) => {
    const response = await api.get('/api/users', { params });
    // Handle ApiResponse wrapper { success, data, ... }
    const rawData = response.data?.data || response.data;

    if (Array.isArray(rawData)) {
      response.data = rawData.map(transformUser);
    } else if (rawData?.content) {
      response.data = { ...rawData, content: rawData.content.map(transformUser) };
    } else if (rawData?.users) {
      response.data = { ...rawData, content: rawData.users.map(transformUser) };
    } else {
      response.data = rawData;
    }
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/users/${id}`);
    response.data = transformUser(response.data);
    return response;
  },
  create: async (data) => {
    // Map frontend fields to backend fields
    const payload = {
      username: data.username,
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    };
    console.log('Creating user with payload:', JSON.stringify(payload, null, 2));
    const response = await api.post('/api/users', payload);
    response.data = transformUser(response.data);
    return response;
  },
  update: async (id, data) => {
    // Map frontend fields to backend fields
    // NOTE: Password should NOT be included here - use changePassword instead
    const payload = {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    };
    console.log('Updating user', id, 'with payload:', JSON.stringify(payload, null, 2));
    const response = await api.put(`/api/users/${id}`, payload);
    response.data = transformUser(response.data);
    return response;
  },
  changePassword: async (id, newPassword) => {
    // Dedicated endpoint for password changes
    const response = await api.put(`/api/users/${id}/password`, { password: newPassword });
    return response;
  },
  delete: (id) => api.delete(`/api/users/${id}`),
  getByRole: async (role) => {
    const response = await api.get('/api/users/by-role', { params: { role } });
    const rawData = response.data?.data || response.data;
    if (Array.isArray(rawData)) {
      response.data = rawData.map(transformUser);
    } else {
      response.data = rawData;
    }
    return response;
  },
  getCount: async () => {
    const response = await api.get('/api/users/count');
    return response;
  },
  getCountByRole: async () => {
    const response = await api.get('/api/users/count/by-role');
    return response;
  },
  search: async (query) => {
    const response = await api.get('/api/users/search', { params: { query } });
    if (Array.isArray(response.data)) {
      response.data = response.data.map(transformUser);
    }
    return response;
  },
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: async () => {
    // Backend returns ApiResponse wrapper: { success, message, data, timestamp }
    const response = await api.get('/api/dashboard/stats');
    // Return the data property which contains actual stats
    return { data: response.data.data || response.data };
  },
  getRecentActivity: async () => {
    const response = await api.get('/api/dashboard/recent-activity');
    return { data: response.data.data || response.data };
  },
};

export default api;
