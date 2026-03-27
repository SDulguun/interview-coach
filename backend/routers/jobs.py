"""Job listing endpoints."""
import pandas as pd
from fastapi import APIRouter, Query

from ..config import JOB_LISTINGS_CSV

router = APIRouter(prefix="/api/jobs", tags=["jobs"])

# Load job listings at module level
_df_jobs = None


def _get_jobs_df() -> pd.DataFrame:
    global _df_jobs
    if _df_jobs is None:
        _df_jobs = pd.read_csv(JOB_LISTINGS_CSV, encoding="utf-8-sig")
        _df_jobs["salary_min"] = _df_jobs["salary_min"].fillna(_df_jobs["salary_min"].median())
        _df_jobs["salary_max"] = _df_jobs["salary_max"].fillna(_df_jobs["salary_max"].median())
        _df_jobs["required_skills"] = _df_jobs["required_skills"].fillna("Тодорхойгүй")
    return _df_jobs


@router.get("")
async def list_jobs(
    search: str = Query("", description="Search in title, company, or category"),
    category: str = Query("", description="Filter by category"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List job listings with search and pagination."""
    df = _get_jobs_df()

    if search:
        mask = (
            df["title"].str.contains(search, case=False, na=False)
            | df["company"].str.contains(search, case=False, na=False)
            | df["category"].str.contains(search, case=False, na=False)
        )
        df = df[mask]

    if category:
        df = df[df["category"].str.contains(category, case=False, na=False)]

    total = len(df)
    start = (page - 1) * limit
    end = start + limit
    page_df = df.iloc[start:end]

    jobs = page_df.to_dict(orient="records")

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "jobs": jobs,
    }


@router.get("/categories")
async def list_categories():
    """List all job categories."""
    df = _get_jobs_df()
    cats = df["category"].value_counts().to_dict()
    return {"categories": cats}


@router.get("/{job_id}")
async def get_job_by_id(job_id: int):
    """Get a single job listing by ID."""
    df = _get_jobs_df()
    match = df[df["listing_id"] == job_id]
    if match.empty:
        return None
    return match.iloc[0].to_dict()
