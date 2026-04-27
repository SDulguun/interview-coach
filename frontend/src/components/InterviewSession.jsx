import { useState, useEffect, useRef } from 'react';
import {
  User, Clock, MessageSquare, BarChart3, Send, Mic, Square,
  Pencil, FileText, Lightbulb, ArrowRight, AlertTriangle, Check, X,
} from 'lucide-react';
import { transcribeAudio, generateTTS } from '../api';
import { useLang } from '../lang';
import { classifyQuestion, formatTime, getQuestionPhase } from '../utils';
import './interview-session.css';

/* ============================================================
   TIME CONFIG — separate for text (writing) vs audio (voice)
   Writing in Mongolian needs significantly more time.
   ============================================================ */
const TIME_CONFIG = {
  text: {
    easy:   { recommended: 300, autoAdvance: 420 },
    medium: { recommended: 240, autoAdvance: 360 },
    hard:   { recommended: 180, autoAdvance: 300 },
  },
  audio: {
    easy:   { recommended: 120, autoAdvance: 150 },
    medium: { recommended: 90,  autoAdvance: 120 },
    hard:   { recommended: 60,  autoAdvance: 90  },
  },
};

const DIFFICULTY_LABELS = {
  easy:   { mn: 'Хөнгөн', en: 'Easy' },
  medium: { mn: 'Дунд', en: 'Medium' },
  hard:   { mn: 'Хүнд', en: 'Hard' },
};

/* ============================================================
   COMPANY INTRO — short structured content for the intro card
   ============================================================ */
const COMPANY_CONTEXTS = {
  mn: {
    'Мэдээллийн технологи': { name: 'TechNova LLC', desc: 'Технологийн салбарт шинэлэг бүтээгдэхүүн хөгжүүлдэг.' },
    'Санхүү, Нягтлан бодох бүртгэл': { name: 'CapitalTrust Partners', desc: 'Санхүүгийн мэргэжлийн үйлчилгээ үзүүлдэг.' },
    'Маркетинг, Борлуулалт': { name: 'MarketEdge Group', desc: 'Зах зээлд тэргүүлэгч бүтээгдэхүүнүүдийг хэрэглэгчдэд хүргэдэг.' },
    'Хүний нөөц': { name: 'PeopleFirst HR', desc: 'Хүний нөөцийн удирдлагаар дамжуулан байгууллагын соёлыг бэхжүүлдэг.' },
    'Боловсрол': { name: 'EduPioneer Institute', desc: 'Боловсролын салбарт шинэлэг арга барил нэвтрүүлдэг.' },
    'Эрүүл мэнд': { name: 'VitaCare Health', desc: 'Эрүүл мэндийн салбарт чанартай үйлчилгээ хүргэдэг.' },
    'Инженер, Үйлдвэрлэл': { name: 'Apex Engineering', desc: 'Инженерийн салбарт дэвшилтэт шийдэл боловсруулдаг.' },
    'Зочлох үйлчилгээ': { name: 'Grand Horizon Hotels', desc: 'Зочлох үйлчилгээний салбарт дээд зэргийн туршлага хүргэдэг.' },
    'Хууль, эрх зүй': { name: 'JusticePro Law', desc: 'Хууль зүйн мэргэжлийн зөвлөх үйлчилгээ үзүүлдэг.' },
    'Дизайн, Уран бүтээл': { name: 'Pixel Studio', desc: 'Бүтээлч дизайны шийдлүүдээр хэрэглэгчийн туршлагыг сайжруулдаг.' },
  },
  en: {
    'Мэдээллийн технологи': { name: 'TechNova LLC', desc: 'Develops innovative technology products.' },
    'Санхүү, Нягтлан бодох бүртгэл': { name: 'CapitalTrust Partners', desc: 'Provides professional financial services.' },
    'Маркетинг, Борлуулалт': { name: 'MarketEdge Group', desc: 'Delivers market-leading products to consumers.' },
    'Хүний нөөц': { name: 'PeopleFirst HR', desc: 'Strengthens organizational culture through HR management.' },
    'Боловсрол': { name: 'EduPioneer Institute', desc: 'Introduces innovative approaches in education.' },
    'Эрүүл мэнд': { name: 'VitaCare Health', desc: 'Delivers quality healthcare services.' },
    'Инженер, Үйлдвэрлэл': { name: 'Apex Engineering', desc: 'Develops advanced engineering solutions.' },
    'Зочлох үйлчилгээ': { name: 'Grand Horizon Hotels', desc: 'Delivers premium guest experiences.' },
    'Хууль, эрх зүй': { name: 'JusticePro Law', desc: 'Provides professional legal advisory services.' },
    'Дизайн, Уран бүтээл': { name: 'Pixel Studio', desc: 'Improves user experiences through creative design.' },
  },
};

