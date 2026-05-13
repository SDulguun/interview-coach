import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export { API_BASE_URL };

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
  }, { timeout: 180000 });
  return response.data;
}

export async function parseResume(formData) {
  const response = await api.post('/api/resume/parse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 30000,
  });
  return response.data;
}

export async function generateReaction({ question, answer, lang = 'mn', difficulty = 'medium', isLastQuestion = false, jobTitle = '' }) {
  const response = await api.post('/api/reaction/generate', {
    question,
    answer,
    lang,
    difficulty,
    is_last_question: isLastQuestion,
    job_title: jobTitle,
  }, { timeout: 12000 });
  return response.data;
}

export async function generateTTS(text, lang = 'mn') {
  const voice = lang === 'en' ? 'en-US-AvaNeural' : 'mn-MN-YesuiNeural';
  const response = await api.post('/api/tts/generate', { text, voice }, {
    responseType: 'blob',
    timeout: 15000,
  });
  return response.data;
}

export async function fetchBreakdown({ sessionId, questionIndex, question, userAnswer, lang = 'mn', durationSeconds = 0, wasVoice = false, sampleAnswer = null }) {
  const response = await api.post('/api/feedback/breakdown', {
    session_id: sessionId,
    question_index: questionIndex,
    question,
    user_answer: userAnswer,
    lang,
    duration_seconds: durationSeconds,
    was_voice: wasVoice,
    sample_answer: sampleAnswer,
  }, { timeout: 60000 });
  return response.data;
}

export async function healthCheck() {
  const response = await api.get('/api/health');
  return response.data;
}
