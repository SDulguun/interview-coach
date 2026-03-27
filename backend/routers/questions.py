"""Interview questions endpoint — hybrid AI + curated CSV approach."""
import os
import re
import glob
import random
import logging
import pandas as pd
from fastapi import APIRouter, Query
from pydantic import BaseModel

from ..config import MN_QA_DIR

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/questions", tags=["questions"])

_df_qa = None

# Category → keyword mapping for CSV question matching
CATEGORY_KEYWORDS = {
    "Банк, санхүү, нягтлан бодох бүртгэл": [
        "санхүү", "нягтлан", "банк", "зээл", "тайлан", "аудит", "татвар",
        "financial", "accounting", "bank", "audit", "budget",
    ],
    "Худалдаа, борлуулалт": [
        "борлуулалт", "худалдаа", "үйлчлүүлэгч", "маркетинг", "зах зээл",
        "sales", "retail", "customer", "revenue",
    ],
    "Уул уурхай": [
        "уурхай", "геологи", "олборлолт", "mining", "geology", "ore",
    ],
    "Барилга, үл хөдлөх хөрөнгө": [
        "барилга", "инженер", "архитектур", "зураг", "төсөв", "үл хөдлөх",
        "construction", "engineer", "architecture", "CAD", "real estate",
    ],
    "Үйлдвэрлэл, инженерчлэл": [
        "үйлдвэрлэл", "инженер", "чанар", "машин", "тоног",
        "manufacturing", "engineer", "quality", "production",
    ],
    "Боловсрол, шинжлэх ухаан": [
        "багш", "сургалт", "боловсрол", "оюутан", "хичээл", "шинжлэх",
        "teacher", "education", "training", "curriculum", "science",
    ],
    "Мэдээллийн технологи, программ хангамж": [
        "програм", "хөгжүүлэлт", "систем", "сүлжээ", "мэдээлэл", "IT",
        "software", "developer", "code", "database", "cloud", "network",
    ],
    "Эрүүл мэнд": [
        "эмч", "эрүүл мэнд", "эмнэлэг", "сувилагч", "анагаах",
        "doctor", "health", "medical", "nurse", "patient",
    ],
    "Маркетинг PR, менежмент": [
        "маркетинг", "брэнд", "зар сурталчилгаа", "менежмент", "PR",
        "marketing", "brand", "advertising", "management", "campaign",
    ],
    "Захиргаа, хүний нөөц": [
        "хүний нөөц", "ажилтан", "сонгон шалгаруулалт", "HR", "захиргаа",
        "recruitment", "onboarding", "human resources", "admin",
    ],
}


def _get_qa_df() -> pd.DataFrame:
    global _df_qa
    if _df_qa is None:
        frames = []
        for csv_path in sorted(glob.glob(os.path.join(MN_QA_DIR, "*.csv"))):
            tmp = pd.read_csv(csv_path)
            if "company" not in tmp.columns:
                tmp.insert(0, "company", "Unitel Group")
            tmp["source_file"] = os.path.basename(csv_path)
            frames.append(tmp)
        if frames:
            _df_qa = pd.concat(frames, ignore_index=True)
        else:
            _df_qa = pd.DataFrame(columns=["company", "асуулт", "хариулт", "source_file"])
    return _df_qa


def _is_valid_interview_question(question_text: str) -> bool:
    """Filter out non-candidate-facing questions from CSV data."""
    q = question_text.lower().strip()
    # Filter out evaluator/meta questions and internal references
    INVALID_PATTERNS = [
        "ярилцлагыг хараад",       # "watching the interview"
        "номын ойлголтууд",         # "book concepts"
        "анужин",                   # internal name reference
        "хэлэлцүүлэг",             # panel discussion meta
        "нэр дэвшигч",             # "candidate" meta-reference
        "тавтай морил",            # greeting/intro from interviewer
        "харьцуулахыг оролд",      # "tried to compare" (meta)
    ]
    if any(pat in q for pat in INVALID_PATTERNS):
        return False
    # Must be at least 10 chars
    if len(q) < 10:
        return False
    return True


