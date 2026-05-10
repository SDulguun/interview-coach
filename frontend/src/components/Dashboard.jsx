import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  User, Check, ArrowRight, ArrowLeft,
  Smile, BarChart3, Star,
  Landmark, ShoppingBag, Pickaxe, Building2, Factory, GraduationCap,
  Code2, HeartPulse, Megaphone, Users, HelpCircle,
} from 'lucide-react';
import { useLang } from '../lang';
import { Button, Pill, PageTransition } from './ui';
import './dashboard.css';

const INDUSTRIES = [
  {
    key: 'Банк, санхүү, нягтлан бодох бүртгэл', Icon: Landmark,
    skills: ['Харилцааны чадвар', 'Нягт нямбай', 'Санхүүгийн тайлагнал', 'Аналитик сэтгэлгээ'],
    companies: ['Хаан банк', 'Голомт банк', 'ХХБ', 'Хас банк'],
  },
  {
    key: 'Худалдаа, борлуулалт', Icon: ShoppingBag,
    skills: ['Хэлэлцээр хийх', 'Борлуулалтын стратеги', 'Үйлчлүүлэгчийн менежмент'],
    companies: ['Номин холдинг', 'Tavan Bogd', 'E-mart', 'Good Price'],
  },
  {
    key: 'Уул уурхай', Icon: Pickaxe,
    skills: ['Багаар ажиллах', 'Аюулгүй ажиллагаа', 'Дасан зохицох'],
    companies: ['Оюу толгой', 'Эрдэнэт', 'Тавантолгой'],
  },
  {
    key: 'Барилга, үл хөдлөх хөрөнгө', Icon: Building2,
    skills: ['AutoCAD', 'Цагийн менежмент', 'Хамтран ажиллах'],
    companies: ['MCS Барилга', 'Бишрэлт', 'Max Group'],
  },
  {
    key: 'Үйлдвэрлэл, инженерчлэл', Icon: Factory,
    skills: ['Чанарын хяналт', 'Нягт нямбай', 'Процесс сайжруулалт'],
    companies: ['APU', 'Gobi', 'MCS Electronics'],
  },
  {
    key: 'Боловсрол, шинжлэх ухаан', Icon: GraduationCap,
    skills: ['Сургалтын арга зүй', 'Харилцааны чадвар'],
    companies: ['МУИС', 'ШУТИС', 'МУБИС'],
  },
  {
    key: 'Мэдээллийн технологи, программ хангамж', Icon: Code2,
    skills: ['Алгоритм', 'Багийн ажил', 'Системийн сэтгэлгээ'],
    companies: ['Unitel', 'Mobicom', 'AND Systems', 'IT Zone'],
  },
  {
    key: 'Эрүүл мэнд', Icon: HeartPulse,
    skills: ['Харилцааны чадвар', 'Нягт нямбай', 'Багаар ажиллах'],
    companies: ['Интермед', 'Сонгдо', 'Гранд Мед'],
  },
  {
    key: 'Маркетинг PR, менежмент', Icon: Megaphone,
    skills: ['Брэнд менежмент', 'Бүтээлч сэтгэлгээ', 'Аналитик'],
    companies: ['Monos', 'Tavan Bogd Foods', 'SKY Media'],
  },
  {
    key: 'Захиргаа, хүний нөөц', Icon: Users,
    skills: ['Харилцаа', 'Сургалт, хөгжил', 'Шийдвэр гаргах'],
    companies: ['MCS Group', 'Max Group', 'Shunkhlai'],
  },
  {
    key: '__other__', Icon: HelpCircle,
    skills: ['Харилцааны чадвар', 'Багаар ажиллах', 'Цагийн менежмент'],
    companies: [],
  },
];

const DIFFICULTY_MODES = [
  {
    key: 'easy', Icon: Smile, questions: 10, minutes: 15,
    label_mn: 'Хөнгөн', label_en: 'Easy',
    desc_mn: 'Шинэ суралцагчдад', desc_en: 'For beginners',
  },
  {
    key: 'medium', Icon: BarChart3, questions: 15, minutes: 25,
    label_mn: 'Дунд', label_en: 'Medium',
    desc_mn: 'Жинхэнэ ярилцлагын түвшин', desc_en: 'Real interview level',
    recommended: true,
  },
  {
    key: 'hard', Icon: Star, questions: 20, minutes: 35,
    label_mn: 'Хүнд', label_en: 'Hard',
    desc_mn: 'Гүн шинжилгээ, олон талт асуудал', desc_en: 'Deep analysis, trade-offs',
  },
];

