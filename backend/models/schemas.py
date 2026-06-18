from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class ScoreBreakdownItem(BaseModel):
    signal: str
    points: int


class IntentScoreResult(BaseModel):
    score: int
    level: str
    breakdown: list[ScoreBreakdownItem]


class FontRecommendation(BaseModel):
    font_name: str
    reason: str
    score: Optional[int] = None


class AIAnalysisResult(BaseModel):
    intent_summary: str
    likely_use_case: str = ""
    buying_stage: str = ""
    possible_blockers: list[str] = Field(default_factory=list)


class CustomerAnalysisResponse(BaseModel):
    user_id: str
    intent_summary: str
    buying_intent_score: int
    intent_level: str
    score_breakdown: list[ScoreBreakdownItem]
    possible_blockers: list[str]
    recommended_fonts: list[FontRecommendation]
    recommended_action: str
    likely_use_case: Optional[str] = None
    buying_stage: Optional[str] = None
    ai_enriched: bool = False


class EmailDraftRequest(BaseModel):
    sales_rep_name: str = "Sales Team"
    first_name: Optional[str] = None


class EmailDraftResponse(BaseModel):
    subject: str
    body: str
    disclaimer: str = "Draft for human review only. Do not send automatically."


class FontCatalogItem(BaseModel):
    name: str
    slug: str
    foundry: str
    price: float
    category: str
    featured: bool = False
    description: Optional[str] = None


class CustomerSummary(BaseModel):
    user_id: str
    name: Optional[str] = None
    email: str
    organization_name: Optional[str] = None
    platform: Optional[str] = None
    country_code: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    service: str = "fonts-followup-agent"


class ActivityRecord(BaseModel):
    user_id: str
    email: Optional[str] = None
    company_domain: Optional[str] = None
    platform: Optional[str] = None
    country_code: Optional[str] = None
    organization_name: Optional[str] = None
    search_queries: list[str] = Field(default_factory=list)
    filters_used: list[str] = Field(default_factory=list)
    font_pages_viewed: list[str] = Field(default_factory=list)
    fonts_compared: list[str] = Field(default_factory=list)
    time_spent_minutes: int = 0
    visit_count: int = 0
    repeated_visit_days: int = 0
    cart_additions: list[str] = Field(default_factory=list)
    cart_removals: list[str] = Field(default_factory=list)
    trial_downloads: list[str] = Field(default_factory=list)
    license_page_visits: int = 0
    past_purchases: list[str] = Field(default_factory=list)
    purchased: bool = False
    extra: dict[str, Any] = Field(default_factory=dict)


class QueueEmailDraft(BaseModel):
    subject: str
    body: str
    generated_at: Optional[str] = None
    last_edited: Optional[str] = None


class QueueItem(BaseModel):
    user_id: str
    email: str
    company: Optional[str] = None
    processed_at: str
    intent_score: int
    intent_level: str
    analysis: dict[str, Any]
    activity: dict[str, Any]
    email_draft: QueueEmailDraft
    status: str = "pending"
    sent_at: Optional[str] = None


class BatchProcessResponse(BaseModel):
    processed: int
    high_intent: int
    queue_size: int


class UpdateDraftRequest(BaseModel):
    subject: str
    body: str


class FontOffer(BaseModel):
    font_name: str
    discount_percent: int
    original_price: float
    offer_price: float
    offer_ends: str
    offer_label: str = "Special Offer"


class OfferWithCustomers(BaseModel):
    offer: FontOffer
    matched_customers: list[dict[str, Any]]
