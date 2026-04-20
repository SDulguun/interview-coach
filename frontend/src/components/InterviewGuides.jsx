import { useState } from 'react';
import { useLang } from '../lang';
import illustInterviewIcon from '../assets/illust-interview-icon.jpg';

// ─── CV + JD Comparison Tool ───
const SKILL_KEYWORDS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'swift', 'kotlin',
  'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'next.js', 'svelte',
  'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch',
  'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'git', 'linux', 'terraform',
  'excel', 'powerpoint', 'word', 'sap', 'autocad', 'tableau', 'power bi',
  'photoshop', 'illustrator', 'figma', 'sketch', 'adobe xd',
  'machine learning', 'deep learning', 'data science', 'data analysis',
  'agile', 'scrum', 'jira', 'confluence',
  // Mongolian
  'харилцааны чадвар', 'багаар ажиллах', 'манлайлал', 'цагийн менежмент',
  'аналитик', 'шийдвэр гаргах', 'борлуулалт', 'маркетинг', 'санхүү',
  'нягтлан бодох', 'хүний нөөц', 'менежмент', 'програмчлал', 'дата шинжилгээ',
  'удирдлага', 'харилцаа', 'судалгаа', 'стратеги', 'бизнес',
];

function extractSkillsList(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return SKILL_KEYWORDS.filter(s => lower.includes(s));
}

function compareCvJd(cvText, jdText, lang) {
  const cvSkills = extractSkillsList(cvText);
  const jdSkills = extractSkillsList(jdText);
  const matched = jdSkills.filter(s => cvSkills.includes(s));
  const missing = jdSkills.filter(s => !cvSkills.includes(s));
  const extraCv = cvSkills.filter(s => !jdSkills.includes(s));

  // Generate talking points
  const talkingPoints = [];
  if (matched.length > 0) {
    talkingPoints.push(
      lang === 'mn'
        ? `Та ${matched.slice(0, 3).join(', ')} зэрэг шаардлагатай чадваруудтай. Эдгээрийг тодорхой жишээгээр дэмжээрэй.`
        : `You have ${matched.slice(0, 3).join(', ')} which the role requires. Support these with specific examples.`
    );
  }
  if (missing.length > 0) {
    talkingPoints.push(
      lang === 'mn'
        ? `${missing.slice(0, 2).join(', ')} нь зарт байгаа ч CV-д байхгүй. Суралцах хүсэл, холбогдох туршлагыг дурдаарай.`
        : `${missing.slice(0, 2).join(', ')} appear in the job posting but not your CV. Mention willingness to learn or related experience.`
    );
  }
  if (extraCv.length > 0) {
    talkingPoints.push(
      lang === 'mn'
        ? `${extraCv.slice(0, 2).join(', ')} зэрэг нэмэлт чадваруудаа давуу тал болгож дурдаарай.`
        : `Leverage extra skills like ${extraCv.slice(0, 2).join(', ')} as differentiators.`
    );
  }

  // Generate likely questions
  const questions = [];
  if (matched.length > 0) {
    questions.push(
      lang === 'mn'
        ? `"${matched[0]}" ашиглаж ажилласан тодорхой төсөл/жишээ ярина уу?`
        : `Tell me about a project where you used ${matched[0]}.`
    );
  }
  if (missing.length > 0) {
    questions.push(
      lang === 'mn'
        ? `"${missing[0]}" туршлагагүй бол хэрхэн суралцах вэ?`
        : `How would you approach learning ${missing[0]}?`
    );
  }
  questions.push(
    lang === 'mn'
      ? 'Хамгийн хүнд төсөлдөө юу сурсан бэ?'
      : 'What did you learn from your most challenging project?'
  );

  // Suggested examples to prepare
  const examples = [];
  matched.slice(0, 2).forEach(s => {
    examples.push(
      lang === 'mn'
        ? `${s} ашигласан тодорхой нэг төслийн жишээ бэлдээрэй (STAR аргаар)`
        : `Prepare a STAR-format example of using ${s} in a real project`
    );
  });
  if (missing.length > 0) {
    examples.push(
      lang === 'mn'
        ? `${missing[0]}-тай холбоотой суралцсан/адилтгах чадварын жишээ бэлдээрэй`
        : `Prepare an example of learning something similar to ${missing[0]}`
    );
  }

  return { matched, missing, extraCv, talkingPoints, questions, examples };
}

