import { createContext, useContext, useState } from 'react';

const translations = {
  header_title: { mn: 'Interview Coach', en: 'Interview Coach' },
  header_subtitle: { mn: 'Ярилцлагын Бэлтгэл', en: 'Job Interview Practice Coach' },
  setup_title: { mn: 'Ярилцлагын Дасгал', en: 'Interview Practice Session' },
  setup_desc: { mn: 'Тав тухаа олоод өөртөө тохирох салбараа сонгоорой. Жинхэнэ ярилцлага биш — алдахаас бүү айгаарай. Төгсгөлд нь дулаахан, бүтээлч үнэлгээ хүлээж авна.', en: 'Take your time and pick a category that fits you. This isn\'t a real interview — no pressure. You\'ll get warm, constructive feedback at the end.' },
  btn_start: { mn: 'Ярилцлага Эхлүүлэх', en: 'Start Interview' },
  btn_loading: { mn: 'Уншиж байна...', en: 'Loading...' },
  analyzing: { mn: 'Хариултыг тань үзэж байна...', en: 'Analyzing your responses...' },
  err_load: { mn: 'Асуулт ачаалж чадсангүй. Сервер ажиллаж байгаа эсэхээ шалгаарай.', en: 'Failed to load questions. Make sure the backend is running.' },
  err_analyze: { mn: 'Шинжилгээ хийхэд алдаа гарлаа. Дахин оролдоорой.', en: 'Failed to analyze responses. Please try again.' },
  err_no_answers: { mn: 'Нэг ч асуултад хариулаагүй байна. Дахин эхлүүлээд ядаж нэгэнд нь хариул — бид хамтарч үзье 🙂', en: 'You did not answer any questions. Try again and answer at least one — we want to help 🙂' },
  job_category: { mn: 'Ажлын Төрөл', en: 'Job Category' },
  job_placeholder: { mn: '-- Төрөл сонгоорой (заавал биш) --', en: '-- Select a category (optional) --' },
  skills_desc: { mn: 'Энэ салбарт хэрэгтэй гол ур чадварууд', en: 'Key skills required in this field' },
  example_companies: { mn: 'Энэ салбарын байгууллагууд:', en: 'Companies in this field:' },
  progress: { mn: 'Асуулт', en: 'Question' },
  interviewer: { mn: 'Ярилцлага Авагч', en: 'Interviewer' },
  replay: { mn: 'Дахин Сонсох', en: 'Replay' },
  you: { mn: 'Ажил Горилогч', en: 'Applicant' },
  session_complete: { mn: 'Сайхан ярилцлаа, баярлалаа. Хариултыг тань шинжиж байна...', en: 'Great conversation, thank you! Analyzing your responses now...' },
  tab_text: { mn: 'Бичих', en: 'Text' },
  tab_audio: { mn: 'Ярих', en: 'Audio' },
  placeholder_answer: { mn: 'Хариултаа энд бичээрэй...', en: 'Type your answer...' },
  btn_send: { mn: 'Илгээх', en: 'Send' },
  transcribing: { mn: 'Хөрвүүлж байна...', en: 'Transcribing...' },
  btn_stop: { mn: 'Зогсоох', en: 'Stop' },
  btn_record: { mn: 'Бичлэг', en: 'Record' },
  recording: { mn: 'Бичиж байна...', en: 'Recording...' },
  audio_err_empty: { mn: 'Юу ч сонсогдсонгүй. Дахин оролдоорой.', en: 'Transcription was empty. Please try again.' },
  audio_err_fail: { mn: 'Хөрвүүлж чадсангүй. Дахин оролдоорой.', en: 'Transcription failed. Please try again.' },
  results_title: { mn: 'Ярилцлагын Үр Дүн', en: 'Interview Results' },
  questions_answered: { mn: 'асуултанд хариулсан', en: 'questions answered' },
  total_time: { mn: 'нийт хугацаа', en: 'total time' },
  overall_score: { mn: 'Нийт Оноо', en: 'Overall Score' },
  key_feedback: { mn: 'Гол Үнэлгээ', en: 'Key Feedback' },
  strengths: { mn: 'Давуу Тал', en: 'Strengths' },
  improvements: { mn: 'Сайжруулах Зүйлс', en: 'Areas to Improve' },
  suggestions: { mn: 'Зөвлөмж', en: 'Suggestions' },
  per_question: { mn: 'Асуулт Тус Бүрийн Задаргаа', en: 'Per-Question Breakdown' },
  q_prefix: { mn: 'А', en: 'Q' },
  btn_back: { mn: 'Буцах', en: 'Back' },
  btn_back_confirm: { mn: 'Ярилцлагаа орхиод буцах уу?', en: 'Leave the interview and go back?' },
  btn_new_session: { mn: 'Шинэ Дасгал Хий', en: 'Start New Session' },
  score_word_count: { mn: 'Агуулгын Хэмжээ', en: 'Response Length' },
  score_filler: { mn: 'Цэвэр Яриа', en: 'Clarity' },
  score_ttr: { mn: 'Үгийн Сан', en: 'Vocabulary' },
  score_structure: { mn: 'Бүтэц', en: 'Structure' },
  score_relevance: { mn: 'Хамаарал', en: 'Relevance' },
  history_title: { mn: 'Өмнөх Ярилцлагууд', en: 'Past Interviews' },
  history_clear: { mn: 'Түүх Цэвэрлэх', en: 'Clear History' },
  history_score: { mn: 'оноо', en: 'score' },
  sample_answer: { mn: 'Жишиг Хариулт', en: 'Sample Answer' },
  btn_export_pdf: { mn: 'PDF Татах', en: 'Export PDF' },
  tab_quick_start: { mn: 'Эхлэх', en: 'Quick Start' },
  tab_customize: { mn: 'Тохируулах', en: 'Customize' },
  jd_label: { mn: 'Ажлын Зарын Тайлбар', en: 'Job Description' },
  jd_placeholder: { mn: 'Ажлын зарын текстийг энд буулгана уу...', en: 'Paste the job listing text here...' },
  resume_label: { mn: 'CV Оруулах', en: 'Upload Resume' },
  resume_hint: { mn: 'PDF эсвэл Word файл (.pdf, .docx)', en: 'PDF or Word file (.pdf, .docx)' },
  resume_uploaded: { mn: 'CV-г уншлаа', en: 'Resume parsed successfully' },
  resume_skills: { mn: 'CV-с Олдсон Ур Чадварууд', en: 'Skills Found in Resume' },
  progress_title: { mn: 'Хөгжлийн График', en: 'Progress Chart' },
  progress_empty: { mn: 'Хөгжлийн графикаа харахын тулд дор хаяж 2 ярилцлага хийгээрэй.', en: 'Complete at least 2 interviews to see your progress chart.' },
  nav_dashboard: { mn: 'Хянах Самбар', en: 'Dashboard' },
  nav_home: { mn: 'Нүүр Хуудас', en: 'Home' },
  nav_practice: { mn: 'Дасгал', en: 'Practice' },
  nav_history: { mn: 'Түүх', en: 'History' },
  nav_guides: { mn: 'Зөвлөмж', en: 'Guides' },
  getting_started: { mn: 'Эхлэх Заавар', en: 'Getting Started' },
  getting_started_desc: { mn: 'Эхлүүлэхэд эдгээр алхмыг дагаарай', en: 'Follow these steps to begin your practice session' },
  step1_title: { mn: 'Төрөл Сонгох', en: 'Choose Category' },
  step1_desc: { mn: 'Ажлын төрлөө сонго эсвэл ажлын зараа оруулаарай', en: 'Pick a job type or paste a job description' },
  step2_title: { mn: 'Дасгал Хийх', en: 'Practice Interview' },
  step2_desc: { mn: 'Ярилцлагын асуултад хариулаарай', en: 'Answer interview questions' },
  step3_title: { mn: 'Үнэлгээ Авах', en: 'Get Feedback' },
  step3_desc: { mn: 'Дэлгэрэнгүй оноо, зөвлөмжөө аваарай', en: 'Receive detailed scores and improvement tips' },
  history_view_desc: { mn: 'Өмнөх ярилцлагуудын түүх, хөгжлийн график', en: 'Your past interview history and progress chart' },
  welcome_tagline: { mn: 'Ярилцлагадаа тайван, итгэлтэй бэлдэе', en: 'Let\'s get you ready — calm, confident, and prepared' },
  welcome_cta: { mn: 'Эхлэх', en: 'Get Started' },
  welcome_users: { mn: 'Хэрэглэгч', en: 'Users' },
  welcome_avg_score: { mn: 'Дундаж Оноо', en: 'Avg Score' },
  welcome_fields: { mn: 'Ажлын Салбар', en: 'Job Fields' },
  welcome_mongolian: { mn: 'Монгол Хэлээр', en: 'In Mongolian' },
  welcome_ai_feedback: { mn: 'AI Үнэлгээ', en: 'AI Feedback' },
  session_type_quick: { mn: 'Хурдан Дасгал', en: 'Quick Practice' },
  session_type_standard: { mn: 'Стандарт Ярилцлага', en: 'Standard Interview' },
  session_type_full: { mn: 'Бүрэн Ярилцлага', en: 'Full Mock Interview' },
  session_type_quick_desc: { mn: '5 асуулт, ~8 минут', en: '5 questions, ~8 min' },
  session_type_standard_desc: { mn: '12 асуулт, ~20 минут', en: '12 questions, ~20 min' },
  session_type_full_desc: { mn: '15 асуулт, ~30 минут', en: '15 questions, ~30 min' },

  // Difficulty levels (F)
  difficulty_title: { mn: 'Түвшин Сонгох', en: 'Choose Difficulty' },
  difficulty_easy: { mn: 'Хөнгөн', en: 'Easy' },
  difficulty_medium: { mn: 'Дунд', en: 'Medium' },
  difficulty_hard: { mn: 'Хүнд', en: 'Hard' },

  // Interviewer response (C)
  interviewer_responding: { mn: 'Ярилцлага авагч бодож байна...', en: 'The interviewer is replying...' },
  close_interview: { mn: 'Ярилцлагаа Дуусгах', en: 'End Interview' },
  est_time: { mn: 'Тооцоолсон Хугацаа', en: 'Estimated Time' },
  per_question_time: { mn: 'Асуулт Бүрт', en: 'Per Question' },
  pre_session_ready: { mn: 'Бэлэн Үү?', en: 'Ready?' },
  pre_session_start: { mn: 'Ярилцлага Эхлүүлэх', en: 'Start Interview' },
  question_tag_behavioral: { mn: 'Туршлага', en: 'Behavioral' },
  question_tag_motivation: { mn: 'Сэдэл', en: 'Motivation' },
  question_tag_introduction: { mn: 'Танилцуулга', en: 'Introduction' },
  question_tag_general: { mn: 'Ерөнхий', en: 'General' },
  question_tag_technical: { mn: 'Мэргэжлийн', en: 'Technical' },
  question_tag_situational: { mn: 'Нөхцөл Байдал', en: 'Situational' },
  time_recommended: { mn: 'Зөвлөх', en: 'Recommended' },
  results_communication: { mn: 'Харилцааны Чанар', en: 'Communication Quality' },
  results_job_relevance: { mn: 'Ажилтай Хамаарал', en: 'Job Relevance' },
  results_transcript: { mn: 'Хариултын Бичвэр', en: 'Transcript' },
  keyword_match: { mn: 'Түлхүүр Үгийн Тохирол', en: 'Keyword Match' },
  matched_skills: { mn: 'Тохирсон', en: 'Matched' },
  missing_skills: { mn: 'Нэмж Дурдах Боломжтой', en: 'Could Mention' },
  question_of: { mn: '-с', en: 'of' },
  session_type: { mn: 'Дасгалын Төрөл', en: 'Session Type' },
  minutes: { mn: 'мин', en: 'min' },
  seconds_short: { mn: 'сек', en: 'sec' },

  // Guided flow (J)
  step_info: { mn: 'Мэдээлэл', en: 'Your Info' },
  step_category: { mn: 'Салбар', en: 'Category' },
  step_mode: { mn: 'Горим', en: 'Mode' },
  step_ready: { mn: 'Тойм', en: 'Summary' },
  step_interview: { mn: 'Ярилцлага', en: 'Interview' },
  step_results: { mn: 'Үр дүн', en: 'Results' },
  user_name: { mn: 'Таны Нэр', en: 'Your Name' },
  user_name_placeholder: { mn: 'Нэрээ бичээрэй', en: 'Enter your name' },
  user_name_hint: { mn: 'Дасгалын явцад дуудна', en: 'Used during practice sessions' },
  next_step: { mn: 'Үргэлжлүүлэх', en: 'Continue' },
  prev_step: { mn: 'Буцах', en: 'Back' },

  // Auto-advance (D)
  time_warning: { mn: 'секунд үлдлээ', en: 'seconds left' },
  question_skipped: { mn: 'Хариулаагүй', en: 'Skipped' },
  auto_advance_warning: { mn: 'Хугацаа дуусаж байна', en: 'Time is running out' },

  // Score interpretation (E)
  score_excellent: { mn: 'Маш сайн', en: 'Excellent' },
  score_good: { mn: 'Сайн', en: 'Good' },
  score_average: { mn: 'Дундаж', en: 'Average' },
  score_needs_work: { mn: 'Сайжруулъя', en: 'Needs Improvement' },
  score_out_of: { mn: '-с', en: 'out of 100' },

  // Question-aware feedback tips (G)
  tip_intro: { mn: 'Нэр, мэргэжил, ажлын туршлагаа товчхон дурдаарай', en: 'Briefly cover your name, background, and relevant experience' },
  tip_motivation: { mn: 'Бодит шалтгаан, урт хугацааны зорилготойгоо холбоорой', en: 'Connect to genuine reasons and your long-term goals' },
  tip_behavioral: { mn: 'STAR аргыг ашигла: Нөхцөл → Даалгавар → Үйлдэл → Үр дүн', en: 'Use the STAR method: Situation → Task → Action → Result' },
  tip_technical: { mn: 'Тодорхой жишээ хэлж, өөрийн арга барилаа тайлбарлаарай', en: 'Give specific examples and explain your approach' },
  tip_situational: { mn: 'Алхам алхмаар тайлбарлаж, шийдвэрээ хэрхэн гаргасныг харуулаарай', en: 'Explain step by step and show your decision-making process' },
  tip_general: { mn: 'Товч, тодорхой хариулаад жишээгээрээ дэмжээрэй', en: 'Be clear and concise, support with examples' },

  // Answer guidance labels (H)
  answer_approach: { mn: 'Илүү Хүчтэй Хариулт Өгөх Зөвлөмж', en: 'Tips for a Stronger Answer' },
  answer_structure_hint: { mn: 'Санал Болгох Бүтэц', en: 'Suggested Structure' },

  // JD analysis (K)
  jd_analyze: { mn: 'Ур Чадварыг Задлах', en: 'Extract Skills' },
  jd_purpose: { mn: 'Ажлын зараас хэрэгтэй ур чадвар, чиг үүргийг задлаад асуултаа түүн дээр тулгуурлуулна.', en: 'Extract required skills and responsibilities from the job posting. Interview questions will be based on this.' },
  jd_skills_found: { mn: 'Олдсон Ур Чадварууд', en: 'Detected Skills' },
  jd_requirements: { mn: 'Гол Шаардлагууд', en: 'Key Requirements' },

  // CV enhanced (L)
  cv_strengths: { mn: 'CV-н Давуу Тал', en: 'Resume Strengths' },
  cv_talking_points: { mn: 'Ярилцлагад Бэлдэх Зөвлөмж', en: 'Interview Preparation Tips' },
  cv_gap_skills: { mn: 'Анхаарах Ур Чадварууд', en: 'Skills to Emphasize' },

  // History detail (M)
  history_detail: { mn: 'Дэлгэрэнгүй', en: 'Details' },
  history_no_detail: { mn: 'Энэ ярилцлагын дэлгэрэнгүй хадгалагдаагүй байна', en: 'Detailed data not saved for this session' },
  history_duration: { mn: 'Хугацаа', en: 'Duration' },
  history_questions_count: { mn: 'асуулт', en: 'questions' },

  // Interview Guides (O)
  guides_title: { mn: 'Ярилцлагын Бэлтгэл', en: 'Interview Preparation' },
  guides_subtitle: { mn: 'Ярилцлагадаа илүү сайн бэлдэхэд туслах зөвлөмжүүд', en: 'Tips and techniques to help you prepare better' },
  guide_intro_title: { mn: 'Өөрийгөө Танилцуулах', en: 'Introducing Yourself' },
  guide_star_title: { mn: 'STAR Арга', en: 'STAR Method' },
  guide_strengths_title: { mn: 'Давуу ба Сул Тал', en: 'Strengths & Weaknesses' },
  guide_behavioral_title: { mn: 'Зан Төлөвийн Асуултууд', en: 'Behavioral Questions' },
  guide_technical_title: { mn: 'Мэргэжлийн Асуултууд', en: 'Technical Questions' },
  guide_mistakes_title: { mn: 'Нийтлэг Алдаанууд', en: 'Common Mistakes' },
  guide_cv_title: { mn: 'CV + Ажлын Зараар Бэлдэх', en: 'Prepare with CV + Job Description' },

  // Conditional feedback (3rd pass B/C/D)
  strong_answer: { mn: 'Хүчтэй Хариулт', en: 'Strong Answer' },
  strong_answer_desc: { mn: 'Хариулт тань асуултын шаардлагыг сайн хангажээ.', en: 'Your answer effectively addressed the question requirements.' },
  why_this_works: { mn: 'Яагаад Сайн Хариулт Вэ', en: 'Why This Works' },
  answer_covers: { mn: 'Сайн Болсон Зүйлс', en: 'What You Did Well' },
  one_suggestion: { mn: 'Нэг Зөвлөмж', en: 'One Suggestion' },

  // CV+JD prep tool (3rd pass E)
  cv_jd_compare: { mn: 'Харьцуулах', en: 'Compare' },
  cv_jd_paste_cv: { mn: 'CV-гээ энд буулгаарай', en: 'Paste your CV text here' },
  cv_jd_paste_jd: { mn: 'Ажлын зараа энд буулгаарай', en: 'Paste the job description here' },
  cv_jd_matched: { mn: 'Тохирсон Ур Чадварууд', en: 'Matching Skills' },
  cv_jd_missing: { mn: 'Нөхөх Шаардлагатай', en: 'Skills to Develop' },
  cv_jd_talking_points: { mn: 'Ярих Сэдвүүд', en: 'Talking Points' },
  cv_jd_likely_questions: { mn: 'Гарах Магадлалтай Асуултууд', en: 'Likely Questions' },
  cv_jd_examples: { mn: 'Бэлдэх Жишээнүүд', en: 'Examples to Prepare' },
  cv_jd_empty: { mn: 'CV болон ажлын зараа оруулаад "Харьцуулах" товчийг дар', en: 'Enter both CV and job description, then click Compare' },

  // Auth
  auth_login: { mn: 'Нэвтрэх', en: 'Log In' },
  auth_register: { mn: 'Бүртгүүлэх', en: 'Sign Up' },
  auth_username: { mn: 'Хэрэглэгчийн Нэр', en: 'Username' },
  auth_password: { mn: 'Нууц Үг', en: 'Password' },
  auth_display_name: { mn: 'Харуулах Нэр', en: 'Display Name' },
  auth_guest: { mn: 'Зочноор Үргэлжлүүлэх', en: 'Continue as Guest' },
  auth_guest_hint: { mn: 'Зочноор ороход түүх үлдэхгүй', en: 'History will not be saved in guest mode' },
  auth_error_username_taken: { mn: 'Энэ нэр өмнө бүртгэгдсэн байна', en: 'Username already taken' },
  auth_error_user_not_found: { mn: 'Ийм хэрэглэгч алга', en: 'User not found' },
  auth_error_wrong_password: { mn: 'Нууц үг буруу байна', en: 'Wrong password' },
  auth_error_fields_required: { mn: 'Бүх талбараа бөглөөрэй', en: 'All fields are required' },
  logout: { mn: 'Гарах', en: 'Log Out' },
};

const LangContext = createContext();

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('interview-lang') || 'mn');

  function t(key) {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry.mn || key;
  }

  function toggleLang() {
    setLang((prev) => {
      const next = prev === 'mn' ? 'en' : 'mn';
      localStorage.setItem('interview-lang', next);
      return next;
    });
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
