import { createContext, useContext, useState } from 'react';

const translations = {
  header_title: { mn: 'AI Interview Coach', en: 'AI Interview Coach' },
  header_subtitle: { mn: 'Ажлын ярилцлагын дасгалжуулагч', en: 'Job Interview Practice Coach' },
  setup_title: { mn: 'Ярилцлагын дасгал', en: 'Interview Practice Session' },
  setup_desc: { mn: 'Ажлын төрлөө сонгоод, ярилцлагын дасгалаа эхлүүлээрэй. Та асуултуудад хариулж, төгсгөлд нь дэлгэрэнгүй үнэлгээ авна.', en: 'Select a job category and start your mock interview. You will answer questions, and receive detailed feedback at the end.' },
  btn_start: { mn: 'Ярилцлага эхлүүлэх', en: 'Start Interview' },
  btn_loading: { mn: 'Ачааллаж байна...', en: 'Loading...' },
  analyzing: { mn: 'Хариултуудыг шинжилж байна...', en: 'Analyzing your responses...' },
  err_load: { mn: 'Асуултуудыг ачаалж чадсангүй. Сервер ажиллаж байгаа эсэхийг шалгана уу.', en: 'Failed to load questions. Make sure the backend is running.' },
  err_analyze: { mn: 'Хариултуудыг шинжлэхэд алдаа гарлаа. Дахин оролдоно уу.', en: 'Failed to analyze responses. Please try again.' },
  job_category: { mn: 'Ажлын төрөл', en: 'Job Category' },
  job_placeholder: { mn: '-- Төрөл сонгоно уу (заавал биш) --', en: '-- Select a category (optional) --' },
  skills_desc: { mn: 'Энэ салбарт шаардагдах гол ур чадварууд. Таны хариултыг эдгээр чадваруудтай уялдуулж үнэлнэ.', en: 'Key skills required in this field. Your answers will be evaluated against these skills.' },
  example_companies: { mn: 'Жишээ компаниуд:', en: 'Example companies:' },
  progress: { mn: 'Асуулт', en: 'Question' },
  interviewer: { mn: 'Ярилцлага авагч', en: 'Interviewer' },
  replay: { mn: 'Дахин сонсох', en: 'Replay' },
  you: { mn: 'Ажил горилогч', en: 'Applicant' },
  session_complete: { mn: 'Ярилцлага дууслаа! Хариултуудыг шинжилж байна...', en: 'Session complete! Analyzing your responses...' },
  tab_text: { mn: 'Бичих', en: 'Text' },
  tab_audio: { mn: 'Ярих', en: 'Audio' },
  placeholder_answer: { mn: 'Хариултаа бичнэ үү...', en: 'Type your answer...' },
  btn_send: { mn: 'Илгээх', en: 'Send' },
  transcribing: { mn: 'Хөрвүүлж байна...', en: 'Transcribing...' },
  btn_stop: { mn: 'Зогсоох', en: 'Stop' },
  btn_record: { mn: 'Бичлэг', en: 'Record' },
  recording: { mn: 'Бичиж байна...', en: 'Recording...' },
  audio_err_empty: { mn: 'Хөрвүүлэлт хоосон байна. Дахин оролдоно уу.', en: 'Transcription was empty. Please try again.' },
  audio_err_fail: { mn: 'Хөрвүүлэлт амжилтгүй боллоо. Дахин оролдоно уу.', en: 'Transcription failed. Please try again.' },
  results_title: { mn: 'Ярилцлагын үр дүн', en: 'Interview Results' },
  questions_answered: { mn: 'асуултанд хариулсан', en: 'questions answered' },
  total_time: { mn: 'нийт хугацаа', en: 'total time' },
  overall_score: { mn: 'Нийт оноо', en: 'Overall Score' },
  key_feedback: { mn: 'Гол үнэлгээ', en: 'Key Feedback' },
  strengths: { mn: 'Давуу тал', en: 'Strengths' },
  improvements: { mn: 'Сайжруулах зүйлс', en: 'Areas to Improve' },
  suggestions: { mn: 'Зөвлөмж', en: 'Suggestions' },
  per_question: { mn: 'Асуулт тус бүрийн задаргаа', en: 'Per-Question Breakdown' },
  q_prefix: { mn: 'А', en: 'Q' },
  btn_back: { mn: 'Буцах', en: 'Back' },
  btn_back_confirm: { mn: 'Ярилцлагаа орхиж буцах уу?', en: 'Leave the interview and go back?' },
  btn_new_session: { mn: 'Шинэ ярилцлага эхлүүлэх', en: 'Start New Session' },
  score_word_count: { mn: 'Үгийн тоо', en: 'Word Count' },
  score_filler: { mn: 'Хоосон үгс', en: 'Filler Words' },
  score_ttr: { mn: 'Үгийн сан', en: 'Vocabulary' },
  score_structure: { mn: 'Бүтэц', en: 'Structure' },
  score_relevance: { mn: 'Хамаарал', en: 'Relevance' },
  history_title: { mn: 'Өмнөх ярилцлагууд', en: 'Past Interviews' },
  history_clear: { mn: 'Түүх цэвэрлэх', en: 'Clear History' },
  history_score: { mn: 'оноо', en: 'score' },
  sample_answer: { mn: 'Жишиг хариулт', en: 'Sample Answer' },
  btn_export_pdf: { mn: 'PDF татах', en: 'Export PDF' },
  tab_quick_start: { mn: 'Эхлэх', en: 'Quick Start' },
  tab_customize: { mn: 'Тохируулах', en: 'Customize' },
  jd_label: { mn: 'Ажлын зарын тайлбар', en: 'Job Description' },
  jd_placeholder: { mn: 'Ажлын зарын текстийг энд буулгана уу...', en: 'Paste the job listing text here...' },
  resume_label: { mn: 'CV оруулах', en: 'Upload Resume' },
  resume_hint: { mn: 'PDF эсвэл Word файл (.pdf, .docx)', en: 'PDF or Word file (.pdf, .docx)' },
  resume_uploaded: { mn: 'CV амжилттай уншигдлаа', en: 'Resume parsed successfully' },
  resume_skills: { mn: 'CV-с олдсон ур чадварууд', en: 'Skills found in resume' },
  progress_title: { mn: 'Хөгжлийн график', en: 'Progress Chart' },
  progress_empty: { mn: 'Дор хаяж 2 ярилцлага дуусгаж, хөгжлийн графикаа харна уу.', en: 'Complete at least 2 interviews to see your progress chart.' },
  nav_dashboard: { mn: 'Хянах самбар', en: 'Dashboard' },
  nav_practice: { mn: 'Дасгал', en: 'Practice' },
  nav_history: { mn: 'Түүх', en: 'History' },
  getting_started: { mn: 'Эхлэх заавар', en: 'Getting Started' },
  getting_started_desc: { mn: 'Дасгалаа эхлүүлэхийн тулд дараах алхмуудыг дагана уу', en: 'Follow these steps to begin your practice session' },
  step1_title: { mn: 'Төрөл сонгох', en: 'Choose Category' },
  step1_desc: { mn: 'Ажлын төрөл сонгоод эсвэл ажлын зарын тайлбар оруулна уу', en: 'Pick a job type or paste a job description' },
  step2_title: { mn: 'Дасгал хийх', en: 'Practice Interview' },
  step2_desc: { mn: 'AI-ийн бэлдсэн асуултуудад хариулна уу', en: 'Answer AI-generated interview questions' },
  step3_title: { mn: 'Үнэлгээ авах', en: 'Get Feedback' },
  step3_desc: { mn: 'Дэлгэрэнгүй оноо, зөвлөмж авна уу', en: 'Receive detailed scores and improvement tips' },
  history_view_desc: { mn: 'Таны өмнөх ярилцлагын түүх болон хөгжлийн график', en: 'Your past interview history and progress chart' },
  welcome_tagline: { mn: 'Ярилцлагандаа итгэлтэй бэлдээрэй', en: 'Prepare confidently for your interview' },
  welcome_cta: { mn: 'Эхлэх', en: 'Get Started' },
  welcome_users: { mn: 'Хэрэглэгч', en: 'Users' },
  welcome_avg_score: { mn: 'Дундаж оноо', en: 'Avg Score' },
  welcome_fields: { mn: 'Ажлын салбар', en: 'Job Fields' },
};

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState('mn');

  function t(key) {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry.mn || key;
  }

  function toggleLang() {
    setLang((prev) => (prev === 'mn' ? 'en' : 'mn'));
  }

  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