const guides = [
  {
    key: 'intro',
    titleKey: 'guide_intro_title',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    content: {
      mn: {
        summary: 'Ярилцлага ихэвчлэн "Өөрийгөө танилцуулна уу" гэсэн асуултаар эхэлнэ. Энэ бол таны анхны сэтгэгдэл.',
        points: [
          'Нэр, мэргэжил, одоогийн байдлаа товч хэлээрэй (1-2 өгүүлбэр)',
          'Ажлын туршлагаа товч дурдаарай — хамгийн чухал 1-2 зүйлийг',
          'Яагаад энэ ажлын байранд сонирхолтой байгаагаа холбоорой',
          '60 секундээс хэтрүүлэхгүй байхыг хичээ',
          'Хувийн амьдрал, хоббигоос илүү мэргэжлийн мэдээлэлд анхаарлаа хандуулаарай',
        ],
        example: 'Би Бат, МУИС-ийн мэдээллийн технологийн ангийг төгссөн. Сүүлийн 2 жил веб хөгжүүлэлт хийж, React, Node.js ашигладаг. Танай компанийн бүтээгдэхүүний инженерийн баг дээр миний туршлагыг ашиглаж болох юм гэж бодлоо.',
      },
      en: {
        summary: 'Most interviews start with "Tell me about yourself." This is your first impression.',
        points: [
          'State your name, field, and current situation in 1-2 sentences',
          'Mention your most relevant experience briefly',
          'Connect to why you are interested in this specific role',
          'Keep it under 60 seconds',
          'Focus on professional details, not personal hobbies',
        ],
        example: 'I\'m Bat, a computer science graduate from NUM. I\'ve been doing web development for 2 years, working with React and Node.js. I\'m excited about this role because your product engineering team aligns well with my experience.',
      },
    },
  },
  {
    key: 'star',
    titleKey: 'guide_star_title',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    content: {
      mn: {
        summary: 'STAR арга бол туршлагын (behavioral) асуултуудад хариулах хамгийн үр дүнтэй хүрээ.',
        points: [
          'S — Situation (Нөхцөл): Тодорхой нэг нөхцөл байдлыг тодорхойлоорой',
          'T — Task (Даалгавар): Таны хариуцсан даалгавар юу байсан бэ?',
          'A — Action (Үйлдэл): Та яг юу хийсэн бэ? Тодорхой алхмуудаа дурдаарай',
          'R — Result (Үр дүн): Ямар үр дүнд хүрсэн бэ? Тоо баримт байвал илүү сайн',
          'Жишээ: "Манай баг дедлайнаас хоцорч байсан (S). Би ахлах хөгжүүлэгчийн хувьд (T) даалгаврыг дахин хуваарилж, өдөр бүр богино уулзалт зохион байгуулсан (A). Үр дүнд бид хугацаандаа амжсан (R)."',
        ],
        example: 'Манай багийн нэг гишүүн гэнэт ажлаас гарсан. Би түүний даалгаврыг хуваарилж, багийн гишүүд бүрийн ачааллыг тэнцвэржүүлсэн. Үр дүнд бид хугацаандаа төслийг дуусгаж чадсан.',
      },
      en: {
        summary: 'The STAR method is the most effective framework for answering behavioral interview questions.',
        points: [
          'S — Situation: Describe a specific context or challenge',
          'T — Task: What was your responsibility?',
          'A — Action: What exactly did you do? Be specific about your steps',
          'R — Result: What was the outcome? Include numbers if possible',
          'Example: "Our team was behind deadline (S). As lead developer (T), I reassigned tasks and set up daily standups (A). We shipped on time (R)."',
        ],
        example: 'A team member left unexpectedly. I redistributed their tasks, balanced workloads across the team, and we finished the project on schedule.',
      },
    },
  },
  {
    key: 'strengths',
    titleKey: 'guide_strengths_title',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    content: {
      mn: {
        summary: 'Давуу болон сул талын асуултуудад бэлтгэх нь чухал. Хоёуланд нь шударга, тодорхой жишээтэй хариулаарай.',
        points: [
          'Давуу тал: Ажлын байранд хамааралтай чадвараа сонгоорой',
          'Давуу талаа жишээгээр баталгаажуулаарай — "Би шийдвэр хурдан гаргадаг. Жишээ нь..."',
          'Сул тал: Бодит сул талаа хэлээрэй, гэхдээ хэрхэн сайжруулж байгаагаа дурдаарай',
          '"Би төгс биш" гэх мэт хуурамч сул тал бүү хэлээрэй',
          'Сул талаа сайжруулах тодорхой алхмуудаа дурдаарай',
        ],
        example: 'Давуу тал: Би шинэ технологийг хурдан суралцдаг. Жишээ нь, сүүлийн ажил дээр 2 долоо хоногт React суралцаж, төслийг хугацаандаа дуусгасан. Сул тал: Олон нийтийн өмнө илтгэхэд итгэлгүй байдаг. Сүүлийн хагас жилд 3 удаа дотоод илтгэл хийж сайжруулж байна.',
      },
      en: {
        summary: 'Strengths and weaknesses questions are common. Be honest and specific for both.',
        points: [
          'Strengths: Choose abilities relevant to the job',
          'Back up your strength with a real example',
          'Weaknesses: Share a real one, but explain what you are doing to improve',
          'Avoid fake weaknesses like "I\'m a perfectionist"',
          'Describe specific steps you are taking to address your weakness',
        ],
        example: 'Strength: I learn new technologies quickly. For example, I picked up React in two weeks to meet a project deadline. Weakness: I used to struggle with public speaking, so I\'ve been practicing by giving internal presentations — I\'ve done three in the last six months.',
      },
    },
  },
  {
    key: 'behavioral',
    titleKey: 'guide_behavioral_title',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
    content: {
      mn: {
        summary: 'Зан төлөвийн асуултууд таны өмнөх туршлагаар ирээдүйн зан үйлийг тань таамаглахыг зорьдог.',
        points: [
          '"Таны ... нөхцөлд хэрхэн шийдвэрлэсэн тухай ярина уу" гэсэн маягтай асуултууд',
          'Заавал бодит, тодорхой жишээ дурдаарай',
          'Байхгүй жишээ зохиохоос илүү жижиг ч гэсэн бодит жишээ илүү итгэлтэй',
          'Суралцсан зүйлээ дурдаарай — ярилцлага авагч таны хөгжлийг харахыг хүсдэг',
          '3-5 бодит жишээ урьдчилан бэлдээрэй',
        ],
        example: 'Нэг удаа багийн гишүүнтэй санал зөрсөн. Би эхлээд түүний саналыг бүрэн сонсож, дараа нь өөрийн байр суурийг тайлбарлаж, эцэст нь хоёулаа зөвшөөрсөн шийдлийг олсон.',
      },
      en: {
        summary: 'Behavioral questions try to predict your future actions based on past experience.',
        points: [
          'These often start with "Tell me about a time when..."',
          'Always use a real, specific example',
          'A small but real example is better than a fabricated impressive one',
          'Mention what you learned — interviewers want to see growth',
          'Prepare 3-5 real examples in advance',
        ],
        example: 'I once disagreed with a teammate on an approach. I listened to their full perspective first, then explained mine. We ended up combining both ideas into a solution that worked better.',
      },
    },
  },
  {
    key: 'technical',
    titleKey: 'guide_technical_title',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    content: {
      mn: {
        summary: 'Мэргэжлийн асуултууд таны салбарын мэдлэг, асуудал шийдвэрлэх чадварыг шалгана.',
        points: [
          'Мэдэхгүй зүйлдээ шударга байгаарай — "Мэдэхгүй, гэхдээ суралцах боломжтой" гэж хэлэх нь хуурамч хариулснаас илүү сайн',
          'Арга барилаа тайлбарлаарай — зөвхөн хариулт биш, хэрхэн бодож байгаагаа харуулаарай',
          'Тодорхой жишээ ашиглаарай — "Би React ашигладаг" гэхийн оронд "React-аар дашбоард бүтээсэн" гэж хэлээрэй',
          'Ашигласан хэрэгсэл, технологиудаа тодорхой нэрлээрэй',
          'Давуу болон сул талыг харьцуулах (trade-off) чадвараа харуулаарай',
        ],
        example: 'Тэр төсөлд бид REST API-н оронд GraphQL ашиглахаар шийдсэн. REST-д олон endpoint хэрэгтэй байсан бол GraphQL нэг query-д шаардлагатай мэдээллийг авах боломжтой байсан.',
      },
      en: {
        summary: 'Technical questions test your domain knowledge and problem-solving ability.',
        points: [
          'Be honest about what you don\'t know — "I haven\'t used that, but I can learn" is better than faking it',
          'Explain your reasoning, not just the answer',
          'Use specific examples — instead of "I use React," say "I built a dashboard with React"',
          'Name specific tools and technologies you have used',
          'Show you can evaluate trade-offs between approaches',
        ],
        example: 'On that project, we chose GraphQL over REST because we needed flexible queries. REST would have required many endpoints, but GraphQL let us fetch exactly what we needed in one request.',
      },
    },
  },
  {
    key: 'mistakes',
    titleKey: 'guide_mistakes_title',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
    content: {
      mn: {
        summary: 'Ярилцлагад нийтлэг гаргадаг алдаануудаас зайлсхийвэл таны хариулт илүү мэргэжлийн сонсогдоно.',
        points: [
          'Хэт урт хариулт — 1-2 минутад багтаахыг хичээ',
          'Тодорхой жишээгүй хариулах — "Би сайн ажилтан" гэхийн оронд тодорхой жишээ хэл',
          'Өмнөх ажил, удирдлагаа муулах — мэргэжлийн бус сэтгэгдэл үлдээнэ',
          'Асуултыг сонсохгүй байх — асуултыг бүрэн сонсоод, хэрэгтэй бол тодруулга ас',
          'Бэлтгэлгүй ирэх — компаний талаар судалгаа хий, түгээмэл асуултуудыг дасгалла',
          'Цалингийн хэмжээг хэт эрт дурдах',
        ],
        example: '',
      },
      en: {
        summary: 'Avoiding common interview mistakes makes your answers sound more professional.',
        points: [
          'Answers that are too long — aim for 1-2 minutes per answer',
          'Answering without specific examples — don\'t just say "I\'m a good worker"',
          'Badmouthing previous employers — it leaves a bad impression',
          'Not listening to the question — listen fully, then clarify if needed',
          'Coming unprepared — research the company and practice common questions',
          'Bringing up salary too early in the conversation',
        ],
        example: '',
      },
    },
  },
  {
    key: 'cv',
    titleKey: 'guide_cv_title',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    content: {
      mn: {
        summary: 'CV болон ажлын зараа зэрэг ашиглаж бэлдвэл ярилцлагад илүү зорилготой, тохирсон хариулт өгч чадна.',
        points: [
          'Ажлын зарны шаардлагуудыг жагсааж, CV-нхаа тохирох туршлагуудыг холбоорой',
          'Ажлын зард дурдагдсан ур чадвар бүрдээ тодорхой жишээ бэлдээрэй',
          'CV-д байхгүй боловч зараар шаардагдах ур чадваруудыг хэрхэн нөхөж болохыг бодоорой',
          '"Тохируулах" хэсэгт CV болон ажлын зараа оруулж, тохирох ур чадваруудыг шалгаарай',
          'Бэлтгэлийн зөвлөмжийг дагаж, хариултуудаа зораарай',
        ],
        example: '',
      },
      en: {
        summary: 'Using your CV and the job description together helps you prepare targeted, relevant answers.',
        points: [
          'List the job requirements and match them to your CV experience',
          'Prepare a specific example for each required skill',
          'Think about how to address skills in the job posting that are not on your CV',
          'Use the "Customize" tab to upload your CV and job description for skill matching',
          'Follow the preparation tips to align your answers with what the role requires',
        ],
        example: '',
      },
    },
  },
];

