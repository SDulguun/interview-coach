import { useLang } from '../lang';
import { classifyQuestion, formatTime, getScoreColor } from '../utils';
import illustHighfive from '../assets/illust-highfive.jpg';

// Clean raw metrics from feedback strings (e.g. "TTR 0.95", "WC: 45")
function cleanMetrics(text) {
  if (!text) return text;
  return text
    .replace(/\(TTR[\s:]*[\d.]+\)/gi, '')
    .replace(/\bTTR[\s:]*[\d.]+/gi, '')
    .replace(/\(WC[\s:]*\d+\)/gi, '')
    .replace(/\bWC[\s:]*\d+/gi, '')
    .replace(/\bfiller[\s:]*[\d.]+%?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Get score interpretation label
function getScoreLabel(score, t) {
  if (score >= 85) return t('score_excellent');
  if (score >= 70) return t('score_good');
  if (score >= 50) return t('score_average');
  return t('score_needs_work');
}

// Semantic concept map: skill → related words/phrases that demonstrate it indirectly
const CONCEPT_MAP = {
  // Technical concepts
  'javascript': ['react', 'node', 'frontend', 'backend', 'web', 'api', 'dom', 'typescript', 'es6', 'npm'],
  'python': ['django', 'flask', 'pandas', 'numpy', 'machine learning', 'data science', 'pip', 'jupyter'],
  'sql': ['database', 'query', 'table', 'join', 'index', 'postgres', 'mysql', 'migration'],
  'react': ['component', 'hook', 'state', 'props', 'jsx', 'redux', 'virtual dom', 'spa'],
  'docker': ['container', 'image', 'kubernetes', 'k8s', 'deploy', 'microservice', 'devops'],
  'git': ['version control', 'branch', 'merge', 'commit', 'pull request', 'repository'],
  'ci/cd': ['pipeline', 'deploy', 'automation', 'jenkins', 'github actions', 'continuous'],
  // Soft skills
  'leadership': ['led', 'managed', 'directed', 'guided', 'mentored', 'coordinated', 'oversaw', 'удирдсан', 'чиглүүлсэн', 'ментор'],
  'teamwork': ['team', 'collaborated', 'together', 'group', 'баг', 'хамтарсан', 'хамт'],
  'communication': ['presented', 'explained', 'discussed', 'wrote', 'documented', 'илтгэсэн', 'тайлбарласан'],
  'problem solving': ['solved', 'fixed', 'debugged', 'resolved', 'analyzed', 'шийдвэрлэсэн', 'засасан'],
  'project management': ['deadline', 'milestone', 'sprint', 'agile', 'scrum', 'planned', 'төлөвлөсөн'],
  'analytics': ['data', 'metrics', 'analysis', 'report', 'dashboard', 'дата', 'шинжилгээ'],
  // Mongolian soft skills
  'харилцааны чадвар': ['ярилцсан', 'тайлбарласан', 'илтгэсэн', 'харилцаа', 'communicated'],
  'багаар ажиллах': ['баг', 'хамтарсан', 'хамт олон', 'team', 'collaborated'],
  'манлайлал': ['удирдсан', 'чиглүүлсэн', 'зохион байгуулсан', 'led', 'managed'],
};

// Check if answer text semantically demonstrates a skill
function answerDemonstratesSkill(answerTexts, skill) {
  const lower = skill.toLowerCase();
  const allText = answerTexts.join(' ').toLowerCase();
  // Direct mention
  if (allText.includes(lower)) return true;
  // Check concept map
  const concepts = CONCEPT_MAP[lower];
  if (concepts) {
    return concepts.some(c => allText.includes(c));
  }
  // Partial match (e.g. "React" matches "react-based")
  const words = lower.split(/[\s/]+/);
  return words.some(w => w.length > 3 && allText.includes(w));
}

// Generate category-specific feedback — more detailed, question-aware coaching
function getCategoryTip(tag, lang, questionCategory) {
  // Use granular category for more specific advice when available
  const granularTips = {
    introduction: {
      mn: 'Танилцуулгадаа 3 гол зүйл дурдаарай: (1) Нэр, мэргэжил (2) Хамгийн хамааралтай туршлага (3) Энэ ажлын байранд яагаад нийцэх. 30–60 секундэд багтаах нь чухал.',
      en: 'Cover three key points: (1) Name and background (2) Most relevant experience (3) Why you fit this role. Keep it to 30–60 seconds.',
    },
    motivation_role: {
      mn: 'Чин сэтгэлийн сэдлээ хэлж, тодорхой жишээгээр баталгаажуулаарай. "Яагаад энэ чиглэл?" гэдэгт "юу хийхэд таалагддаг + ирээдүйн зорилго" хоёрыг холбоорой.',
      en: 'Share your genuine motivation with a concrete example. Connect what excites you about the field to your future goals.',
    },
    motivation_company: {
      mn: 'Байгууллагын тухай судалгаа хийснээ харуулаарай. Тодорхой бүтээгдэхүүн, үнэт зүйл, эсвэл ажлын соёлыг дурдаж, миний туршлага хэрхэн тус болохыг холбоорой.',
      en: 'Show you researched the company. Mention specific products, values, or culture and connect how your experience adds value.',
    },
    experience: {
      mn: 'Хамгийн хамааралтай туршлагаа сонгож, тодорхой үүрэг, ашигласан арга хэрэгсэл, бодит үр дүнг тоогоор дурдаарай.',
      en: 'Choose your most relevant experience. Describe your specific role, tools used, and quantifiable results.',
    },
    achievement: {
      mn: 'Амжилтаа тоо баримтаар хэмжиж хэлээрэй: "X хийснээр Y үр дүнд хүрсэн." Байгууллагад үзүүлсэн нөлөөг онцлоорой.',
      en: 'Quantify your achievement: "By doing X, I achieved Y result." Highlight the impact on the organization.',
    },
    strengths: {
      mn: 'Ажлын байрандтай шууд холбоотой 2–3 давуу талаа нэрлээрэй. Давуу тал бүрдээ нэг тодорхой жишээ хэлж баталгаажуулаарай.',
      en: 'Name 2–3 strengths directly relevant to the role. Support each with a specific example.',
    },
    weaknesses: {
      mn: 'Бодит сул талаа шударгаар хэлж, яг юу хийж сайжруулж байгаагаа тайлбарлаарай. "Төгс биш ч суралцаж байна" хэмээх хандлага чухал.',
      en: 'Be honest about a real weakness and explain the specific steps you are taking to improve. Show self-awareness and growth.',
    },
    behavioral_challenge: {
      mn: 'STAR аргыг ашигла: (1) Нөхцөл байдлыг тодорхойлж (2) Даалгаврыг тайлбарлаж (3) Таны хийсэн үйлдлийг дурдаж (4) Үр дүнг хэлж. Суралцсан зүйлээ нэмж дурдаарай.',
      en: 'Use the STAR method: (1) Describe the Situation (2) Explain the Task (3) Detail your Action (4) Share the Result. Mention what you learned.',
    },
    behavioral_teamwork: {
      mn: 'Багийн ажлын жишээнд таны тодорхой оролцоо, үүргийг тодорхой хэлээрэй. Зөрчилдөөнийг мэргэжлийн түвшинд хэрхэн шийдвэрлэснийг онцлоорой.',
      en: 'In teamwork examples, clarify your specific contribution. Highlight how you resolved disagreements professionally.',
    },
    problem_solving: {
      mn: 'Асуудлыг хэрхэн тодорхойлж, жижиг хэсгүүдэд задалж, алхам алхмаар шийдвэрлэсэн үйл явцаа тайлбарлаарай.',
      en: 'Explain how you identified the problem, broke it down, and solved it step by step.',
    },
    pressure: {
      mn: 'Дарамтыг хэрхэн зохицуулдгаа тодорхой арга барилаар тайлбарлаарай. Эрэмбэлэх, тусламж хүсэх, тайвширах аргуудаа дурдаарай.',
      en: 'Explain your specific coping strategies: prioritization, seeking help, staying calm. Give a real example.',
    },
    technical: {
      mn: 'Мэргэжлийн мэдлэгээ тодорхой жишээгээр баталгаажуулаарай. Арга барил, хэрэгсэл, гүнзгий ойлголтоо харуулаарай. Мэдэхгүй зүйлдээ шударгаар хандаарай.',
      en: 'Support technical knowledge with concrete examples. Show your approach, tools, and depth. Be honest about gaps.',
    },
    technical_2: {
      mn: 'Дэвшилтэт мэргэжлийн асуултад өөрийн арга барил, шилдэг туршлага, бодит төслийн жишээг нарийвчлан тайлбарлаарай.',
      en: 'For advanced technical questions, explain your methodology, best practices, and real project examples in detail.',
    },
    learning: {
      mn: 'Суралцах хүсэл, арга барилаа харуулаарай. Тодорхой жишээ—юу суралцсан, хэрхэн хэрэгжүүлсэн—дурдаарай.',
      en: 'Show your learning approach with a specific example of what you learned and how you applied it.',
    },
    goals: {
      mn: 'Ирээдүйн зорилгоо тодорхой, бодитоор хэлж, тухайн байгууллагын ажилтай хэрхэн холбогдохыг дурдаарай.',
      en: 'State clear, realistic goals and connect them to how the role helps you achieve them.',
    },
    closing: {
      mn: 'Идэвхтэй сонирхлоо харуулаарай. Багийн бүтэц, ажлын горим, хүлээлт зэрэг утга учиртай асуулт асуугаарай.',
      en: 'Show genuine interest. Ask meaningful questions about team structure, workflows, or expectations.',
    },
    scenario: {
      mn: 'Нөхцөл байдлын асуултад алхам алхмаар шийдвэрлэх замаа тайлбарлаарай. Эхлээд мэдээлэл цуглуулж, дараа нь арга хэмжээ авахаа тодорхойлоорой.',
      en: 'Walk through your approach step by step: first gather information, then decide on action. Explain your reasoning.',
    },
    leadership: {
      mn: 'Удирдлагын чадвараа тодорхой жишээгээр харуулаарай. Бусдыг хэрхэн чиглүүлж, сургаж, хариуцлагаа хуваалцсанаа дурдаарай.',
      en: 'Show leadership with a concrete example of guiding, teaching, or taking ownership. Highlight team outcomes.',
    },
    values: {
      mn: 'Мэргэжлийн зарчим, ёс зүйгээ бодит жишээгээр тайлбарлаарай.',
      en: 'Explain your professional values and ethics with real examples.',
    },
    adaptability: {
      mn: 'Өөрчлөлтөд хэрхэн зохицсоноо тодорхой тохиолдлоор харуулаарай. Уян хатан, эерэг хандлагаа онцлоорой.',
      en: 'Show how you adapted to change with a specific example. Highlight flexibility and positive attitude.',
    },
    company_context: {
      mn: 'Компанийн орчинд тохирсон хариулт өгөхдөө бодит туршлагаа жишээгээр тайлбарлаарай. Тухайн компанийн соёл, ажлын арга барилд хэрхэн нийцэхээ тодорхой дурдаарай.',
      en: 'When answering company-context questions, use real examples. Explain how your approach aligns with the company culture and workflows.',
    },
  };

  // Try granular category first, then fall back to display tag
  const granular = granularTips[questionCategory];
  if (granular) return granular[lang] || granular.mn;

  const tagTip = granularTips[tag];
  if (tagTip) return tagTip[lang] || tagTip.mn;

  const fallback = granularTips.introduction;
  return fallback[lang] || fallback.mn;
}

// Structure hint based on question tag — covers all types
function getStructureHint(tag, lang) {
  const hints = {
    introduction: {
      mn: '1. Нэр, мэргэжил → 2. Гол туршлага → 3. Энэ ажилд яагаад тохирох',
      en: '1. Name & background → 2. Key experience → 3. Why you fit this role',
    },
    behavioral: {
      mn: '1. Нөхцөл байдал (S) → 2. Даалгавар (T) → 3. Таны үйлдэл (A) → 4. Үр дүн (R)',
      en: '1. Situation (S) → 2. Task (T) → 3. Your Action (A) → 4. Result (R)',
    },
    motivation: {
      mn: '1. Бодит шалтгаан → 2. Тодорхой жишээ → 3. Компани/ажилтай холбоос → 4. Ирээдүйн зорилго',
      en: '1. Genuine reason → 2. Specific example → 3. Connection to role/company → 4. Future goals',
    },
    technical: {
      mn: '1. Ойлголт → 2. Арга барил тайлбар → 3. Тодорхой жишээ/туршлага → 4. Суралцсан зүйл',
      en: '1. Understanding → 2. Approach explanation → 3. Specific example/experience → 4. What you learned',
    },
    situational: {
      mn: '1. Нөхцөлийг ойлгох → 2. Мэдээлэл цуглуулах → 3. Шийдэл боловсруулах → 4. Хэрэгжүүлж үр дүн гаргах',
      en: '1. Understand the situation → 2. Gather information → 3. Plan solution → 4. Execute and achieve outcome',
    },
    general: {
      mn: '1. Гол санаа → 2. Тодорхой жишээ/нотлох баримт → 3. Дүгнэлт',
      en: '1. Main point → 2. Specific example/evidence → 3. Conclusion',
    },
  };
  const hint = hints[tag] || hints.general;
  return hint[lang] || hint.mn;
}

function SessionResults({ results, answers, questions = [], totalQuestions, onRestart }) {
  const { t, lang } = useLang();

  const SCORE_LABELS = {
    word_count: t('score_word_count'),
    filler: t('score_filler'),
    ttr: t('score_ttr'),
    structure: t('score_structure'),
    relevance: t('score_relevance'),
  };

  if (!results) return null;

  const { aggregate, per_question, session } = results;
  const score = Math.round(aggregate.overall_score);
  const scoreColor = getScoreColor(score);
  const scoreLabel = getScoreLabel(score, t);
  // Use totalQuestions prop (actual session size) over backend's count
  const actualTotal = totalQuestions || questions.length || session.total_questions;

  // SVG ring dimensions
  const radius = 70;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  // Keyword matching with semantic enhancement
  const answerTexts = answers.map(a => a?.text || '');
  const rawMatched = aggregate.matched_skills || [];
  const rawMissing = aggregate.missing_skills || [];
  // Re-evaluate "missing" skills — some may be demonstrated semantically
  const semanticRescued = rawMissing.filter(skill => answerDemonstratesSkill(answerTexts, skill));
  const matchedSkills = [...rawMatched, ...semanticRescued];
  const missingSkills = rawMissing.filter(skill => !semanticRescued.includes(skill));
  const hasKeywords = matchedSkills.length > 0 || missingSkills.length > 0;

  // Clean strengths and improvements
  const cleanedStrengths = (aggregate.strengths || []).map(cleanMetrics).filter(s => s.length > 5);
  const cleanedImprovements = (aggregate.improvements || []).map(cleanMetrics).filter(s => s.length > 5);
  const cleanedSuggestions = (aggregate.suggestions || []).map(cleanMetrics).filter(s => s.length > 5);

  return (
    <div className="session-results-v2">
      {/* Overview Card */}
      <div className="card results-overview">
        <div className="results-overview-top">
          <div className="overall-score-ring">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle
                cx="80" cy="80" r={radius}
                fill="none" stroke="var(--border)" strokeWidth={stroke}
              />
              <circle
                cx="80" cy="80" r={radius}
                fill="none" stroke={scoreColor} strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 80 80)"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="ring-score-text">
              <span className="ring-score-value" style={{ color: scoreColor }}>{score}%</span>
              <span className="ring-score-label">{scoreLabel}</span>
            </div>
          </div>

          <div className="results-session-stats">
            <div className="results-stat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span className="results-stat-value">{session.answered}/{actualTotal}</span>
              <span className="results-stat-label">{t('questions_answered')}</span>
            </div>
            <div className="results-stat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              <span className="results-stat-value">{formatTime(session.total_duration_seconds)}</span>
              <span className="results-stat-label">{t('total_time')}</span>
            </div>
            <div className="results-stat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span className="results-stat-value score-badge-lg" style={{ color: scoreColor }}>{score}%</span>
              <span className="results-stat-label">{t('overall_score')}</span>
            </div>
          </div>
        </div>

        {/* Dimension Bars */}
        <div className="dimension-bars">
          {Object.entries(aggregate.dimension_scores).map(([key, value]) => {
            const val = Math.round(value);
            const color = getScoreColor(val);
            return (
              <div key={key} className="dimension-bar-row">
                <span className="dimension-bar-label">{SCORE_LABELS[key] || key}</span>
                <div className="dimension-bar-track">
                  <div
                    className="dimension-bar-fill"
                    style={{ width: `${val}%`, backgroundColor: color }}
                  />
                </div>
                <span className="dimension-bar-value" style={{ color }}>{val}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyword Match Chips */}
      {hasKeywords && (
        <div className="card keyword-chips-card">
          <h2>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            {t('keyword_match')}
          </h2>
          <div className="keyword-chips">
            {matchedSkills.map((skill, i) => (
              <span key={`m-${i}`} className="chip chip-matched">{skill}</span>
            ))}
            {missingSkills.map((skill, i) => (
              <span key={`x-${i}`} className="chip chip-missing">{skill}</span>
            ))}
          </div>
          <div className="keyword-legend">
            <span className="legend-item"><span className="legend-dot dot-matched" /> {t('matched_skills')}</span>
            <span className="legend-item"><span className="legend-dot dot-missing" /> {t('missing_skills')}</span>
          </div>
        </div>
      )}

      {/* Feedback Grid — strengths always show; improvements only when score < 85 */}
      <div className="results-feedback-grid">
        {cleanedStrengths.length > 0 && (
          <div className="card feedback-col feedback-col-strengths">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              {t('strengths')}
            </h3>
            <ul>
              {cleanedStrengths.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {score < 85 && cleanedImprovements.length > 0 && (
          <div className="card feedback-col feedback-col-improvements">
            <h3>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {t('improvements')}
            </h3>
            <ul>
              {cleanedImprovements.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {score < 85 && cleanedSuggestions.length > 0 && (
        <div className="card feedback-suggestions-card">
          <h3>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            {t('suggestions')}
          </h3>
          <ul>
            {cleanedSuggestions.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Per-Question Breakdown */}
      <div className="card per-question-card">
        <h2>{t('per_question')}</h2>
        {per_question.map((result, i) => {
          if (!result) return null;
          const answer = answers[i];
          const question = questions[i];
          const qScore = Math.round(result.feedback.overall_score);
          const tag = question ? classifyQuestion(question.question, question.category) : 'general';
          const categoryTip = getCategoryTip(tag, lang, question?.category);
          const structureHint = getStructureHint(tag, lang);
          const isStrong = qScore >= 85;
          const isGood = qScore >= 70;
          const qStrengths = (result.feedback.strengths || []).filter(s => s && s.length > 3);
          const qImprovements = (result.feedback.improvements || []).filter(s => s && s.length > 3);

          return (
            <details key={i} className="question-result-v2">
              <summary className="question-result-summary">
                <span className="question-number">{t('q_prefix')}{i + 1}</span>
                <span className={`question-tag tag-${tag}`}>{t(`question_tag_${tag}`)}</span>
                <span className="question-summary-text">
                  {answer?.question?.slice(0, 60)}{answer?.question?.length > 60 ? '...' : ''}
                </span>
                {isStrong && <span className="strong-answer-badge">{t('strong_answer')}</span>}
                <span className="question-score-badge" style={{ color: getScoreColor(qScore) }}>
                  {qScore}%
                </span>
              </summary>
              <div className="question-result-body">
                <div className="result-section">
                  <label>{t('interviewer')}</label>
                  <p>{answer?.question}</p>
                </div>
                <div className="result-section">
                  <label>{t('results_transcript')}</label>
                  <p className="result-answer-text">{answer?.text}</p>
                </div>

                {/* Per-question strengths — always show when available */}
                {qStrengths.length > 0 && (
                  <div className="result-section result-per-strengths">
                    <label>{t('answer_covers')}</label>
                    <ul>
                      {qStrengths.map((s, si) => <li key={si}>{cleanMetrics(s)}</li>)}
                    </ul>
                  </div>
                )}

                {/* Closing question: specialized feedback */}
                {question?.category === 'closing' ? (
                  <div className="result-section result-closing-feedback">
                    <label>{lang === 'mn' ? 'Хаалтын асуултын үнэлгээ' : 'Closing Question Assessment'}</label>
                    <div className="closing-engagement-badge" style={{ color: qScore >= 60 ? 'var(--green)' : 'var(--yellow)' }}>
                      {qScore >= 60
                        ? (lang === 'mn' ? '✓ Идэвхтэй оролцоо' : '✓ Good Engagement')
                        : (lang === 'mn' ? '△ Илүү идэвхтэй оролцох боломжтой' : '△ Could Show More Engagement')}
                    </div>
                    <div className="closing-tips">
                      <label>{lang === 'mn' ? 'Зөвлөмж' : 'Tips'}</label>
                      <ul>
                        <li>{lang === 'mn' ? 'Багийн соёл, ажлын горимын талаар асуугаарай' : 'Ask about team culture and workflows'}</li>
                        <li>{lang === 'mn' ? 'Хөгжлийн боломж, карьерийн өсөлтийн талаар мэдэж аваарай' : 'Learn about growth opportunities and career progression'}</li>
                        <li>{lang === 'mn' ? 'Дараагийн алхмуудын талаар тодруулаарай' : 'Clarify next steps in the process'}</li>
                        <li>{lang === 'mn' ? 'Тодорхой, утга учиртай асуулт асуух нь сонирхлыг харуулна' : 'Asking specific, thoughtful questions shows genuine interest'}</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Strong answer (≥85): positive reinforcement only */}
                    {isStrong && (
                      <div className="result-section result-strong">
                        <label>{t('why_this_works')}</label>
                        <p>{categoryTip}</p>
                      </div>
                    )}

                    {/* Good answer (70-84): acknowledge strengths, then one targeted improvement */}
                    {isGood && !isStrong && (
                      <>
                        {qImprovements.length > 0 && (
                          <div className="result-section result-improvement">
                            <label>{t('one_suggestion')}</label>
                            <p>{cleanMetrics(qImprovements[0])}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Needs work (<70): improvement + category tip + structure hint */}
                    {!isGood && (
                      <>
                        {qImprovements.length > 0 && (
                          <div className="result-section result-improvement">
                            <label>{t('improvements')}</label>
                            <ul>
                              {qImprovements.slice(0, 2).map((imp, ii) => (
                                <li key={ii}>{cleanMetrics(imp)}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="result-section result-category-tip">
                          <label>{t('answer_approach')}</label>
                          <p>{categoryTip}</p>
                          {structureHint && (
                            <div className="structure-hint">
                              <label>{t('answer_structure_hint')}</label>
                              <p>{structureHint}</p>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Sample answer — always shown for reference */}
                {question?.sample_answer && (
                  <div className="result-section sample-answer-block">
                    <label>{t('sample_answer')}</label>
                    {!isGood && qImprovements.length > 0 && (
                      <p className="sample-answer-context">
                        {lang === 'mn'
                          ? `Дараах хариулт "${qImprovements[0].slice(0, 60)}${qImprovements[0].length > 60 ? '...' : ''}" сайжруулалтыг хэрхэн шийдвэрлэж болохыг харуулна:`
                          : `This example shows how to address "${qImprovements[0].slice(0, 60)}${qImprovements[0].length > 60 ? '...' : ''}":`}
                      </p>
                    )}
                    {isGood && (
                      <p className="sample-answer-context">
                        {lang === 'mn'
                          ? 'Жишиг хариултыг харьцуулж, хариултаа улам сайжруулах боломжтой:'
                          : 'Compare with this sample answer to further refine your response:'}
                      </p>
                    )}
                    <p>{question.sample_answer}</p>
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>

      {/* Next Practice Recommendation — tailored to weakest areas */}
      <div className="card results-next-card">
        {score >= 75 && (
          <img src={illustHighfive} alt="" className="results-next-illustration" />
        )}
        <h3>{lang === 'mn' ? 'Дараагийн алхам' : 'Next Steps'}</h3>
        {(() => {
          // Find weakest dimension
          const dims = aggregate.dimension_scores || {};
          const dimEntries = Object.entries(dims);
          const weakest = dimEntries.length > 0
            ? dimEntries.reduce((a, b) => a[1] < b[1] ? a : b)
            : null;
          const weakDimLabel = weakest ? (SCORE_LABELS[weakest[0]] || weakest[0]) : '';

          // Find weakest question types
          const weakQuestions = (per_question || [])
            .map((r, i) => ({ score: r?.feedback?.overall_score || 0, tag: questions[i] ? classifyQuestion(questions[i].question, questions[i].category) : 'general' }))
            .filter(q => q.score < 70);
          const weakTags = [...new Set(weakQuestions.map(q => q.tag))].slice(0, 2);
          const weakTagLabels = weakTags.map(tag => t(`question_tag_${tag}`)).join(', ');

          return (
            <>
              <p className="results-next-desc">
                {score >= 80
                  ? (lang === 'mn'
                    ? `Маш сайн! Нийт ${score}% авсан байна.${weakest && Math.round(weakest[1]) < 80 ? ` "${weakDimLabel}" чиглэлд анхаарвал бүр ч сайжирна.` : ' Бүрэн ярилцлагын горимоор дасгалаа үргэлжлүүлээрэй.'}`
                    : `Great job with ${score}%!${weakest && Math.round(weakest[1]) < 80 ? ` Focus on "${weakDimLabel}" to improve further.` : ' Try a full mock interview to keep improving.'}`)
                  : score >= 60
                  ? (lang === 'mn'
                    ? `Сайн эхлэл!${weakest ? ` "${weakDimLabel}" чиглэлд онцгой анхаарч дасгал хийгээрэй.` : ''}${weakTagLabels ? ` ${weakTagLabels} төрлийн асуултуудад дахин дасгалаарай.` : ''}`
                    : `Good start!${weakest ? ` Pay special attention to "${weakDimLabel}".` : ''}${weakTagLabels ? ` Practice more ${weakTagLabels} questions.` : ''}`)
                  : (lang === 'mn'
                    ? `Дасгалаа үргэлжлүүлээрэй.${weakest ? ` "${weakDimLabel}" хэсэгт онцгой анхаараарай.` : ''} Асуулт бүрийн зөвлөмж, жишиг хариултуудыг судлаарай.`
                    : `Keep practicing.${weakest ? ` Focus especially on "${weakDimLabel}".` : ''} Review per-question tips and sample answers.`)}
              </p>
            </>
          );
        })()}
        <div className="results-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
            {t('btn_export_pdf')}
          </button>
          <button className="btn btn-primary" onClick={onRestart}>
            {t('btn_new_session')}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionResults;
