import { createContext, useContext, useState } from 'react';

const translations = {
  header_title: { mn: 'Interview Coach', en: 'Interview Coach' },
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
  skills_desc: { mn: 'Энэ салбарт шаардагдах гол ур чадварууд', en: 'Key skills required in this field' },
  example_companies: { mn: 'Салбарын байгууллагууд:', en: 'Companies in this field:' },
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
  btn_new_session: { mn: 'Шинэ дасгал эхлүүлэх', en: 'Start New Session' },
  score_word_count: { mn: 'Агуулгын хэмжээ', en: 'Response Length' },
  score_filler: { mn: 'Тодорхой байдал', en: 'Clarity' },
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
  nav_guides: { mn: 'Зөвлөмж', en: 'Guides' },
  getting_started: { mn: 'Эхлэх заавар', en: 'Getting Started' },
  getting_started_desc: { mn: 'Дасгалаа эхлүүлэхийн тулд дараах алхмуудыг дагана уу', en: 'Follow these steps to begin your practice session' },
  step1_title: { mn: 'Төрөл сонгох', en: 'Choose Category' },
  step1_desc: { mn: 'Ажлын төрөл сонгоод эсвэл ажлын зарын тайлбар оруулна уу', en: 'Pick a job type or paste a job description' },
  step2_title: { mn: 'Дасгал хийх', en: 'Practice Interview' },
  step2_desc: { mn: 'Ярилцлагын асуултуудад хариулна уу', en: 'Answer interview questions' },
  step3_title: { mn: 'Үнэлгээ авах', en: 'Get Feedback' },
  step3_desc: { mn: 'Дэлгэрэнгүй оноо, зөвлөмж авна уу', en: 'Receive detailed scores and improvement tips' },
  history_view_desc: { mn: 'Таны өмнөх ярилцлагын түүх болон хөгжлийн график', en: 'Your past interview history and progress chart' },
  welcome_tagline: { mn: 'Ярилцлагандаа итгэлтэй бэлдээрэй', en: 'Prepare confidently for your interview' },
  welcome_cta: { mn: 'Эхлэх', en: 'Get Started' },
  welcome_users: { mn: 'Хэрэглэгч', en: 'Users' },
  welcome_avg_score: { mn: 'Дундаж оноо', en: 'Avg Score' },
  welcome_fields: { mn: 'Ажлын салбар', en: 'Job Fields' },
  welcome_mongolian: { mn: 'Монгол хэлээр', en: 'In Mongolian' },
  welcome_ai_feedback: { mn: 'AI үнэлгээ', en: 'AI Feedback' },
  session_type_quick: { mn: 'Хурдан дасгал', en: 'Quick Practice' },
  session_type_standard: { mn: 'Стандарт ярилцлага', en: 'Standard Interview' },
  session_type_full: { mn: 'Бүрэн ярилцлага', en: 'Full Mock Interview' },
  session_type_quick_desc: { mn: '5 асуулт, ~8 минут', en: '5 questions, ~8 min' },
  session_type_standard_desc: { mn: '12 асуулт, ~20 минут', en: '12 questions, ~20 min' },
  session_type_full_desc: { mn: '15 асуулт, ~30 минут', en: '15 questions, ~30 min' },

  // Difficulty levels (F)
  difficulty_title: { mn: 'Түвшин сонгох', en: 'Choose Difficulty' },
  difficulty_easy: { mn: 'Хөнгөн', en: 'Easy' },
  difficulty_medium: { mn: 'Дунд', en: 'Medium' },
  difficulty_hard: { mn: 'Хүнд', en: 'Hard' },

  // Interviewer response (C)
  interviewer_responding: { mn: 'Ярилцлага авагч хариулж байна...', en: 'Interviewer responding...' },
  close_interview: { mn: 'Ярилцлагыг дуусгах', en: 'End Interview' },
  est_time: { mn: 'Тооцоолсон хугацаа', en: 'Estimated time' },
  per_question_time: { mn: 'Асуулт бүрт', en: 'Per question' },
  pre_session_ready: { mn: 'Бэлэн үү?', en: 'Ready?' },
  pre_session_start: { mn: 'Ярилцлага эхлүүлэх', en: 'Start Interview' },
  question_tag_behavioral: { mn: 'Туршлага', en: 'Behavioral' },
  question_tag_motivation: { mn: 'Сэдэл', en: 'Motivation' },
  question_tag_introduction: { mn: 'Танилцуулга', en: 'Introduction' },
  question_tag_general: { mn: 'Ерөнхий', en: 'General' },
  question_tag_technical: { mn: 'Мэргэжлийн', en: 'Technical' },
  question_tag_situational: { mn: 'Нөхцөл байдал', en: 'Situational' },
  time_recommended: { mn: 'Зөвлөх', en: 'Recommended' },
  results_communication: { mn: 'Харилцааны чанар', en: 'Communication Quality' },
  results_job_relevance: { mn: 'Ажилтай хамаарал', en: 'Job Relevance' },
  results_transcript: { mn: 'Хариултын бичвэр', en: 'Transcript' },
  keyword_match: { mn: 'Түлхүүр үгийн тохирол', en: 'Keyword Match' },
  matched_skills: { mn: 'Тохирсон', en: 'Matched' },
  missing_skills: { mn: 'Нэмж дурдах боломжтой', en: 'Could Mention' },
  question_of: { mn: '-с', en: 'of' },
  session_type: { mn: 'Дасгалын төрөл', en: 'Session Type' },
  minutes: { mn: 'мин', en: 'min' },
  seconds_short: { mn: 'сек', en: 'sec' },

  // Guided flow (J)
  step_info: { mn: 'Мэдээлэл', en: 'Your Info' },
  step_category: { mn: 'Салбар', en: 'Category' },
  step_mode: { mn: 'Горим', en: 'Mode' },
  step_ready: { mn: 'Тойм', en: 'Summary' },
  step_interview: { mn: 'Ярилцлага', en: 'Interview' },
  step_results: { mn: 'Үр дүн', en: 'Results' },
  user_name: { mn: 'Таны нэр', en: 'Your Name' },
  user_name_placeholder: { mn: 'Нэрээ оруулна уу', en: 'Enter your name' },
  user_name_hint: { mn: 'Дасгалын үед ашиглагдана', en: 'Used during practice sessions' },
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
  score_needs_work: { mn: 'Сайжруулах шаардлагатай', en: 'Needs Improvement' },
  score_out_of: { mn: '-с', en: 'out of 100' },

  // Question-aware feedback tips (G)
  tip_intro: { mn: 'Нэр, мэргэжил, ажлын туршлагаа товч тодорхой дурдаарай', en: 'Briefly cover your name, background, and relevant experience' },
  tip_motivation: { mn: 'Бодит шалтгаан, урт хугацааны зорилготойгоо холбоорой', en: 'Connect to genuine reasons and your long-term goals' },
  tip_behavioral: { mn: 'STAR аргыг ашигла: Нөхцөл → Даалгавар → Үйлдэл → Үр дүн', en: 'Use the STAR method: Situation → Task → Action → Result' },
  tip_technical: { mn: 'Тодорхой жишээ, өөрийн хандлагаа тайлбарлаарай', en: 'Give specific examples and explain your approach' },
  tip_situational: { mn: 'Алхам алхмаар тайлбарлаж, шийдвэр гаргах үйл явцаа харуулаарай', en: 'Explain step by step and show your decision-making process' },
  tip_general: { mn: 'Товч, тодорхой хариулж, жишээгээр баталгаажуулаарай', en: 'Be clear and concise, support with examples' },

  // Answer guidance labels (H)
  answer_approach: { mn: 'Илүү хүчтэй хариулт өгөх зөвлөмж', en: 'Tips for a Stronger Answer' },
  answer_structure_hint: { mn: 'Санал болгох бүтэц', en: 'Suggested Structure' },

  // JD analysis (K)
  jd_analyze: { mn: 'Ур чадварыг задлах', en: 'Extract Skills' },
  jd_purpose: { mn: 'Ажлын зараас шаардагдах ур чадварууд, чиг үүргийг задлан шинжилнэ. Ярилцлагын асуултууд энэ мэдээлэлд тулгуурлана.', en: 'Extract required skills and responsibilities from the job posting. Interview questions will be based on this.' },
  jd_skills_found: { mn: 'Олдсон ур чадварууд', en: 'Detected Skills' },
  jd_requirements: { mn: 'Гол шаардлагууд', en: 'Key Requirements' },

  // CV enhanced (L)
  cv_strengths: { mn: 'CV-н давуу талууд', en: 'Resume Strengths' },
  cv_talking_points: { mn: 'Ярилцлагад бэлдэх зөвлөмж', en: 'Interview Preparation Tips' },
  cv_gap_skills: { mn: 'Анхаарах ур чадварууд', en: 'Skills to Emphasize' },

  // History detail (M)
  history_detail: { mn: 'Дэлгэрэнгүй', en: 'Details' },
  history_no_detail: { mn: 'Энэ ярилцлагын дэлгэрэнгүй мэдээлэл хадгалагдаагүй', en: 'Detailed data not saved for this session' },
  history_duration: { mn: 'Хугацаа', en: 'Duration' },
  history_questions_count: { mn: 'асуулт', en: 'questions' },

  // Interview Guides (O)
  guides_title: { mn: 'Ярилцлагын бэлтгэл', en: 'Interview Preparation' },
  guides_subtitle: { mn: 'Ярилцлагандаа илүү сайн бэлдэхэд туслах зөвлөмжүүд', en: 'Tips and techniques to help you prepare better' },
  guide_intro_title: { mn: 'Өөрийгөө танилцуулах', en: 'Introducing Yourself' },
  guide_star_title: { mn: 'STAR арга', en: 'STAR Method' },
  guide_strengths_title: { mn: 'Давуу ба сул тал', en: 'Strengths & Weaknesses' },
  guide_behavioral_title: { mn: 'Зан төлөвийн асуултууд', en: 'Behavioral Questions' },
  guide_technical_title: { mn: 'Мэргэжлийн асуултууд', en: 'Technical Questions' },
  guide_mistakes_title: { mn: 'Нийтлэг алдаанууд', en: 'Common Mistakes' },
  guide_cv_title: { mn: 'CV + ажлын зараар бэлдэх', en: 'Prepare with CV + Job Description' },

  // Conditional feedback (3rd pass B/C/D)
  strong_answer: { mn: 'Хүчтэй хариулт', en: 'Strong Answer' },
  strong_answer_desc: { mn: 'Таны хариулт асуултын шаардлагыг сайн хангасан байна.', en: 'Your answer effectively addressed the question requirements.' },
  why_this_works: { mn: 'Яагаад сайн хариулт вэ', en: 'Why This Works' },
  answer_covers: { mn: 'Сайн болсон зүйлс', en: 'What You Did Well' },
  one_suggestion: { mn: 'Нэг зөвлөмж', en: 'One Suggestion' },

  // CV+JD prep tool (3rd pass E)
  cv_jd_compare: { mn: 'Харьцуулах', en: 'Compare' },
  cv_jd_paste_cv: { mn: 'CV-н текстийг буулгана уу', en: 'Paste your CV text here' },
  cv_jd_paste_jd: { mn: 'Ажлын зарыг буулгана уу', en: 'Paste the job description here' },
  cv_jd_matched: { mn: 'Тохирсон ур чадварууд', en: 'Matching Skills' },
  cv_jd_missing: { mn: 'Нөхөх шаардлагатай', en: 'Skills to Develop' },
  cv_jd_talking_points: { mn: 'Ярих сэдвүүд', en: 'Talking Points' },
  cv_jd_likely_questions: { mn: 'Гарах магадлалтай асуултууд', en: 'Likely Questions' },
  cv_jd_examples: { mn: 'Бэлдэх жишээнүүд', en: 'Examples to Prepare' },
  cv_jd_empty: { mn: 'CV болон ажлын зарыг оруулаад "Харьцуулах" дараарай', en: 'Enter both CV and job description, then click Compare' },

  // Auth
  auth_login: { mn: 'Нэвтрэх', en: 'Log In' },
  auth_register: { mn: 'Бүртгүүлэх', en: 'Sign Up' },
  auth_username: { mn: 'Хэрэглэгчийн нэр', en: 'Username' },
  auth_password: { mn: 'Нууц үг', en: 'Password' },
  auth_display_name: { mn: 'Харуулах нэр', en: 'Display Name' },
  auth_guest: { mn: 'Зочин горимоор үргэлжлүүлэх', en: 'Continue as Guest' },
  auth_guest_hint: { mn: 'Зочин горимд түүх хадгалагдахгүй', en: 'History will not be saved in guest mode' },
  auth_error_username_taken: { mn: 'Хэрэглэгчийн нэр бүртгэгдсэн байна', en: 'Username already taken' },
  auth_error_user_not_found: { mn: 'Хэрэглэгч олдсонгүй', en: 'User not found' },
  auth_error_wrong_password: { mn: 'Нууц үг буруу', en: 'Wrong password' },
  auth_error_fields_required: { mn: 'Бүх талбарыг бөглөнө үү', en: 'All fields are required' },
  logout: { mn: 'Гарах', en: 'Log out' },
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