function Dashboard({
  selectedJob, onJobChange,
  onStartInterview, loading,
  difficulty, onDifficultyChange,
  userName, onUserNameChange,
}) {
  const { t, lang } = useLang();
  const [step, setStep] = useState(0);
  const [customRole, setCustomRole] = useState(selectedJob?.isOther ? selectedJob.title : '');

  const steps = [
    { key: 'info',     label: lang === 'mn' ? 'Мэдээлэл'   : 'Info' },
    { key: 'industry', label: lang === 'mn' ? 'Салбар'     : 'Industry' },
    { key: 'mode',     label: lang === 'mn' ? 'Түвшин'     : 'Mode' },
    { key: 'summary',  label: lang === 'mn' ? 'Тойм'       : 'Summary' },
  ];

  const activeMode = DIFFICULTY_MODES.find(m => m.key === difficulty) || DIFFICULTY_MODES[1];
  const isOtherSelected = !!selectedJob?.isOther;
  const activeIndustry = selectedJob
    ? (isOtherSelected
        ? INDUSTRIES.find(x => x.key === '__other__')
        : INDUSTRIES.find(x => x.key === selectedJob.title))
    : null;

  function canProceed() {
    if (step === 0) return userName.trim().length > 0;
    if (step === 1) {
      if (!selectedJob) return false;
      if (isOtherSelected && customRole.trim().length < 3) return false;
      return true;
    }
    return true;
  }

  function nextStep() {
    if (!canProceed()) return;
    setStep(s => Math.min(s + 1, steps.length - 1));
  }
  function prevStep() { setStep(s => Math.max(s - 1, 0)); }

  function handleIndustrySelect(entry) {
    const isOther = entry.key === '__other__';
    const sameTile = isOther
      ? selectedJob?.isOther
      : selectedJob?.title === entry.key;
    if (sameTile) {
      onJobChange(null);
      if (isOther) setCustomRole('');
      return;
    }
    if (isOther) {
      const trimmed = customRole.trim();
      onJobChange({
        id: null,
        title: trimmed || '',
        company: '',
        description: '',
        required_skills: entry.skills.join(', '),
        isOther: true,
      });
    } else {
      onJobChange({
        id: null,
        title: entry.key,
        company: '',
        description: '',
        required_skills: entry.skills.join(', '),
        isOther: false,
      });
    }
  }

  function handleCustomRoleChange(value) {
    setCustomRole(value);
    if (selectedJob?.isOther) {
      onJobChange({ ...selectedJob, title: value.trim() });
    }
  }

  return (
    <PageTransition keyName={`dashboard-${step}`}>
      <div className="wiz">
        {/* Step indicator */}
        <div className="wiz-steps">
          {steps.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'future';
            return (
              <div key={s.key} className={`wiz-step ${state}`}>
                <div className="wiz-step-dot">
                  {state === 'done' ? <Check size={14} strokeWidth={2} /> : <span className="mono">{i + 1}</span>}
                </div>
                <span className="wiz-step-label">{s.label}</span>
                {i < steps.length - 1 && <div className="wiz-step-line" />}
              </div>
            );
          })}
        </div>

        {/* Step 1 — Info */}
        {step === 0 && (
          <div className="wiz-card">
            <div className="label" style={{ marginBottom: 8 }}>
              {lang === 'mn' ? 'Алхам 1' : 'Step 1'}
            </div>
            <h2>{lang === 'mn' ? 'Та өөрийн нэрийг оруулна уу' : 'What should we call you?'}</h2>
            <p className="subtle" style={{ margin: '6px 0 22px' }}>
              {lang === 'mn'
                ? 'Нэрээ бичээрэй — ярилцлагын явцад Таныг нэрээр нь дуудна.'
                : 'Your name will be used to personalise the session.'}
            </p>
            <div className="wiz-field">
              <label>{t('user_name')}</label>
              <input
                type="text"
                placeholder={t('user_name_placeholder')}
                value={userName}
                onChange={(e) => onUserNameChange(e.target.value)}
                autoFocus
              />
            </div>
            <div className="wiz-actions">
              <div />
              <Button onClick={nextStep} disabled={!canProceed()}>
                {lang === 'mn' ? 'Үргэлжлүүлэх' : 'Continue'}
                <ArrowRight size={14} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Industry */}
        {step === 1 && (
          <div className="wiz-card">
            <div className="label" style={{ marginBottom: 8 }}>
              {lang === 'mn' ? 'Алхам 2' : 'Step 2'}
            </div>
            <h2>{lang === 'mn' ? 'Салбараа сонгоорой' : 'Choose your industry'}</h2>
            <p className="subtle" style={{ margin: '6px 0 22px' }}>
              {lang === 'mn'
                ? 'Сонгосон салбарт тань тохирсон асуулт ирнэ.'
                : 'Questions will be tailored to the selected industry.'}
            </p>
            <div className="industry-grid">
              {INDUSTRIES.map(({ key, Icon }) => {
                const active = key === '__other__'
                  ? !!selectedJob?.isOther
                  : selectedJob?.title === key && !selectedJob?.isOther;
                const name = key === '__other__'
                  ? (lang === 'mn' ? 'Бусад' : 'Other')
                  : key;
                return (
                  <button
                    key={key}
                    className={`industry-tile ${active ? 'selected' : ''}`}
                    onClick={() => handleIndustrySelect(INDUSTRIES.find(x => x.key === key))}
                    type="button"
                    aria-pressed={active}
                  >
                    <Icon size={16} strokeWidth={1.5} />
                    <span>{name}</span>
                    {active && (
                      <span className="card-check" aria-hidden="true">
                        <Check size={11} strokeWidth={2.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {isOtherSelected && (
                <motion.div
                  key="other-input"
                  className="industry-detail"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="industry-detail-inner">
                    <div className="label">
                      {lang === 'mn' ? 'Аль ажил мэргэжилд бэлдэж байна вэ?' : 'Which role are you preparing for?'}
                    </div>
                    <div className="wiz-field" style={{ marginTop: 8 }}>
                      <input
                        type="text"
                        value={customRole}
                        onChange={(e) => handleCustomRoleChange(e.target.value)}
                        placeholder={lang === 'mn'
                          ? 'Жишээ нь: HR менежер, дизайнер, орчуулагч...'
                          : 'e.g. HR manager, designer, translator...'}
                        autoFocus
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              {activeIndustry && !isOtherSelected && (
                <motion.div
                  key="industry-detail"
                  className="industry-detail"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="industry-detail-inner">
                    <div className="label">
                      {lang === 'mn' ? 'Энэ салбарт хэрэгтэй гол ур чадварууд' : 'Core skills for this industry'}
                    </div>
                    <div className="industry-skills">
                      {activeIndustry.skills.map((s) => (
                        <Pill key={s} active>{s}</Pill>
                      ))}
                    </div>
                    {activeIndustry.companies.length > 0 && (
                      <>
                        <div className="label" style={{ marginTop: 16 }}>
                          {lang === 'mn' ? 'Жишээ Байгууллагууд' : 'Example Companies'}
                        </div>
                        <div className="industry-companies">
                          {activeIndustry.companies.map((c) => (
                            <span key={c} className="tag">{c}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="wiz-actions">
              <Button variant="ghost" onClick={prevStep}>
                <ArrowLeft size={14} strokeWidth={1.5} />
                {lang === 'mn' ? 'Буцах' : 'Back'}
              </Button>
              <Button onClick={nextStep} disabled={!canProceed()}>
                {lang === 'mn' ? 'Үргэлжлүүлэх' : 'Continue'}
                <ArrowRight size={14} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Mode */}
        {step === 2 && (
          <div className="wiz-card">
            <div className="label" style={{ marginBottom: 8 }}>
              {lang === 'mn' ? 'Алхам 3' : 'Step 3'}
            </div>
            <h2>{lang === 'mn' ? 'Түвшнээ сонгоорой' : 'Choose a difficulty'}</h2>
            <p className="subtle" style={{ margin: '6px 0 22px' }}>
              {lang === 'mn'
                ? 'Сонгосон түвшингээс хамаарч асуултын тоо, түвшин өөрчлөгдөнө.'
                : 'Difficulty affects question count and depth.'}
            </p>

            <div className="mode-grid">
              {DIFFICULTY_MODES.map((mode) => {
                const active = difficulty === mode.key;
                const label = lang === 'mn' ? mode.label_mn : mode.label_en;
                const desc  = lang === 'mn' ? mode.desc_mn  : mode.desc_en;
                return (
                  <button
                    key={mode.key}
                    type="button"
                    className={`mode-card ${active ? 'selected' : ''} ${mode.recommended ? 'recommended' : ''}`}
                    onClick={() => onDifficultyChange(mode.key)}
                    aria-pressed={active}
                  >
                    {mode.recommended && (
                      <span className="mode-badge">
                        {lang === 'mn' ? 'Санал Болгох' : 'Recommended'}
                      </span>
                    )}
                    {active && (
                      <span className="card-check" aria-hidden="true">
                        <Check size={11} strokeWidth={2.5} />
                      </span>
                    )}
                    <mode.Icon size={20} strokeWidth={1.5} className="mode-icon" />
                    <div className="mode-label">{label}</div>
                    <div className="mode-desc subtle">{desc}</div>
                    <div className="mode-meta mono">
                      {mode.questions} {lang === 'mn' ? 'асуулт' : 'q'} · ~{mode.minutes} {lang === 'mn' ? 'мин' : 'min'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="wiz-actions">
              <Button variant="ghost" onClick={prevStep}>
                <ArrowLeft size={14} strokeWidth={1.5} />
                {lang === 'mn' ? 'Буцах' : 'Back'}
              </Button>
              <Button onClick={nextStep}>
                {lang === 'mn' ? 'Үргэлжлүүлэх' : 'Continue'}
                <ArrowRight size={14} strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Summary */}
        {step === 3 && (
          <div className="wiz-card">
            <div className="label" style={{ marginBottom: 8 }}>
              {lang === 'mn' ? 'Алхам 4' : 'Step 4'}
            </div>
            <h2>{lang === 'mn' ? 'Бүгд бэлэн боллоо' : "You're all set"}</h2>
            <p className="subtle" style={{ margin: '6px 0 28px' }}>
              {lang === 'mn'
                ? 'Доорх мэдээллээ нягталж, ярилцлагаа эхлүүлээрэй.'
                : 'Double-check the setup and start when ready.'}
            </p>

            <div className="summary-row">
              <div className="summary-stat">
                <User size={14} strokeWidth={1.5} />
                <span className="summary-value">{userName}</span>
                <span className="summary-label">{lang === 'mn' ? 'Нэр' : 'Name'}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-value mono">{activeMode.questions}</span>
                <span className="summary-label">{lang === 'mn' ? 'Асуулт' : 'Questions'}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-value">{lang === 'mn' ? activeMode.label_mn : activeMode.label_en}</span>
                <span className="summary-label">{lang === 'mn' ? 'Түвшин' : 'Difficulty'}</span>
              </div>
              <div className="summary-stat">
                <span className="summary-value mono">~{activeMode.minutes} {lang === 'mn' ? 'мин' : 'min'}</span>
                <span className="summary-label">{lang === 'mn' ? 'Хугацаа' : 'Duration'}</span>
              </div>
            </div>

            {activeIndustry && (
              <div className="summary-industry">
                <Pill active>
                  <activeIndustry.Icon size={14} strokeWidth={1.5} />
                  {activeIndustry.key === '__other__'
                    ? (selectedJob?.title?.trim() || (lang === 'mn' ? 'Бусад' : 'Other'))
                    : activeIndustry.key}
                </Pill>
              </div>
            )}

            <div className="wiz-actions summary-actions">
              <Button variant="ghost" onClick={prevStep}>
                <ArrowLeft size={14} strokeWidth={1.5} />
                {lang === 'mn' ? 'Буцах' : 'Back'}
              </Button>
              <Button
                size="lg"
                onClick={onStartInterview}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading
                  ? (lang === 'mn' ? 'Уншиж байна…' : 'Loading…')
                  : (lang === 'mn' ? 'Ярилцлага Эхлүүлэх' : 'Start Interview')}
                {!loading && <ArrowRight size={16} strokeWidth={1.5} />}
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

export default Dashboard;
