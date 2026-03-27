import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function analyzeText(text, question, jobId = null, jobDescription = null, requiredSkills = null) {
  const payload = { text, question };
  if (jobId) payload.job_id = jobId;
  if (jobDescription) payload.job_description = jobDescription;
  if (requiredSkills) payload.required_skills = requiredSkills;

  const response = await api.post('/api/analyze/text', payload);
  return response.data;
}

export async function transcribeAudio(formData) {
  const response = await api.post('/api/analyze/transcribe', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return response.data;
}

export async function analyzeAudio(formData) {
  const response = await api.post('/api/analyze/audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return response.data;
}

export async function getJobs(search = '', page = 1, limit = 20) {
  const params = { page, limit };
  if (search) params.search = search;

  const response = await api.get('/api/jobs', { params });
  return response.data;
}

export async function getJob(jobId) {
  const response = await api.get(`/api/jobs/${jobId}`);
  return response.data;
}

export async function getQuestions(company = '', limit = 10) {
  const params = { limit };
  if (company) params.company = company;

  const response = await api.get('/api/questions', { params });
  return response.data;
}

export async function getSampleQuestions() {
  const response = await api.get('/api/questions/sample');
  return response.data;
}

export async function generateHybridQuestions({ category = '', jobDescription = '', skills = '', numQuestions = 5 } = {}) {
  const response = await api.post('/api/questions/generate', {
    category,
    job_description: jobDescription,
    skills,
    num_questions: numQuestions,
  });
  return response.data;
}

export async function getCategories() {
  const response = await api.get('/api/jobs/categories');
  return response.data;
}

export async function analyzeBatch(answers, requiredSkills = '', totalDuration = 0) {
  const response = await api.post('/api/analyze/batch', {
    answers,
    required_skills: requiredSkills,
    total_duration_seconds: totalDuration,
  }, { timeout: 60000 });
  return response.data;
}

export async function parseResume(formData) {
  const response = await api.post('/api/resume/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return response.data;
}

export async function generateTTS(text) {
  const response = await api.post('/api/tts/generate', { text }, {
    responseType: 'blob',
    timeout: 15000,
  });
  return response.data;
}

export async function healthCheck() {
  const response = await api.get('/api/health');
  return response.data;
}