// ─── CV+JD Interactive Tool Component ───
function CvJdTool() {
  const { t, lang } = useLang();
  const [cvText, setCvText] = useState('');
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState(null);

  function handleCompare() {
    if (cvText.trim().length < 20 || jdText.trim().length < 20) return;
    setResult(compareCvJd(cvText, jdText, lang));
  }

  const canCompare = cvText.trim().length >= 20 && jdText.trim().length >= 20;

  return (
    <div className="cv-jd-tool">
      <div className="cv-jd-inputs">
        <div className="cv-jd-input-group">
          <label>CV</label>
          <textarea
            placeholder={t('cv_jd_paste_cv')}
            value={cvText}
            onChange={e => { setCvText(e.target.value); setResult(null); }}
            rows={6}
          />
        </div>
        <div className="cv-jd-input-group">
          <label>{t('jd_label')}</label>
          <textarea
            placeholder={t('cv_jd_paste_jd')}
            value={jdText}
            onChange={e => { setJdText(e.target.value); setResult(null); }}
            rows={6}
          />
        </div>
      </div>

      <button
        className="btn btn-primary cv-jd-compare-btn"
        onClick={handleCompare}
        disabled={!canCompare}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        {t('cv_jd_compare')}
      </button>

      {!result && canCompare && (
        <p className="cv-jd-hint">{t('cv_jd_empty')}</p>
      )}

      {result && (
        <div className="cv-jd-results">
          {/* Matched + Missing skills */}
          <div className="cv-jd-skills-row">
            {result.matched.length > 0 && (
              <div className="cv-jd-skill-group">
                <label>{t('cv_jd_matched')}</label>
                <div className="cv-jd-chips">
                  {result.matched.map((s, i) => (
                    <span key={i} className="chip chip-matched">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {result.missing.length > 0 && (
              <div className="cv-jd-skill-group">
                <label>{t('cv_jd_missing')}</label>
                <div className="cv-jd-chips">
                  {result.missing.map((s, i) => (
                    <span key={i} className="chip chip-missing">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Talking Points */}
          {result.talkingPoints.length > 0 && (
            <div className="cv-jd-section">
              <label>{t('cv_jd_talking_points')}</label>
              <ul>
                {result.talkingPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {/* Likely Questions */}
          {result.questions.length > 0 && (
            <div className="cv-jd-section">
              <label>{t('cv_jd_likely_questions')}</label>
              <ul>
                {result.questions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}

          {/* Examples to Prepare */}
          {result.examples.length > 0 && (
            <div className="cv-jd-section">
              <label>{t('cv_jd_examples')}</label>
              <ul>
                {result.examples.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InterviewGuides() {
  const { t, lang } = useLang();
  const [activeGuide, setActiveGuide] = useState('intro');

  const current = guides.find(g => g.key === activeGuide) || guides[0];
  const content = current.content[lang] || current.content.mn;
  const isCvTool = activeGuide === 'cv';

  return (
    <div className="guides-page">
      <div className="guides-header">
        <div className="guides-header-row">
          <div>
            <h1>{t('guides_title')}</h1>
            <p>{t('guides_subtitle')}</p>
          </div>
          <img src={illustInterviewIcon} alt="" className="guides-header-illustration" />
        </div>
      </div>

      <div className="guides-tabs">
        {guides.map((guide) => (
          <button
            key={guide.key}
            className={`guides-tab ${activeGuide === guide.key ? 'active' : ''}`}
            onClick={() => setActiveGuide(guide.key)}
          >
            {guide.icon}
            <span>{t(guide.titleKey)}</span>
          </button>
        ))}
      </div>

      <div className="guides-content card">
        <h2>{t(current.titleKey)}</h2>
        <p className="guides-summary">{content.summary}</p>

        {isCvTool ? (
          <CvJdTool />
        ) : (
          <>
            <div className="guides-points">
              {content.points.map((point, i) => (
                <div key={i} className="guides-point">
                  <span className="guides-point-num">{i + 1}</span>
                  <p>{point}</p>
                </div>
              ))}
            </div>

            {content.example && (
              <div className="guides-example">
                <label>{lang === 'mn' ? 'Жишээ' : 'Example'}</label>
                <p>{content.example}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default InterviewGuides;