// Industry-keyed fallbacks for jobs that aren't in COMPANY_CONTEXTS — keeps
// the interviewer's company line plausible instead of a generic "manai bayguullaga".
const INDUSTRY_FALLBACKS = {
  mn: {
    tech: { name: 'AltanLink Technologies', desc: 'Дотоодын IT шийдлийг үндэсний хэмжээнд нэвтрүүлдэг компани.' },
    finance: { name: 'TugrikTrust Capital', desc: 'Хувийн хадгаламж, корпорат санхүүгийн үйлчилгээ үзүүлдэг.' },
    marketing: { name: 'BrightSteppe Agency', desc: 'Брэндийн стратеги, дижитал маркетингийн агентлаг.' },
    education: { name: 'NuruuLearn Academy', desc: 'Орчин үеийн сургалтын платформ хөгжүүлдэг.' },
    health: { name: 'SaikhanCare Clinic', desc: 'Хувийн эмнэлэг, үйлчилгээ голчилсон үндсэн нэгж.' },
    engineering: { name: 'BatBuild Engineering', desc: 'Дэд бүтэц, барилгын инженерийн төсөл хариуцдаг.' },
    hospitality: { name: 'GerLuxe Hospitality', desc: 'Аялал жуулчлал, зочид буудлын үйлчилгээний группа.' },
    legal: { name: 'TungalagLaw Partners', desc: 'Корпорат хууль зүйн зөвлөх үйлчилгээ үзүүлдэг.' },
    design: { name: 'TsasanArt Studio', desc: 'UI/UX, брэнд дизайн зориулсан студи.' },
    other: { name: 'Khanbogd Group', desc: 'Олон салбарт үйл ажиллагаа явуулдаг бизнесийн групп.' },
  },
  en: {
    tech: { name: 'AltanLink Technologies', desc: 'Domestic IT solutions deployed at national scale.' },
    finance: { name: 'TugrikTrust Capital', desc: 'Personal savings and corporate finance services.' },
    marketing: { name: 'BrightSteppe Agency', desc: 'Brand strategy and digital marketing agency.' },
    education: { name: 'NuruuLearn Academy', desc: 'Modern learning platform for working professionals.' },
    health: { name: 'SaikhanCare Clinic', desc: 'Private clinic focused on patient-centric care.' },
    engineering: { name: 'BatBuild Engineering', desc: 'Infrastructure and civil engineering project leader.' },
    hospitality: { name: 'GerLuxe Hospitality', desc: 'Travel and hospitality group operating premium properties.' },
    legal: { name: 'TungalagLaw Partners', desc: 'Corporate legal advisory and compliance services.' },
    design: { name: 'TsasanArt Studio', desc: 'UI/UX and brand design studio for digital products.' },
    other: { name: 'Khanbogd Group', desc: 'Diversified business group across multiple sectors.' },
  },
};

function _industryKey(jobTitle = '') {
  const t = (jobTitle || '').toLowerCase();
  if (/it|програм|developer|engineer|software|tech/.test(t)) return 'tech';
  if (/санхүү|finance|банк|bank|account|audit|нягтлан/.test(t)) return 'finance';
  if (/маркетинг|marketing|brand|advert|seo|smm/.test(t)) return 'marketing';
  if (/боловсрол|education|teacher|багш|tutor|сургалт/.test(t)) return 'education';
  if (/эрүүл|health|doctor|nurse|сувилагч|эмч/.test(t)) return 'health';
  if (/инженер|engineering|механик|үйлдвэр|construction/.test(t)) return 'engineering';
  if (/зочлох|hospitality|hotel|зоог|tourism|аялал/.test(t)) return 'hospitality';
  if (/хууль|legal|law|өмгөөлөг/.test(t)) return 'legal';
  if (/дизайн|design|ux|ui|art|creative|уран/.test(t)) return 'design';
  return 'other';
}

function getCompanyContext(jobTitle, lang) {
  const ctxMap = COMPANY_CONTEXTS[lang] || COMPANY_CONTEXTS.mn;
  if (ctxMap[jobTitle]) return ctxMap[jobTitle];
  const fallbacks = INDUSTRY_FALLBACKS[lang] || INDUSTRY_FALLBACKS.mn;
  return fallbacks[_industryKey(jobTitle)] || fallbacks.other;
}

/* ============================================================
   ANSWER-AWARE RESPONSE GENERATOR
   ============================================================ */
function pickRandom(arr) {
  if (!arr || arr.length === 0) return '';
  return arr[Math.floor(Math.random() * arr.length)];
}

// Short transition pool — what a real interviewer says between questions.
// Brief, neutral-warm, no evaluation. The user gets feedback on the results
// screen, not in the moment. Keep each entry to 5-6 words max.
const SHORT_TRANSITIONS = {
  mn: [
    'За.',
    'Аан за.',
    'За ойлголоо.',
    'Тэгье.',
    'Бэлэн үү?',
    'Зүгээр.',
    'Тийм ээ.',
    'Ойлголоо.',
    'За тэгвэл.',
    'За ингээд.',
    'Дараагийнх руу шилжье.',
    'Дараагийн асуулт.',
    'Үргэлжлүүлье.',
    'За цааш нь.',
    'Тэгье, дараагийнх.',
    'За, дараагийн асуулт.',
    'Аан тийм.',
    'За за.',
  ],
  en: [
    'Okay.',
    'Got it.',
    'Alright.',
    'Mm-hm.',
    'Right.',
    'Sure.',
    'Understood.',
    'Next one.',
    'Let\'s continue.',
    'Moving on.',
    'Next question.',
    'Okay, next.',
    'Alright then.',
    'Got it, thanks.',
    'Sounds good.',
  ],
};

const DONT_KNOW_TRANSITIONS = {
  mn: ['Зүгээр.', 'Зүгээр, цааш нь.', 'Ойлголоо. Дараагийнх.', 'Зүгээр шүү.'],
  en: ['No worries.', 'That\'s fine.', 'No problem, next.', 'Alright.'],
};

let _lastTransition = '';

