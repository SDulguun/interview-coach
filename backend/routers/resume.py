"""Resume parsing endpoint — extracts text and skills from PDF/DOCX."""
import os
import re
import tempfile
import logging

from fastapi import APIRouter, UploadFile, File, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/resume", tags=["resume"])

# Common skills to match against (bilingual)
KNOWN_SKILLS = [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "Go", "Rust", "SQL",
    "React", "Angular", "Vue", "Node.js", "Django", "Flask", "FastAPI", "Spring",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "CI/CD",
    "Machine Learning", "Deep Learning", "NLP", "Data Analysis", "Data Science",
    "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-learn",
    "Excel", "Power BI", "Tableau", "SAP", "1C", "QuickBooks",
    "Photoshop", "Figma", "Adobe", "AutoCAD", "SolidWorks",
    "Marketing", "SEO", "Social Media", "Google Ads", "Facebook Ads",
    "Project Management", "Agile", "Scrum", "Jira", "Confluence",
    "Communication", "Leadership", "Teamwork", "Problem Solving",
    "English", "Japanese", "Korean", "Chinese", "Russian", "German",
    "Англи хэл", "Япон хэл", "Солонгос хэл", "Орос хэл", "Хятад хэл",
    "Нягтлан бодох бүртгэл", "Санхүү", "Маркетинг", "Борлуулалт",
    "Менежмент", "Хүний нөөц", "Програмчлал", "Дата шинжилгээ",
]


def _extract_skills(text: str) -> list[str]:
    """Match known skills in resume text (case-insensitive)."""
    found = []
    text_lower = text.lower()
    for skill in KNOWN_SKILLS:
        if skill.lower() in text_lower:
            found.append(skill)
    return found


def _extract_text_pdf(path: str) -> str:
    """Extract text from PDF using pdfplumber."""
    import pdfplumber
    pages = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            t = page.extract_text()
            if t:
                pages.append(t)
    return "\n".join(pages)


def _extract_text_docx(path: str) -> str:
    """Extract text from DOCX using python-docx."""
    from docx import Document
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)):
    """Parse an uploaded resume (PDF or DOCX) and extract text + skills."""
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()

    if ext not in (".pdf", ".docx"):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        if ext == ".pdf":
            text = _extract_text_pdf(tmp_path)
        else:
            text = _extract_text_docx(tmp_path)

        skills = _extract_skills(text)

        return {
            "text": text[:5000],  # Limit text length
            "skills": skills,
        }
    except Exception as e:
        logger.error(f"Resume parse error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {str(e)}")
    finally:
        os.unlink(tmp_path)