def _match_csv_questions(category: str = "", job_description: str = "", skills: str = "", limit: int = 3) -> list[dict]:
    """Sample relevant questions from CSV dataset based on category/JD/skills."""
    df = _get_qa_df()
    if df.empty:
        return []

    # Filter to valid interview questions only
    df = df[df["асуулт"].apply(lambda x: _is_valid_interview_question(str(x)))]
    if df.empty:
        return []

    # Build search terms from category keywords + JD + skills
    search_terms = []
    if category:
        # Try exact match first
        if category in CATEGORY_KEYWORDS:
            search_terms.extend(CATEGORY_KEYWORDS[category])
        else:
            # Fuzzy: find best matching key by word overlap
            cat_words = set(category.lower().split())
            best_key = None
            best_overlap = 0
            for key in CATEGORY_KEYWORDS:
                key_words = set(key.lower().split())
                overlap = len(cat_words & key_words)
                if overlap > best_overlap:
                    best_overlap = overlap
                    best_key = key
            if best_key and best_overlap >= 1:
                search_terms.extend(CATEGORY_KEYWORDS[best_key])
    if skills:
        search_terms.extend([s.strip().lower() for s in skills.split(",") if s.strip()])
    if job_description:
        # Extract meaningful words from JD (> 3 chars)
        jd_words = re.findall(r'[а-яөүёА-ЯӨҮЁ\w]{4,}', job_description.lower())
        search_terms.extend(jd_words[:10])

    if not search_terms:
        # No search context — return empty, let templates handle it
        return []

    matched = []
    # Score each question by how many search terms it matches
    for _, row in df.iterrows():
        q_text = str(row.get("асуулт", "")).lower()
        a_text = str(row.get("хариулт", "")).lower()
        combined = f"{q_text} {a_text}"
        score = sum(1 for term in search_terms if term in combined)
        if score > 0:
            matched.append({
                "question": row["асуулт"],
                "sample_answer": row.get("хариулт", ""),
                "company": row.get("company", ""),
                "source": "csv",
                "relevance_score": score,
            })

    # Sort by relevance, deduplicate, take top N
    matched.sort(key=lambda x: x["relevance_score"], reverse=True)
    seen = set()
    unique = []
    for m in matched:
        if m["question"] not in seen:
            seen.add(m["question"])
            unique.append(m)
        if len(unique) >= limit:
            break

    return unique


def _generate_ai_questions(category: str = "", job_description: str = "", skills: str = "", count: int = 3) -> list[dict]:
    """Generate interview questions using OpenAI/Anthropic API if available."""
    # Check for API keys
    openai_key = os.environ.get("OPENAI_API_KEY")
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY")

    if openai_key:
        return _generate_with_openai(openai_key, category, job_description, skills, count)
    elif anthropic_key:
        return _generate_with_anthropic(anthropic_key, category, job_description, skills, count)
    else:
        # No API key — use template-based generation as fallback
        return _generate_template_questions(category, job_description, skills, count)


def _generate_with_openai(api_key: str, category: str, jd: str, skills: str, count: int) -> list[dict]:
    """Generate questions using OpenAI API."""
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)

        prompt = _build_generation_prompt(category, jd, skills, count)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Та Монгол хэлээр ажлын ярилцлагын асуултууд бичдэг мэргэжилтэн. Асуултуудыг Монгол хэлээр, мэргэжлийн түвшинд бичнэ үү."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
        )
        return _parse_ai_response(response.choices[0].message.content, count)
    except Exception as e:
        logger.warning(f"OpenAI generation failed: {e}")
        return _generate_template_questions(category, jd, skills, count)


def _generate_with_anthropic(api_key: str, category: str, jd: str, skills: str, count: int) -> list[dict]:
    """Generate questions using Anthropic API."""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        prompt = _build_generation_prompt(category, jd, skills, count)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            messages=[
                {"role": "user", "content": f"Та Монгол хэлээр ажлын ярилцлагын асуултууд бичдэг мэргэжилтэн.\n\n{prompt}"},
            ],
        )
        return _parse_ai_response(response.content[0].text, count)
    except Exception as e:
        logger.warning(f"Anthropic generation failed: {e}")
        return _generate_template_questions(category, jd, skills, count)


def _build_generation_prompt(category: str, jd: str, skills: str, count: int) -> str:
    """Build the prompt for AI question generation."""
    parts = [f"Дараах мэдээлэлд тулгуурлан ажлын ярилцлагын {count} асуулт бичнэ үү."]

    if category:
        parts.append(f"Ажлын салбар: {category}")
    if jd:
        parts.append(f"Ажлын тайлбар: {jd[:500]}")
    if skills:
        parts.append(f"Шаардагдах ур чадвар: {skills}")

    parts.append(f"""
Асуулт бүрийг дараах форматаар бичнэ үү:
АСУУЛТ: [асуултын текст]
ЗӨВЛӨМЖ: [хариулахад тусалах товч зөвлөмж]
ЖИШИГ: [жишиг хариултын жишээ]

Асуултууд нь:
- Энэ салбарт тохирсон, мэргэжлийн түвшний байх
- Хариулагчийн туршлага, ур чадварыг үнэлэх чадвартай байх
- Монгол хэлээр бичигдсэн байх
""")
    return "\n".join(parts)


def _parse_ai_response(text: str, count: int) -> list[dict]:
    """Parse AI-generated text into structured questions."""
    questions = []
    blocks = re.split(r'АСУУЛТ:\s*', text)

    for block in blocks[1:]:  # Skip first empty split
        if not block.strip():
            continue

        lines = block.strip().split("\n")
        question_text = lines[0].strip()

        tip = ""
        sample_answer = ""
        for line in lines[1:]:
            if line.strip().startswith("ЗӨВЛӨМЖ:"):
                tip = line.strip().replace("ЗӨВЛӨМЖ:", "").strip()
            elif line.strip().startswith("ЖИШИГ:"):
                sample_answer = line.strip().replace("ЖИШИГ:", "").strip()

        if question_text:
            questions.append({
                "question": question_text,
                "category": "AI",
                "tip": tip or "Тодорхой жишээгээр хариулаарай.",
                "sample_answer": sample_answer,
                "source": "ai",
            })

        if len(questions) >= count:
            break

    return questions


