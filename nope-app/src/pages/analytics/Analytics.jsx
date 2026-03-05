import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { applicationsAPI, jobsAPI, candidatesAPI, companiesAPI } from '../../services/api';

const COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#ed6c02', '#d32f2f', '#0288d1'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('all');

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [appsRes, jobsRes, candidatesRes, companiesRes] = await Promise.all([
        applicationsAPI.getAll(),
        jobsAPI.getAll(),
        candidatesAPI.getAll(),
        companiesAPI.getAll(),
      ]);

      // Handle both array and paginated response formats
      const appsData = Array.isArray(appsRes.data)
        ? appsRes.data
        : (appsRes.data.content || appsRes.data.applications || []);
      const jobsData = Array.isArray(jobsRes.data)
        ? jobsRes.data
        : (jobsRes.data.content || jobsRes.data.jobs || []);
      const candidatesData = Array.isArray(candidatesRes.data)
        ? candidatesRes.data
        : (candidatesRes.data.content || candidatesRes.data.candidates || []);
      const companiesData = Array.isArray(companiesRes.data)
        ? companiesRes.data
        : (companiesRes.data.content || companiesRes.data.companies || []);

      setApplications(appsData);
      setJobs(jobsData);
      setCandidates(candidatesData);
      setCompanies(companiesData);
      setError('');
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Error fetching analytics:', err);
      setApplications([]);
      setJobs([]);
      setCandidates([]);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate applications by status
  const getApplicationsByStatus = () => {
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  };

  // Calculate jobs by company
  const getJobsByCompany = () => {
    const companyJobCounts = jobs.reduce((acc, job) => {
      const companyName = job.company?.name || 'Unknown';
      acc[companyName] = (acc[companyName] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(companyJobCounts)
      .map(([company, count]) => ({
        company,
        jobs: count,
      }))
      .sort((a, b) => b.jobs - a.jobs)
      .slice(0, 8); // Top 8 companies
  };

  // Calculate jobs by status
  const getJobsByStatus = () => {
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      count: count,
    }));
  };

  // Calculate conversion funnel
  const getConversionFunnel = () => {
    const statusOrder = ['SOURCED', 'CONTACTED', 'INTERVIEWING', 'OFFER'];
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    return statusOrder.map((status) => ({
      stage: status,
      count: statusCounts[status] || 0,
    }));
  };

  // Calculate applications per job
  const getApplicationsPerJob = () => {
    const jobAppCounts = applications.reduce((acc, app) => {
      const jobTitle = app.job?.title || 'Unknown';
      acc[jobTitle] = (acc[jobTitle] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(jobAppCounts)
      .map(([job, count]) => ({
        job: job.length > 20 ? job.substring(0, 20) + '...' : job,
        applications: count,
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10); // Top 10 jobs
  };

  // Calculate key metrics
  const getKeyMetrics = () => {
    const totalApplications = applications.length;
    const offerCount = applications.filter(app => app.status === 'OFFER').length;
    const rejectedCount = applications.filter(app => app.status === 'REJECTED' || app.status === 'NOT_INTERESTED').length;
    const activeCount = totalApplications - offerCount - rejectedCount;

    const conversionRate = totalApplications > 0
      ? ((offerCount / totalApplications) * 100).toFixed(1)
      : 0;

    const openJobs = jobs.filter(job => job.status === 'OPEN').length;
    const avgApplicationsPerJob = jobs.length > 0
      ? (totalApplications / jobs.length).toFixed(1)
      : 0;

    return {
      totalApplications,
      offerCount,
      activeCount,
      conversionRate,
      openJobs,
      avgApplicationsPerJob,
    };
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const metrics = getKeyMetrics();
  const applicationsByStatus = getApplicationsByStatus();
  const jobsByCompany = getJobsByCompany();
  const jobsByStatus = getJobsByStatus();
  const conversionFunnel = getConversionFunnel();
  const applicationsPerJob = getApplicationsPerJob();

  return (
    <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Analytics & Reports
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive insights into your recruitment pipeline
          </Typography>
        </Box>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            label="Time Range"
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="30">Last 30 Days</MenuItem>
            <MenuItem value="90">Last 90 Days</MenuItem>
            <MenuItem value="180">Last 6 Months</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="overline">
                Total Applications
              </Typography>
              <Typography variant="h4">{metrics.totalApplications}</Typography>
              <Typography variant="caption" color="success.main">
                <TrendingUpIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} /> Active Pipeline
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="overline">
                Hired
              </Typography>
              <Typography variant="h4">{metrics.hiredCount}</Typography>
              <Typography variant="caption" color="text.secondary">
                {metrics.conversionRate}% conversion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="overline">
                Open Jobs
              </Typography>
              <Typography variant="h4">{metrics.openJobs}</Typography>
              <Typography variant="caption" color="text.secondary">
                {jobs.length} total jobs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="overline">
                Avg. Applications/Job
              </Typography>
              <Typography variant="h4">{metrics.avgApplicationsPerJob}</Typography>
              <Typography variant="caption" color="text.secondary">
                Per job posting
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Applications by Status - Pie Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Applications by Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={applicationsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {applicationsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Jobs by Status - Bar Chart */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Jobs by Status
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Hiring Funnel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hiring Funnel
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conversionFunnel} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#9c27b0" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Applications per Job */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Jobs by Applications
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationsPerJob}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="job" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#2e7d32" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Jobs by Company */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Jobs by Company
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jobsByCompany}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="company" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="jobs" fill="#ed6c02" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
