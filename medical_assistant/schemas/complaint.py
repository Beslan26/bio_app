from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class ComplaintCreateText(BaseModel):
    text: str


class ComplaintResponse(BaseModel):
    id: int
    source: str  # text | voice
    raw_text: str
    extracted_facts: Optional[List[str]] = None
    created_at: datetime