def _generate_template_questions(category: str, jd: str, skills: str, count: int) -> list[dict]:
    """Fallback: generate questions from templates when no AI API key is available."""
    # Category-specific question templates
    CATEGORY_TEMPLATES = {
        "Банк, санхүү, нягтлан бодох бүртгэл": [
            {"question": "Санхүүгийн тайлан гаргах үйл явцыг тайлбарлана уу.", "tip": "Дараалал, стандартыг тодорхой хэлээрэй.", "sample_answer": "Санхүүгийн тайлан гаргахдаа эхлээд ажил гүйлгээний бүртгэлийг нэгтгэж, дүн тулгалт хийнэ. Дараа нь ашиг алдагдлын тайлан, баланс, мөнгөн гүйлгээний тайланг дараалалтай гаргана."},
            {"question": "Зээлийн эрсдэлийг хэрхэн үнэлдэг вэ?", "tip": "Тодорхой аргачлалаар хариулаарай.", "sample_answer": "Зээлийн эрсдэлийг үнэлэхдээ зээлдэгчийн санхүүгийн түүх, орлого, барьцаа хөрөнгийг шинжлэх ба скорингын загвар ашиглан эрсдэлийн түвшинг тодорхойлно."},
            {"question": "Нягтлан бодох бүртгэлийн стандартуудын талаар юу мэддэг вэ?", "tip": "НББОУС-ын талаар дурдаарай.", "sample_answer": "НББОУС (IFRS) болон Монголын нягтлан бодох бүртгэлийн стандартуудыг мэддэг. Тухайлбал, НББОУС 1 – Санхүүгийн тайлагнал, НББОУС 16 – Үндсэн хөрөнгө зэргийг практик дээр ашиглаж байсан."},
        ],
        "Худалдаа, борлуулалт": [
            {"question": "Борлуулалтын зорилтоо хэрхэн биелүүлдэг вэ?", "tip": "Тоон үр дүнгээр нотлоорой.", "sample_answer": "Борлуулалтын зорилтыг биелүүлэхийн тулд долоо хоног бүр хэрэглэгчийн мэдээллийн санг шинэчилж, шинэ боломжуудыг хайдаг. CRM систем ашиглан дагалт хийж, үйлчлүүлэгч бүрт хувь тохируулсан санал бэлтгэдэг."},
            {"question": "Гомдол ихтэй үйлчлүүлэгчтэй хэрхэн харьцдаг вэ?", "tip": "Тайван, мэргэжлийн хандлагыг онцлоорой.", "sample_answer": "Эхлээд үйлчлүүлэгчийн гомдлыг тайван сонсож, ойлголт илэрхийлдэг. Дараа нь асуудлыг тодорхойлж, хурдан шийдэл санал болгодог. Шийдвэрлэсний дараа дагалт хийж, сэтгэл ханамжийг баталгаажуулдаг."},
            {"question": "Борлуулалтын стратегиа хэрхэн боловсруулдаг вэ?", "tip": "Зах зээлийн судалгаа, зорилтот бүлгийн талаар ярьж болно.", "sample_answer": "Эхлээд зах зээлийн судалгаа хийж, зорилтот хэрэглэгчдийн хэрэгцээг тодорхойлдог. Өрсөлдөгчийн шинжилгээ хийж, бүтээгдэхүүнийхээ давуу талыг онцолсон борлуулалтын санал боловсруулдаг."},
        ],
        "Уул уурхай": [
            {"question": "Уурхайн аюулгүй ажиллагааны стандартуудыг хэрхэн мөрддөг вэ?", "tip": "Аюулгүй байдлын тодорхой арга хэмжээнүүдийг дурдаарай.", "sample_answer": "Ажлын байранд аюулгүй байдлын дүрмийг чанд мөрдөж, хамгаалах хэрэгслийг заавал ашигладаг. Өдөр бүр аюулгүй байдлын үзлэг хийж, эрсдэлийн үнэлгээ явуулдаг. Ослын үед авах арга хэмжээний төлөвлөгөөг бэлтгэж, сургалт зохион байгуулдаг."},
            {"question": "Геологийн судалгааны үр дүнг хэрхэн шинжилдэг вэ?", "tip": "Тодорхой арга, технологийг дурдаарай.", "sample_answer": "Геологийн зураглал, дээжийн шинжилгээ, геофизикийн мэдээллийг нэгтгэн шинжилдэг. GIS програм хангамж ашиглаж, ашигт малтмалын нөөцийн тооцоо гаргадаг."},
            {"question": "Байгаль орчны нөлөөллийн үнэлгээний талаар юу мэддэг вэ?", "tip": "Хууль эрх зүйн шаардлага, практик туршлагаа хэлээрэй.", "sample_answer": "Уул уурхайн үйл ажиллагааны байгаль орчинд үзүүлэх нөлөөллийг үнэлж, нөхөн сэргээлтийн төлөвлөгөө боловсруулдаг. Байгаль орчны хууль тогтоомжийг мөрдөж, тогтмол мониторинг хийдэг."},
        ],
        "Барилга, үл хөдлөх хөрөнгө": [
            {"question": "Барилгын төслийн удирдлагын туршлагаа ярина уу.", "tip": "Төслийн хэмжээ, хугацаа, үр дүнг дурдаарай.", "sample_answer": "Орон сууцны 12 давхар барилгын төслийг удирдаж, 18 сарын хугацаанд дуусгасан. Өдөр бүр ажлын явцыг хянаж, туслан гүйцэтгэгчидтэй уулзалт зохион байгуулж, төсвийг хэтрүүлэлгүй ажиллуулсан."},
            {"question": "Барилгын аюулгүй байдлын стандартуудыг хэрхэн хангадаг вэ?", "tip": "Тодорхой дүрэм, журмыг дурдаарай.", "sample_answer": "БНбД стандартуудыг чанд мөрдөж, ажилчдад аюулгүй байдлын сургалт тогтмол зохион байгуулдаг. Хамгаалах хэрэгслийн хангамж, ажлын байрны аюулгүй нөхцөлийг өдөр бүр шалгадаг."},
            {"question": "AutoCAD болон барилгын зураг төслийн программ дээр ажиллах туршлагаа ярина уу.", "tip": "Тодорхой программ, төслийн жишээ хэлээрэй.", "sample_answer": "AutoCAD, Revit программ дээр 3 жил ажилласан туршлагатай. Барилгын ажлын зураг, цахилгаан, сантехникийн зураг төсөл хийж, BIM загварчлалд оролцож байсан."},
        ],
        "Үйлдвэрлэл, инженерчлэл": [
            {"question": "Үйлдвэрлэлийн чанарын хяналтын систем нэвтрүүлсэн туршлагаа ярина уу.", "tip": "ISO стандарт, чанарын хяналтын аргуудыг дурдаарай.", "sample_answer": "ISO 9001 чанарын удирдлагын системийг нэвтрүүлж, бүтээгдэхүүний гологдлын хувийг 15%-иар бууруулсан. Үйлдвэрлэлийн шугам бүрт шалгах цэг тогтоож, статистик чанарын хяналт (SPC) ашигладаг."},
            {"question": "Үйлдвэрлэлийн процессийг хэрхэн оновчтой болгодог вэ?", "tip": "Lean, Six Sigma зэрэг аргачлалын талаар ярьж болно.", "sample_answer": "Lean manufacturing зарчмуудыг ашиглан хаягдлыг бууруулж, үйлдвэрлэлийн урсгалыг оновчтой болгосон. Value stream mapping хийж, бүтээмжийг 20% нэмэгдүүлсэн туршлагатай."},
            {"question": "Тоног төхөөрөмжийн засвар үйлчилгээг хэрхэн зохион байгуулдаг вэ?", "tip": "Урьдчилан сэргийлэх засварын талаар дурдаарай.", "sample_answer": "Урьдчилан сэргийлэх засвар үйлчилгээний хуваарь гаргаж, тоног төхөөрөмжийн бүртгэл хөтөлдөг. Гэнэтийн эвдрэлийг багасгахын тулд тогтмол оношилгоо хийж, сэлбэг хэрэгслийн нөөцийг хангадаг."},
        ],
        "Боловсрол, шинжлэх ухаан": [
            {"question": "Заах арга зүйн туршлагаа ярина уу.", "tip": "Тодорхой арга, технологийг дурдаарай.", "sample_answer": "Оюутан төвтэй сургалтын аргыг ашигладаг. Бүлгийн ажил, кейс судалгаа, интерактив дасгал зэргийг хичээлд нэвтрүүлж, оюутнуудын идэвхийг нэмэгдүүлсэн. Мөн дижитал хэрэгслүүд (Google Classroom, Moodle) ашигладаг."},
            {"question": "Хичээлийн хөтөлбөр боловсруулах туршлагаа ярина уу.", "tip": "Суралцахуйн зорилго, үнэлгээний аргыг хэлээрэй.", "sample_answer": "Bloom-ын таксономид тулгуурлан суралцахуйн зорилго тодорхойлж, хичээлийн агуулга, үнэлгээний аргыг боловсруулдаг. Салбарын хэрэгцээнд нийцүүлэн хөтөлбөрийг тогтмол шинэчилдэг."},
            {"question": "Суралцагчдын сэдэл, идэвхийг хэрхэн нэмэгдүүлдэг вэ?", "tip": "Бодит жишээгээр дэмжээрэй.", "sample_answer": "Хичээлийг бодит амьдралын жишээтэй холбож заадаг. Гадаад мэргэжилтнүүдийг урьж лекц уншуулах, бие даалт, төслийн ажлаар суралцагчдын бүтээлч сэтгэлгээг хөгжүүлдэг."},
        ],
        "Мэдээллийн технологи, программ хангамж": [
            {"question": "Хамгийн их ашигладаг програмчлалын хэл болон framework юу вэ?", "tip": "Практик туршлагаа хэлээрэй.", "sample_answer": "Python болон JavaScript хэлүүд дээр голчлон ажилладаг. Backend хөгжүүлэлтэд FastAPI, Django, frontend-д React ашигладаг. Мөн PostgreSQL, Docker зэрэг технологиудтай ажиллах туршлагатай."},
            {"question": "Багийн хөгжүүлэлтийн процессийг тайлбарлана уу.", "tip": "Agile/Scrum-ын талаар ярьж болно.", "sample_answer": "Agile аргачлалаар 2 долоо хоногийн спринтээр ажилладаг. Daily standup уулзалт, sprint planning, retrospective зэрэг Scrum event-үүдийг тогтмол зохион байгуулдаг. Git branching strategy ашиглаж, code review заавал хийдэг."},
            {"question": "Системийн аюулгүй байдлыг хэрхэн хангадаг вэ?", "tip": "Тодорхой арга хэмжээнүүдийг дурдаарай.", "sample_answer": "Authentication-д JWT/OAuth2, мэдээллийн шифрлэлтэд TLS/SSL ашигладаг. Input validation хийж, SQL injection, XSS зэрэг халдлагаас хамгаалдаг. Тогтмол security audit хийж, vulnerability scan явуулдаг."},
        ],
        "Эрүүл мэнд": [
            {"question": "Өвчтөнтэй харилцах арга барилаа ярина уу.", "tip": "Эмпати, мэргэжлийн хандлагыг онцлоорой.", "sample_answer": "Өвчтөн бүрийг анхааралтай сонсож, ойлгомжтой тайлбарлахыг эрхэмлэдэг. Оношилгоо, эмчилгээний явцыг ойлгомжтой хэлж, асуулт тавих боломж олгодог. Энэ нь өвчтөний итгэлийг олоход чухал гэж үздэг."},
            {"question": "Яаралтай тусламжийн нөхцөлд хэрхэн ажилладаг вэ?", "tip": "Тодорхой алхмуудыг дурдаарай.", "sample_answer": "Яаралтай нөхцөлд тайван байж, протоколын дагуу ажилладаг. Эхлээд амин чухал үзүүлэлтүүдийг шалгаж, нэн даруй шаардлагатай арга хэмжээг авдаг. Багийн гишүүдтэй тодорхой мэдээлэл солилцож, хамтран ажилладаг."},
            {"question": "Эмнэлгийн багтай хэрхэн хамтран ажилладаг вэ?", "tip": "Харилцаа, үүрэг хуваарилалтыг онцлоорой.", "sample_answer": "Эмч, сувилагч, лаборант нартай тогтмол мэдээлэл солилцож, өвчтөний тусламж үйлчилгээг уялдуулдаг. Визит бүрд өвчтөний байдлыг бүрэн мэдээлж, эмчилгээний төлөвлөгөөг хамтран шинэчилдэг."},
        ],
        "Маркетинг PR, менежмент": [
            {"question": "Маркетингийн кампанит ажлыг хэрхэн төлөвлөж хэрэгжүүлдэг вэ?", "tip": "Алхам алхмаар тайлбарлаарай.", "sample_answer": "Эхлээд зорилтот бүлгийг тодорхойлж, судалгаа хийдэг. Дараа нь зорилго тавьж, суваг сонгож, контент бэлтгэдэг. Кампанит ажлын явцад KPI хянаж, шаардлагатай бол стратегиа засварладаг."},
            {"question": "Брэнд менежментийн туршлагаа ярина уу.", "tip": "Тодорхой брэнд, үр дүнг дурдаарай.", "sample_answer": "Компанийн брэндийн стратеги боловсруулж, нийгмийн сүлжээ, вэбсайт, оффлайн сувгуудаар нэгдмэл мессеж дамжуулдаг байсан. Брэндийн танигдах байдлыг 30%-иар нэмэгдүүлсэн."},
            {"question": "Хямралын үед PR стратегиа хэрхэн боловсруулдаг вэ?", "tip": "Тодорхой нөхцөл байдлын жишээ хэлээрэй.", "sample_answer": "Хямралын үед шуурхай хариу үйлдлийн баг бүрдүүлж, нэгдсэн мессеж бэлтгэдэг. Олон нийтэд ил тод мэдээлэл хүргэж, асуудлыг шийдвэрлэх арга хэмжээний талаар тогтмол мэдэгдэл гаргадаг."},
        ],
        "Захиргаа, хүний нөөц": [
            {"question": "Ажилтан сонгон шалгаруулах үйл явцыг тайлбарлана уу.", "tip": "Алхам алхмаар тайлбарлаарай.", "sample_answer": "Эхлээд албан тушаалын тодорхойлолт гаргаж, зарыг нийтэлнэ. Дараа нь CV шүүж, утсаар болон биечлэн ярилцлага хийж, мэргэжлийн тест өгүүлнэ. Эцсийн шатанд лавлагаа шалгаж, санал болгоно."},
            {"question": "Ажлын байрны таатай орчин бүрдүүлэхэд юу хамгийн чухал гэж үздэг вэ?", "tip": "Бодит жишээгээр дэмжээрэй.", "sample_answer": "Нээлттэй харилцаа, шударга үнэлгээ, хөгжлийн боломж гэсэн 3 зүйл хамгийн чухал. Өмнөх ажил дээрээ ажилтнуудын санал хүсэлтийн систем нэвтрүүлж, сэтгэл ханамжийг 25% нэмэгдүүлсэн."},
            {"question": "Ажилтнуудын гүйцэтгэлийн үнэлгээг хэрхэн зохион байгуулдаг вэ?", "tip": "Үнэлгээний арга, давтамжийг дурдаарай.", "sample_answer": "Улирал бүр KPI-д суурилсан гүйцэтгэлийн үнэлгээ хийдэг. 360 градусын үнэлгээ, нэг-нэгтэй ярилцлага зохион байгуулж, ажилтан бүрт хувийн хөгжлийн төлөвлөгөө боловсруулдаг."},
        ],
    }

    # Collect relevant templates
    templates = []
    if category and category in CATEGORY_TEMPLATES:
        templates.extend(CATEGORY_TEMPLATES[category])

    # Generic templates for any category
    GENERIC_TEMPLATES = [
        {"question": "Энэ салбарт ажиллах сонирхол тань хэзээ үүссэн бэ?", "tip": "Хувийн түүхээ товч ярьж болно.", "sample_answer": "Их сургуульд сурч байхдаа энэ салбарын мэргэжилтнүүдтэй уулзаж, тэдний ажлын нөлөөлөл нийгэмд ямар их байдгийг мэдэрсэн. Тэр цагаас хойш энэ чиглэлээр мэргэшихийг зорьж ирсэн."},
        {"question": "Шинэ ур чадвар суралцах хэрэгтэй болвол яадаг вэ?", "tip": "Суралцах арга барилаа тайлбарлаарай.", "sample_answer": "Эхлээд онлайн курс, номноос суурь мэдлэгээ олж авдаг. Дараа нь практик дээр хэрэглэж, туршлагатай хүмүүсээс зөвлөгөө авдаг. Жишээ нь сүүлд Python суралцахдаа Coursera-ийн курс дуусгаж, өөрийн төсөл хийсэн."},
        {"question": "Хамгийн их бахархдаг мэргэжлийн амжилтаа ярина уу.", "tip": "Тодорхой үр дүнг дурдаарай.", "sample_answer": "Хамгийн их бахархдаг амжилт бол өмнөх компанидаа шинэ систем нэвтрүүлсэн нь. 3 сарын турш багаа удирдаж, төслийг хугацаандаа дуусгаснаар компанийн үр ашгийг 30% нэмэгдүүлсэн."},
        {"question": "Ажлын ачааллаа хэрхэн зохицуулдаг вэ?", "tip": "Цагийн менежментийн арга хэлээрэй.", "sample_answer": "Долоо хоног бүр ажлаа эрэмбэлж, чухал болон яаралтай ажлуудыг ялгаж төлөвлөдөг. Trello/Notion зэрэг хэрэгсэл ашиглаж, багийн гишүүдтэй тогтмол мэдээлэл солилцдог."},
        {"question": "Удирдлагаас санал нийлэхгүй зүйлтэй тулгарвал яадаг вэ?", "tip": "Мэргэжлийн харилцааг онцлоорой.", "sample_answer": "Эхлээд удирдлагын байр суурийг сайн ойлгохыг хичээдэг. Дараа нь өөрийн санал бодлоо баримт, тоон мэдээлэлд тулгуурлан тайван хүргэдэг. Эцсийн шийдвэр удирдлагынх гэдгийг хүндэтгэдэг."},
    ]
    random.shuffle(GENERIC_TEMPLATES)
    templates.extend(GENERIC_TEMPLATES)

    # If JD or skills provided, score templates by keyword match
    if jd or skills:
        search_text = f"{jd} {skills}".lower()
        for t in templates:
            t_text = f"{t['question']} {t.get('sample_answer', '')}".lower()
            t["_score"] = sum(1 for word in search_text.split() if len(word) > 3 and word in t_text)
        templates.sort(key=lambda x: x.get("_score", 0), reverse=True)

    # Select and format
    selected = templates[:count]
    random.shuffle(selected)

    result = []
    for t in selected:
        item = {
            "question": t["question"],
            "category": category or "Ерөнхий",
            "tip": t.get("tip", ""),
            "sample_answer": t.get("sample_answer", ""),
            "source": "template",
        }
        # Clean up internal scoring field
        item.pop("_score", None)
        result.append(item)

    return result