function pickShortTransition(lang, isDontKnow = false) {
  const pool = isDontKnow
    ? (DONT_KNOW_TRANSITIONS[lang] || DONT_KNOW_TRANSITIONS.mn)
    : (SHORT_TRANSITIONS[lang] || SHORT_TRANSITIONS.mn);
  if (pool.length <= 1) return pool[0] || '';
  let pick = pool[Math.floor(Math.random() * pool.length)];
  // Avoid back-to-back repeats
  let guard = 0;
  while (pick === _lastTransition && guard < 5) {
    pick = pool[Math.floor(Math.random() * pool.length)];
    guard += 1;
  }
  _lastTransition = pick;
  return pick;
}

const DONT_KNOW_PATTERNS = /^(\s*)(мэдэхгүй|мэдэхгүй\s*байна|хариулж\s*чадахгүй|санахгүй\s*байна|эргэлз|хэлж\s*мэдэхгүй|i\s*don'?t\s*know|idk|dunno|no\s*idea|not\s*sure|pass|skip|n\/?a)(\s*[.!?]*)?\s*$/i;

function classifyAnswer(answerText) {
  const trimmed = (answerText || '').trim();
  if (!trimmed) return 'empty';
  if (DONT_KNOW_PATTERNS.test(trimmed)) return 'dontknow';
  const wc = trimmed.split(/\s+/).filter(Boolean).length;
  if (wc <= 5) return 'dontknow_like';
  if (wc < 15) return 'too_short';
  if (wc > 60) return 'substantive';
  return 'normal';
}

/* Hard-mode probing — occasionally pushes for more depth */
const HARD_PROBES = {
  mn: [
    'Тодорхой тоо, хэмжигдэхүүн дурдаж чадах уу?',
    'Юуг юуны төлөө орхих шийдвэр гаргасан бэ?',
    'Энэ туршлагаас юу суралцсан бэ?',
    'Бусдад ямар нөлөө үзүүлсэн бэ?',
  ],
  en: [
    'Can you quantify the impact?',
    'What trade-offs did you consider?',
    'What did you learn from that experience?',
    'How did that affect others on the team?',
  ],
};

function generateInterviewerReaction(answerText, questionCategory, nextQuestion, isLastQuestion, lang, diff) {
  const answerKind = classifyAnswer(answerText);

  // Final question gets the warm closing — that's a goodbye, not a transition.
  if (isLastQuestion) {
    if (questionCategory === 'closing' && looksLikeQuestion(answerText)) {
      return generateClosingResponse(answerText, lang);
    }
    return lang === 'mn'
      ? 'Цагаа гарган ярилцлагад оролцсонд тань маш их баярлалаа. Бид удахгүй эргэж холбогдох болно — танд амжилт хүсье!'
      : 'Thank you so much for taking the time today — we really enjoyed the conversation and will be in touch soon. Best of luck!';
  }

  const isDontKnow = answerKind === 'dontknow' || answerKind === 'empty' || answerKind === 'dontknow_like';
  const transition = pickShortTransition(lang, isDontKnow);

  // Hard mode: ~25% chance of a follow-up probe — still kept short.
  if (diff === 'hard' && !isDontKnow && answerKind !== 'too_short' && Math.random() < 0.25) {
    const probe = pickRandom(HARD_PROBES[lang] || HARD_PROBES.mn);
    return `${transition} ${probe}`;
  }

  return transition;
}

/* ============================================================
   HELPERS
   ============================================================ */
function sanitizeQuestion(q) {
  if (!q || !q.question) return q;
  const text = q.question;
  if (text.match(/^\[.*даалгавар\]\s*$/)) {
    return { ...q, question: q.sample_answer ? q.question : text.replace(/\[.*даалгавар\]\s*/, '').trim() };
  }
  if (text.includes('[Техникийн даалгавар]')) {
    const cleaned = text.replace(/\[Техникийн даалгавар\]\s*/g, '').trim();
    if (cleaned.length > 10) return { ...q, question: cleaned };
  }
  return q;
}

function looksLikeQuestion(text) {
  if (!text) return false;
  const t = text.trim();
  return t.includes('?') || t.includes(' уу') || t.includes(' вэ') ||
    t.includes(' юу ') || t.includes('мэдэхийг') || t.includes('хүсч байна') ||
    t.includes('тухай') || t.includes('would') || t.includes('could') || t.includes('what');
}

function generateClosingResponse(answer, lang) {
  const lower = answer.toLowerCase();
  const parts = [];
  if (lang === 'mn') {
    if (lower.includes('onboarding') || lower.includes('эхний') || lower.includes('сар')) {
      parts.push('Эхний 3 сард танд ментор хуваарилагдах бөгөөд багийн ажлын горим, хэрэгсэл, дотоод процессуудтай танилцах болно.');
    } else if (lower.includes('баг') || lower.includes('соёл') || lower.includes('хамт олон')) {
      parts.push('Манай баг нээлттэй харилцааг эрхэмлэдэг. Долоо хоног тутмын багийн уулзалт байдаг.');
    } else if (lower.includes('хөгжил') || lower.includes('өсөлт') || lower.includes('карьер')) {
      parts.push('Бид ажилтнуудын мэргэжлийн хөгжилд ихээхэн анхаардаг.');
    } else {
      parts.push('Сайн асуулт байна. Дараагийн шатны уулзалтад дэлгэрэнгүй ярилцах боломжтой.');
    }
    parts.push('Таны ярилцлагад оролцсонд баярлалаа. Амжилт хүсье!');
  } else {
    if (lower.includes('onboarding') || lower.includes('first') || lower.includes('month')) {
      parts.push('In the first three months, you would be paired with a mentor to get familiar with our workflows and processes.');
    } else if (lower.includes('team') || lower.includes('culture') || lower.includes('environment')) {
      parts.push('Our team values open communication. We have weekly meetings and encourage knowledge sharing.');
    } else if (lower.includes('growth') || lower.includes('career') || lower.includes('develop')) {
      parts.push('We invest in professional development with performance reviews twice a year.');
    } else {
      parts.push('Great question. We can discuss that in more detail during the next stage.');
    }
    parts.push('Thank you for coming in today. We will be in touch soon. Best of luck!');
  }
  return parts.join(' ');
}

/* ============================================================
   COMPONENT
   ============================================================ */
function InterviewSession({ questions: rawQuestions, onSessionEnd, difficulty = 'medium', jobTitle = '', userName = '' }) {
  const questions = rawQuestions.map(sanitizeQuestion);
  const { t, lang } = useLang();

  /* ─── CENTRALIZED AUDIO CONTROLLER ───
     Only one voice plays at a time. Every new playback cancels the previous.
     A generation counter detects stale TTS responses that arrive late. */
  const audioGenRef = useRef(0);
  const currentAudioRef = useRef(null);

  function stopAudio() {
    audioGenRef.current++;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  }

  async function playTTSAudio(text) {
    stopAudio();
    const gen = audioGenRef.current;
    try {
      const blob = await generateTTS(text, lang);
      if (gen !== audioGenRef.current) return; // stale
      if (blob?.size > 0) {
        const audio = new Audio(URL.createObjectURL(blob));
        currentAudioRef.current = audio;
        audio.play().catch(() => {});
      }
    } catch { /* silent */ }
  }

  /* ─── STATE ───
     phase: 'intro' → 'questioning' → 'responding' → 'questioning' → ... → 'complete' */
  const [phase, setPhase] = useState('intro');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answeredPairs, setAnsweredPairs] = useState([]);

  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [audioError, setAudioError] = useState('');

  const [startTime] = useState(Date.now());
  const [questionTime, setQuestionTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [questionElapsed, setQuestionElapsed] = useState(0);

  // Question typing
  const [questionDisplayText, setQuestionDisplayText] = useState('');
  const [questionTypingDone, setQuestionTypingDone] = useState(false);
  const [inputReady, setInputReady] = useState(false);

  // Interviewer response typing (between questions)
  const [responseMessage, setResponseMessage] = useState('');
  const [responseDisplayText, setResponseDisplayText] = useState('');
  const [responseTypingDone, setResponseTypingDone] = useState(false);
  const [isLastAnswer, setIsLastAnswer] = useState(false);
  const [answerWordCount, setAnswerWordCount] = useState(0);
  const [interviewerThinking, setInterviewerThinking] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const transcriptEndRef = useRef(null);
  const textareaRef = useRef(null);
  const lastSubmitRef = useRef(0);
  const manuallyStoppedRef = useRef(false);
  const recordingStartRef = useRef(0);
  const restartCountRef = useRef(0);

  /* ─── COMPUTED ─── */
  const timeConfig = (TIME_CONFIG[inputMode] || TIME_CONFIG.text)[difficulty] || TIME_CONFIG.text.medium;
  const currentQuestion = questions[currentIndex];
  const questionTag = currentQuestion ? classifyQuestion(currentQuestion.question, currentQuestion.category) : 'general';
  const wordCount = inputText.trim().split(/\s+/).filter(Boolean).length;

  const timerPercent = Math.min((questionElapsed / timeConfig.recommended) * 100, 100);
  const timerWarning = questionElapsed > timeConfig.recommended;
  const showAutoAdvanceWarning = phase === 'questioning' && questionElapsed >= timeConfig.recommended && questionElapsed < timeConfig.autoAdvance;
  const autoAdvanceCountdown = timeConfig.autoAdvance - questionElapsed;

  const companyCtx = getCompanyContext(jobTitle, lang);
  const diffLabel = (DIFFICULTY_LABELS[difficulty] || DIFFICULTY_LABELS.medium)[lang];
  const estimatedMinutes = Math.ceil((questions.length * (inputMode === 'text' ? timeConfig.recommended : timeConfig.recommended)) / 60);

  /* ─── EFFECTS ─── */

  // Question phase — typing animation + TTS
  useEffect(() => {
    if (phase !== 'questioning' || !currentQuestion) return;
    setQuestionDisplayText('');
    setQuestionTypingDone(false);
    setInputReady(false);
    const words = currentQuestion.question.split(' ');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setQuestionDisplayText(words.slice(0, i).join(' '));
      if (i >= words.length) { clearInterval(interval); setQuestionTypingDone(true); }
    }, 60);
    const ttsTimer = setTimeout(() => {
      if (currentQuestion) playTTSAudio(currentQuestion.question);
    }, 400);
    return () => { clearInterval(interval); clearTimeout(ttsTimer); };
  }, [phase, currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Input ready delay after question typing finishes
  useEffect(() => {
    if (!questionTypingDone || phase !== 'questioning') { setInputReady(false); return; }
    const timer = setTimeout(() => setInputReady(true), 500);
    return () => clearTimeout(timer);
  }, [questionTypingDone, phase]);

  // Response phase — thinking pause → typing animation + TTS
  useEffect(() => {
    if (phase !== 'responding' || !responseMessage) return;
    setResponseDisplayText('');
    setResponseTypingDone(false);
    setInterviewerThinking(true);

    // Brief beat before the transition appears. Short responses (the new
    // 5-6 word transitions) get a quick pause; the goodbye gets a longer one.
    const respWords = (responseMessage || '').split(/\s+/).filter(Boolean).length;
    const thinkMs = respWords <= 8
      ? 350
      : Math.min(700 + answerWordCount * 20, 2500);

    let typingInterval = null;
    const thinkTimer = setTimeout(() => {
      setInterviewerThinking(false);
      const words = responseMessage.split(' ');
      let i = 0;
      typingInterval = setInterval(() => {
        i++;
        setResponseDisplayText(words.slice(0, i).join(' '));
        if (i >= words.length) { clearInterval(typingInterval); typingInterval = null; setResponseTypingDone(true); }
      }, 90);
      playTTSAudio(responseMessage);
    }, thinkMs);

    return () => {
      clearTimeout(thinkTimer);
      if (typingInterval) clearInterval(typingInterval);
      setInterviewerThinking(false);
    };
  }, [phase, responseMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  // After response typing is done → advance to next question (unless last)
  // Short transitions stay on screen ~1.3s before the next question fades in.
  // Longer responses (the final-question goodbye) get a longer beat to read.
  useEffect(() => {
    if (phase !== 'responding' || !responseTypingDone || isLastAnswer) return;
    const respWc = (responseMessage || '').split(/\s+/).filter(Boolean).length;
    const postPause = respWc <= 8 ? 1300 : Math.min(2000 + respWc * 30, 3500);
    const timer = setTimeout(() => {
      setPhase('questioning');
      setQuestionTime(Date.now());
      setQuestionElapsed(0);
    }, postPause);
    return () => clearTimeout(timer);
  }, [responseTypingDone, phase, isLastAnswer, responseMessage]);

  // Session timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Per-question timer (only during questioning)
  useEffect(() => {
    if (phase !== 'questioning') return;
    const timer = setInterval(() => setQuestionElapsed(Math.floor((Date.now() - questionTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [questionTime, phase]);

  // Auto-advance (skip question when timer expires).
  // Never fires while voice capture is active — voice answers end only when
  // the user explicitly submits (clicks Илгээх → or stops the recording).
  useEffect(() => {
    if (phase !== 'questioning' || !questionTypingDone) return;
    if (recording || transcribing) return;
    if (questionElapsed >= timeConfig.autoAdvance) handleAutoSkip();
  }, [questionElapsed, phase, questionTypingDone, recording, transcribing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus textarea when answer input becomes ready
  useEffect(() => {
    if (inputReady && phase === 'questioning' && textareaRef.current) textareaRef.current.focus();
  }, [inputReady, phase]);

  // Scroll transcript on new answers
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [answeredPairs]);

  // Cleanup on unmount
  useEffect(() => () => {
    stopAudio();
    if (streamRef.current) streamRef.current.getTracks().forEach(tr => tr.stop());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ─── HANDLERS ─── */

  function startInterview() {
    stopAudio();
    setPhase('questioning');
    setQuestionTime(Date.now());
    setQuestionElapsed(0);
  }

  function submitAnswer(answerText) {
    if (!answerText.trim()) return;
    stopAudio();

    const timeTaken = Math.floor((Date.now() - questionTime) / 1000);
    const pair = {
      question: currentQuestion.question,
      answer: answerText,
      timeTaken,
      tag: classifyQuestion(currentQuestion.question, currentQuestion.category),
      skipped: false,
    };

    const nextIndex = currentIndex + 1;
    const isLast = nextIndex >= questions.length;
    const nextQ = isLast ? null : questions[nextIndex];

    const response = generateInterviewerReaction(answerText, currentQuestion.category, nextQ, isLast, lang, difficulty);

    const wc = (answerText || '').trim().split(/\s+/).filter(Boolean).length;
    setAnswerWordCount(wc);
    setAnsweredPairs(prev => [...prev, pair]);
    setInputText('');
    setCurrentIndex(nextIndex);
    setResponseMessage(response);
    setIsLastAnswer(isLast);
    setPhase('responding');
  }

  function handleAutoSkip() {
    const timeTaken = Math.floor((Date.now() - questionTime) / 1000);
    const pair = {
      question: currentQuestion.question,
      answer: '',
      timeTaken,
      tag: classifyQuestion(currentQuestion.question, currentQuestion.category),
      skipped: true,
    };
    const nextIndex = currentIndex + 1;
    const isLast = nextIndex >= questions.length;

    setAnsweredPairs(prev => [...prev, pair]);
    setInputText('');
    setCurrentIndex(nextIndex);

    if (isLast) {
      handleEndInterview();
    } else {
      setQuestionTime(Date.now());
      setQuestionElapsed(0);
    }
  }

  function handleEndInterview() {
    stopAudio();
    const totalDuration = Math.floor((Date.now() - startTime) / 1000);
    const answers = answeredPairs.filter(p => !p.skipped).map(p => ({ question: p.question, text: p.answer }));
    setPhase('complete');
    onSessionEnd(answers, totalDuration);
  }

  function handleTextSubmit() {
    const now = Date.now();
    if (now - lastSubmitRef.current < 1000) return;
    lastSubmitRef.current = now;
    submitAnswer(inputText);
  }

  /* ─── RECORDING ─── */

  function getRecorderMimeType() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
    for (const tp of types) {
      if (!tp || MediaRecorder.isTypeSupported(tp)) return tp || undefined;
    }
    return undefined;
  }

  function getFileExtension(mimeType) {
    if (!mimeType) return 'webm';
    if (mimeType.includes('ogg')) return 'ogg';
    if (mimeType.includes('mp4')) return 'mp4';
    return 'webm';
  }

  async function startRecording() {
    setAudioError('');
    stopAudio();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = getRecorderMimeType();
      const options = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      manuallyStoppedRef.current = false;
      recordingStartRef.current = Date.now();
      console.log('[voice] start', { ts: Date.now(), mime: mimeType, restart: restartCountRef.current });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log('[voice] chunk', { ts: Date.now(), size: e.data.size, total: chunksRef.current.length });
        }
      };

      mediaRecorder.onerror = (ev) => {
        console.error('[voice] error', { ts: Date.now(), err: ev?.error?.name || ev });
        setRecording(false);
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
        setAudioError(lang === 'mn' ? 'Бичлэг хийгдсэнгүй.' : 'Recording failed.');
        setTimeout(() => setAudioError(''), 5000);
      };

      mediaRecorder.onstop = async () => {
        const elapsed = Date.now() - recordingStartRef.current;
        const wasManual = manuallyStoppedRef.current;
        console.log('[voice] stop', { ts: Date.now(), elapsedMs: elapsed, manual: wasManual, chunks: chunksRef.current.length });
        stream.getTracks().forEach((tr) => tr.stop());
        streamRef.current = null;
        const usedMime = mediaRecorder.mimeType || 'audio/webm';
        const ext = getFileExtension(usedMime);
        const blob = new Blob(chunksRef.current, { type: usedMime });

        // Auto-restart on unexpected stop (e.g. browser timeout) up to 2 times,
        // unless we already captured useful audio. The user's mid-sentence pauses
        // should never end recording — only their explicit Stop click should.
        if (!wasManual && elapsed < 2000 && restartCountRef.current < 2) {
          restartCountRef.current += 1;
          console.warn('[voice] unexpected early stop — restarting', { restart: restartCountRef.current });
          chunksRef.current = [];
          startRecording();
          return;
        }
        restartCountRef.current = 0;

        if (blob.size < 100) {
          setAudioError(lang === 'mn' ? 'Дуу бичигдсэнгүй. Микрофоноо шалгаарай.' : 'No audio captured. Check your mic.');
          setTimeout(() => setAudioError(''), 5000);
          return;
        }

        setTranscribing(true);
        setAudioError('');
        try {
          const formData = new FormData();
          formData.append('audio', blob, `recording.${ext}`);
          formData.append('question', currentQuestion?.question || '');
          const result = await transcribeAudio(formData);
          const transcription = result.transcription || '';
          console.log('[voice] transcribed', { ts: Date.now(), chars: transcription.length });
          if (transcription.trim()) { submitAnswer(transcription); }
          else { setAudioError(t('audio_err_empty')); setTimeout(() => setAudioError(''), 5000); }
        } catch (e) {
          console.error('[voice] transcribe failed', e);
          setAudioError(t('audio_err_fail'));
          setTimeout(() => setAudioError(''), 5000);
        }
        finally { setTranscribing(false); }
      };

      mediaRecorder.start(1000);
      setRecording(true);
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setAudioError(lang === 'mn' ? 'Микрофоны зөвшөөрөл алга.' : 'Microphone access denied.');
      } else if (err.name === 'NotFoundError') {
        setAudioError(lang === 'mn' ? 'Микрофон олдсонгүй.' : 'No microphone found.');
      } else {
        setAudioError(lang === 'mn' ? 'Микрофон ашиглах боломжгүй байна.' : 'Unable to access microphone.');
      }
      setTimeout(() => setAudioError(''), 6000);
    }
  }

  function stopRecording() {
    const now = Date.now();
    if (now - lastSubmitRef.current < 1000) return;
    lastSubmitRef.current = now;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      manuallyStoppedRef.current = true;
      console.log('[voice] manual stop click', { ts: now });
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  /* ─── TIPS ─── */
  const tips = {
    introduction: lang === 'mn' ? ['Нэр, мэргэжил, туршлагаа дурдаарай', 'Ажлын чиглэлтэй холбоотой зүйлсээ хэлээрэй', '30-60 секундэд багтаарай'] : ['Mention name, field, experience', 'Focus on career-relevant details', 'Keep it under 60 seconds'],
    motivation: lang === 'mn' ? ['Бодит шалтгаанаа хэлээрэй', 'Компани/албан тушаалтай холбоорой'] : ['Give genuine reasons', 'Connect to the role/company'],
    behavioral: lang === 'mn' ? ['STAR аргыг ашигла', 'Бодит жишээ хэлээрэй', 'Суралцсан зүйлээ дурдаарай'] : ['Use STAR method', 'Give a real example', 'Mention what you learned'],
    technical: lang === 'mn' ? ['Тодорхой жишээ, дата хэлээрэй', 'Мэддэг/мэдэхгүй зүйлээ шударгаар хэлээрэй'] : ['Give specific examples with data', 'Be honest about what you know'],
    situational: lang === 'mn' ? ['Алхам алхмаар тайлбарлаарай', 'Шийдвэр гаргах үйл явцаа харуулаарай'] : ['Explain step by step', 'Show your decision-making process'],
    general: lang === 'mn' ? ['Тодорхой, товч хариулаарай', 'Жишээгээр баталгаажуулаарай'] : ['Be clear and concise', 'Support with examples'],
  };
  const currentTips = tips[questionTag] || tips.general;

  const phaseLabels = {
    opening: lang === 'mn' ? 'Нээлт' : 'Opening',
    middle: lang === 'mn' ? 'Үндсэн' : 'Main',
    ending: lang === 'mn' ? 'Хаалт' : 'Closing',
  };

  /* ─── RENDER: Intro Phase — full-width pre-interview screen ─── */
  if (phase === 'intro') {
    return (
      <div className="pre-interview">
        <div className="pre-interview-card">
          <div className="pre-interview-header">
            <div className="pre-interview-avatar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div>
              <h2 className="pre-interview-title">
                {lang === 'mn'
                  ? `${userName?.trim() ? userName.trim() + ', т' : 'Т'}автай морилно уу`
                  : `${userName?.trim() ? userName.trim() + ', w' : 'W'}elcome`}
              </h2>
              <p className="pre-interview-subtitle">{companyCtx.name}</p>
            </div>
          </div>

          <div className="pre-interview-body">
            <p className="pre-interview-company">{companyCtx.desc}</p>

            <div className="pre-interview-details">
              <div className="pre-interview-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                <span>{lang === 'mn' ? `~${estimatedMinutes} минут` : `~${estimatedMinutes} minutes`}</span>
              </div>
              <div className="pre-interview-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                <span>{questions.length} {lang === 'mn' ? 'асуулт' : 'questions'}</span>
              </div>
              <div className="pre-interview-detail">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
                <span>{diffLabel}</span>
              </div>
            </div>

            <div className="pre-interview-structure">
              <h4>{lang === 'mn' ? 'Ярилцлагын Бүтэц' : 'Interview Structure'}</h4>
              <div className="pre-interview-phases">
                <div className="pre-interview-phase">
                  <span className="phase-dot phase-dot-opening" />
                  <span>{lang === 'mn' ? 'Нээлт — танилцуулга, сэдэл' : 'Opening — introduction, motivation'}</span>
                </div>
                <div className="pre-interview-phase">
                  <span className="phase-dot phase-dot-middle" />
                  <span>{lang === 'mn' ? 'Үндсэн — туршлага, ур чадвар, техникийн асуултууд' : 'Main — experience, skills, technical questions'}</span>
                </div>
                <div className="pre-interview-phase">
                  <span className="phase-dot phase-dot-ending" />
                  <span>{lang === 'mn' ? 'Хаалт — зорилго, Таньд тавигдсан асуултууд' : 'Closing — goals, your questions'}</span>
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary pre-interview-start" onClick={startInterview}>
            {lang === 'mn' ? 'Ярилцлага Эхлүүлэх' : 'Start Interview'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    );
  }

  /* ─── RENDER: Main Interview Layout ─── */
  return (
    <div className="interview-workspace">
      {/* LEFT PANEL — question list, timer, progress */}
      <div className="ws-left">
        <div className="ws-left-timer">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <span>{formatTime(elapsed)}</span>
        </div>
        <div className={`ws-difficulty-badge difficulty-${difficulty}`}>
          {diffLabel}
        </div>

        <div className="ws-question-list">
          {(() => {
            let lastPhase = null;
            return questions.map((q, i) => {
              const done = i < answeredPairs.length;
              const active = i === currentIndex && phase === 'questioning';
              const tag = classifyQuestion(q.question, q.category);
              const wasSkipped = done && answeredPairs[i]?.skipped;
              const qPhase = getQuestionPhase(q.category);
              const showPhaseLabel = qPhase !== lastPhase;
              lastPhase = qPhase;
              return (
                <div key={i}>
                  {showPhaseLabel && (
                    <div className={`ws-phase-label phase-${qPhase}`}>{phaseLabels[qPhase]}</div>
                  )}
                  <div className={`ws-q-item ${active ? 'active' : ''} ${done ? 'done' : ''} ${wasSkipped ? 'skipped' : ''}`}>
                    <span className="ws-q-num">
                      {done ? (
                        wasSkipped ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>
                        )
                      ) : i + 1}
                    </span>
                    <span className="ws-q-text">{lang === 'mn' ? `Асуулт ${i + 1}` : `Q${i + 1}`}</span>
                    <span className={`ws-q-tag tag-${tag}`}>{t(`question_tag_${tag}`)}</span>
                  </div>
                </div>
              );
            });
          })()}
        </div>

        <div className="ws-left-footer">
          <div className="ws-progress-bar">
            <div className="ws-progress-fill" style={{ width: `${(answeredPairs.length / questions.length) * 100}%` }} />
          </div>
          <span className="ws-progress-text">{answeredPairs.length}/{questions.length}</span>
        </div>
      </div>

      {/* CENTER PANEL */}
      <div className="ws-center">

        {/* ── Questioning Phase ── */}
        {phase === 'questioning' && currentQuestion && (
          <>
            <div className="ws-center-top">
              <span className="ws-center-progress">
                {t('progress')} {currentIndex + 1} {t('question_of')} {questions.length}
              </span>
              <span className={`question-tag tag-${questionTag}`}>{t(`question_tag_${questionTag}`)}</span>
            </div>

            <div className="ws-question-panel">
              <div className="ws-question-number">
                {lang === 'mn' ? `АСУУЛТ ${String(currentIndex + 1).padStart(2, '0')}` : `QUESTION ${String(currentIndex + 1).padStart(2, '0')}`}
              </div>
              <p className="ws-question-text">
                {questionDisplayText}
                {!questionTypingDone && <span className="typing-cursor">|</span>}
              </p>
            </div>

            {/* Timer bar */}
            <div className="ws-timer-bar">
              <div className={`ws-timer-fill ${timerWarning ? 'warning' : ''}`} style={{ width: `${timerPercent}%` }} />
              <span className="ws-timer-text">{formatTime(questionElapsed)}</span>
            </div>

            {showAutoAdvanceWarning && (
              <div className="auto-advance-warning">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{t('auto_advance_warning')} — {autoAdvanceCountdown} {t('time_warning')}</span>
              </div>
            )}

            {/* Answer section — shown after typing finishes */}
            {inputReady && (
              <div className="ws-answer-section">
                <div className="ws-answer-tabs">
                  <button className={inputMode === 'text' ? 'active' : ''} onClick={() => setInputMode('text')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    {t('tab_text')}
                  </button>
                  <button className={inputMode === 'audio' ? 'active' : ''} onClick={() => setInputMode('audio')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
                    {t('tab_audio')}
                  </button>
                </div>

                {inputMode === 'text' ? (
                  <div className="ws-text-input">
                    <textarea
                      ref={textareaRef}
                      placeholder={t('placeholder_answer')}
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); } }}
                      rows={5}
                    />
                    <div className="ws-text-footer">
                      <span className="ws-word-count">{wordCount} {lang === 'mn' ? 'үг' : 'words'}</span>
                      <span className="ws-timer-mode-hint">
                        {inputMode === 'text'
                          ? (lang === 'mn' ? `Бичгээр: ${formatTime(timeConfig.recommended)}` : `Writing: ${formatTime(timeConfig.recommended)}`)
                          : (lang === 'mn' ? `Дуугаар: ${formatTime(timeConfig.recommended)}` : `Voice: ${formatTime(timeConfig.recommended)}`)}
                      </span>
                      <button className="btn btn-primary ws-send-btn" onClick={handleTextSubmit} disabled={!inputText.trim()}>
                        {t('btn_send')}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ws-audio-input">
                    {transcribing ? (
                      <div className="ws-transcribing"><span className="spinner-small" /> {t('transcribing')}</div>
                    ) : (
                      <div className="ws-audio-controls">
                        <button className={`ws-record-btn ${recording ? 'active' : ''}`} onClick={recording ? stopRecording : startRecording}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill={recording ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/>{recording && <rect x="9" y="9" width="6" height="6" rx="1"/>}</svg>
                          {recording ? t('btn_stop') : t('btn_record')}
                        </button>
                        {recording && <span className="ws-recording-pulse">{t('recording')}</span>}
                      </div>
                    )}
                    {audioError && <p className="ws-audio-error">{audioError}</p>}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ── Responding Phase — interviewer reacts ── */}
        {phase === 'responding' && (
          <div className="ws-response-phase">
            <div className="ws-center-top">
              <span className="ws-center-progress">{t('interviewer')}</span>
            </div>
            <div className="ws-response-panel">
              <div className="ws-response-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <p className="ws-response-text">
                {interviewerThinking ? (
                  <span className="ws-thinking-dots" aria-label="thinking">
                    <span></span><span></span><span></span>
                  </span>
                ) : (
                  <>
                    {responseDisplayText}
                    {!responseTypingDone && <span className="typing-cursor">|</span>}
                  </>
                )}
              </p>
            </div>
            {isLastAnswer && responseTypingDone && (
              <button className="btn btn-primary ws-end-btn" onClick={handleEndInterview}>
                {t('close_interview')}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
              </button>
            )}
          </div>
        )}

        {/* ── Complete Phase ── */}
        {phase === 'complete' && (
          <div className="ws-complete">
            <div className="spinner" />
            <p>{t('session_complete')}</p>
          </div>
        )}
      </div>

      {/* RIGHT PANEL — transcript + tips */}
      <div className="ws-right">
        <div className="ws-right-section">
          <h3 className="ws-right-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            {t('results_transcript')}
          </h3>
          <div className="ws-transcript ws-transcript-compact">
            {answeredPairs.map((pair, i) => (
              <div key={i} className={`ws-transcript-item ${pair.skipped ? 'ws-transcript-skipped' : ''}`}>
                <div className="ws-transcript-header">
                  <span className="ws-transcript-num">{t('q_prefix')}{i + 1}</span>
                  <span className={`ws-q-tag tag-${pair.tag}`}>{t(`question_tag_${pair.tag}`)}</span>
                  <span className="ws-transcript-time">{formatTime(pair.timeTaken)}</span>
                </div>
                {pair.skipped && (
                  <p className="ws-transcript-answer ws-skipped-label">{t('question_skipped')}</p>
                )}
              </div>
            ))}
            {answeredPairs.length === 0 && (
              <p className="ws-transcript-empty">{lang === 'mn' ? 'Хариулсан асуултууд энд харагдана' : 'Answered questions will appear here'}</p>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Tips — only during questioning */}
        {phase === 'questioning' && (
          <div className="ws-right-section ws-tips-section">
            <h3 className="ws-right-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              {lang === 'mn' ? 'Зөвлөмж' : 'Tips'}
            </h3>
            <ul className="ws-tips-list">
              {currentTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default InterviewSession;