# ───────────────────────────────────────────
# ENDPOINTS
# ───────────────────────────────────────────

@router.get("")
async def list_questions(
    company: str = Query("", description="Filter by company"),
    limit: int = Query(20, ge=1, le=100),
):
    """Get interview questions from the Q&A dataset."""
    df = _get_qa_df()

    if company:
        df = df[df["company"].str.contains(company, case=False, na=False)]

    questions = df[["company", "асуулт", "хариулт"]].copy()
    questions.columns = ["company", "question", "sample_answer"]
    unique_q = questions.drop_duplicates(subset=["question"]).head(limit)

    return {
        "total": len(unique_q),
        "questions": unique_q.to_dict(orient="records"),
    }


@router.get("/companies")
async def list_companies():
    """List all companies in the Q&A dataset."""
    df = _get_qa_df()
    companies = df["company"].unique().tolist()
    return {"companies": companies}


class HybridQuestionRequest(BaseModel):
    category: str = ""
    job_description: str = ""
    skills: str = ""
    num_questions: int = 5


@router.post("/generate")
async def generate_hybrid_questions(req: HybridQuestionRequest):
    """Generate a mixed set of questions from AI + CSV + curated sources.

    Returns a balanced mix:
    - 2 curated common questions (opening + closing)
    - Up to 3 from CSV dataset (matched to category/JD/skills)
    - AI-generated questions to fill remaining slots
    """
    total = req.num_questions

    # 1. Always include opening and closing questions
    opening = {
        "question": "Та өөрийгөө танилцуулна уу.",
        "category": "Ерөнхий",
        "tip": "Мэргэжил, туршлага, зорилгоо товч танилцуулна уу.",
        "audio": "/audio/q1.mp3",
        "sample_answer": "Намайг [Нэр] гэдэг. Би [Их сургууль]-ийг [Мэргэжил]-ээр төгссөн. Сүүлийн 2 жил [Компани]-д [Албан тушаал]-аар ажиллаж, [гол ур чадвар]-аа хөгжүүлсэн. Одоо мэргэжлийн өсөлтөө үргэлжлүүлж, танай байгууллагад хувь нэмрээ оруулахыг хүсэж байна.",
        "source": "curated",
    }
    closing = {
        "question": "Танд бидэнд асуух зүйл байна уу?",
        "category": "Ерөнхий",
        "tip": "Компанийн соёл, хөгжлийн боломжийн талаар асуугаарай.",
        "audio": "/audio/q11.mp3",
        "sample_answer": "Тийм ээ. Танай компанид ажилтнуудын мэргэжлийн хөгжлийг дэмжих ямар хөтөлбөр байдаг вэ? Мөн энэ албан тушаалд ажиллах хүний эхний 3 сарын гол зорилтууд юу байх вэ?",
        "source": "curated",
    }

    # 2. Middle questions budget
    middle_budget = max(0, total - 2)

    # Split budget between CSV and AI/template
    csv_budget = min(middle_budget, 3)  # Up to 3 from CSV
    ai_budget = middle_budget - csv_budget

    # 3. Get CSV-matched questions
    csv_questions = _match_csv_questions(
        category=req.category,
        job_description=req.job_description,
        skills=req.skills,
        limit=csv_budget,
    )

    # If CSV returned fewer, give remainder to AI
    actual_csv = len(csv_questions)
    ai_budget += (csv_budget - actual_csv)

    # 4. Get AI/template-generated questions
    ai_questions = []
    if ai_budget > 0:
        ai_questions = _generate_ai_questions(
            category=req.category,
            job_description=req.job_description,
            skills=req.skills,
            count=ai_budget,
        )

    # 5. Assemble: opening + shuffled middle + closing
    middle = csv_questions + ai_questions
    random.shuffle(middle)

    # Deduplicate against opening/closing
    seen = {opening["question"], closing["question"]}
    deduped_middle = []
    for q in middle:
        if q["question"] not in seen:
            seen.add(q["question"])
            deduped_middle.append(q)

    final = [opening] + deduped_middle[:middle_budget] + [closing]

    return {
        "questions": final,
        "sources": {
            "curated": 2,
            "csv": actual_csv,
            "ai_or_template": len(ai_questions),
        },
    }


@router.get("/sample")
async def get_sample_questions():
    """Get a curated set of common interview questions (legacy endpoint)."""
    common_questions = [
        {"question": "Та өөрийгөө танилцуулна уу.", "category": "Ерөнхий", "tip": "Мэргэжил, туршлага, зорилгоо товч танилцуулна уу.", "audio": "/audio/q1.mp3",
         "sample_answer": "Намайг [Нэр] гэдэг. Би [Их сургууль]-ийг [Мэргэжил]-ээр төгссөн. Сүүлийн 2 жил [Компани]-д [Албан тушаал]-аар ажиллаж, [гол ур чадвар]-аа хөгжүүлсэн. Одоо мэргэжлийн өсөлтөө үргэлжлүүлж, танай байгууллагад хувь нэмрээ оруулахыг хүсэж байна."},
        {"question": "Яагаад энэ ажлын байранд сонирхолтой байна вэ?", "category": "Сэдэл", "tip": "Компанийн талаар судалгаа хийснээ харуулаарай.", "audio": "/audio/q2.mp3",
         "sample_answer": "Танай компани салбартаа тэргүүлэгч бөгөөд инновацид анхаарал хандуулдаг нь надад маш сонирхолтой. Миний [ур чадвар] болон [туршлага] нь энэ албан тушаалын шаардлагатай нийцэж байгаа тул би энд ажиллаж, мэргэжлээ хөгжүүлэхийг хүсэж байна."},
        {"question": "Таны давуу тал юу вэ?", "category": "Ур чадвар", "tip": "Жишээгээр нотлоорой.", "audio": "/audio/q3.mp3",
         "sample_answer": "Миний хамгийн том давуу тал бол асуудлыг шийдвэрлэх чадвар юм. Өмнөх ажил дээрээ [тодорхой жишээ] асуудал гарсан үед би [хийсэн арга хэмжээ]-г авснаар [үр дүн]-д хүрсэн. Мөн багаар ажиллах чадвар, цаг баримтлах зэрэг давуу талтай."},
        {"question": "Таны сул тал юу вэ?", "category": "Ур чадвар", "tip": "Сайжруулж буй талаа хэлээрэй.", "audio": "/audio/q4.mp3",
         "sample_answer": "Заримдаа нарийн ширийн зүйлд хэт их анхаарал хандуулж, цаг их зарцуулдаг. Гэхдээ сүүлийн үед ажлаа эрэмбэлж сурч, цагийн менежментээ сайжруулж байна. Жишээ нь одоо долоо хоног бүр ажлын төлөвлөгөө гаргаж, хугацаандаа амжуулдаг болсон."},
        {"question": "Багаар хэрхэн ажилладаг вэ?", "category": "Багийн ажил", "tip": "Туршлагаасаа жишээ хэлээрэй.", "audio": "/audio/q5.mp3",
         "sample_answer": "Би багийн гишүүдтэй нээлттэй харилцаж, санаагаа чөлөөтэй хуваалцдаг. Өмнөх төсөл дээр 5 хүний багт ажиллахдаа үүрэг хуваарилалт хийж, тогтмол уулзалт зохион байгуулснаар төслөө хугацаандаа амжуулсан. Бусдын саналыг сонсож, зөвшилцөлд хүрэх нь чухал гэж үздэг."},
        {"question": "Хүнд нөхцөл байдлыг хэрхэн шийдвэрлэсэн тухайгаа ярина уу.", "category": "Туршлага", "tip": "STAR аргачлалаар хариулаарай.", "audio": "/audio/q6.mp3",
         "sample_answer": "Өмнөх ажил дээрээ [нөхцөл байдал] тохиолдсон. Миний үүрэг бол [даалгавар] байсан. Би [авсан арга хэмжээ]-г хийж, эцэст нь [үр дүн]-д хүрсэн. Энэ туршлагаас дарамттай нөхцөлд тайван байж, шийдвэр гаргах чадвараа сайжруулсан."},
        {"question": "5 жилийн дараа өөрийгөө хаана харж байна вэ?", "category": "Зорилго", "tip": "Энэ ажилтай уялдуулж хариулаарай.", "audio": "/audio/q7.mp3",
         "sample_answer": "5 жилийн дараа би энэ салбарт мэргэжлийн түвшингээ дээшлүүлж, ахлах мэргэжилтний албан тушаалд хүрэхийг зорьж байна. Танай компанид ажиллаж, туршлага хуримтлуулан, багийг удирдах чадвараа хөгжүүлэхийг хүсэж байна."},
        {"question": "Яагаад өмнөх ажлаасаа гарсан бэ?", "category": "Туршлага", "tip": "Эерэг шалтгаанаар тайлбарлаарай.", "audio": "/audio/q8.mp3",
         "sample_answer": "Өмнөх ажил дээрээ олон зүйл сурч, туршлага хуримтлуулсан. Гэхдээ мэргэжлийн хувьд өсөх шинэ боломж хайж байсан тул шилжихээр шийдсэн. Танай компанийн [тодорхой шалтгаан] нь надад маш сонирхолтой санагдсан."},
        {"question": "Цалингийн хүлээлт хэд вэ?", "category": "Нөхцөл", "tip": "Зах зээлийн судалгаанд тулгуурлаарай.", "audio": "/audio/q9.mp3",
         "sample_answer": "Зах зээлийн судалгаанаас харахад энэ албан тушаалын дундаж цалин [дүн] орчим байна. Миний туршлага, ур чадварт нийцсэн цалин хүсэж байгаа бөгөөд танай компанийн бодлогод нийцүүлэн хэлэлцэхэд бэлэн байна."},
        {"question": "Та стресстэй нөхцөлд хэрхэн ажилладаг вэ?", "category": "Ур чадвар", "tip": "Тодорхой жишээ хэлээрэй.", "audio": "/audio/q10.mp3",
         "sample_answer": "Стресстэй нөхцөлд би ажлаа эрэмбэлж, хамгийн чухал зүйлээс эхэлдэг. Жишээ нь [тодорхой нөхцөл байдал]-д тулгарахад би тайван байж, алхам алхмаар шийдвэрлэсэн. Мөн биеийн тамираар хичээллэж, стрессээ зохицуулдаг."},
        {"question": "Танд бидэнд асуух зүйл байна уу?", "category": "Ерөнхий", "tip": "Компанийн соёл, хөгжлийн боломжийн талаар асуугаарай.", "audio": "/audio/q11.mp3",
         "sample_answer": "Тийм ээ. Танай компанид ажилтнуудын мэргэжлийн хөгжлийг дэмжих ямар хөтөлбөр байдаг вэ? Мөн энэ албан тушаалд ажиллах хүний эхний 3 сарын гол зорилтууд юу байх вэ?"},
        {"question": "Өмнөх туршлагаасаа ярина уу.", "category": "Туршлага", "tip": "Хамгийн чухал амжилтаа онцлоорой.", "audio": "/audio/q12.mp3",
         "sample_answer": "Би [Компани]-д [хугацаа] ажилласан. Тэнд [гол үүрэг]-ийг хариуцаж байсан. Хамгийн том амжилт нь [тодорхой амжилт] бөгөөд энэ нь [үр дүн]-д хүрэхэд тусалсан. Энэ туршлагаас [сурсан зүйл]-ийг одоо ч хэрэглэж байна."},
    ]
    return {"questions": common_questions}
