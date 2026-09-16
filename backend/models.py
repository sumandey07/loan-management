from typing import Optional
from datetime import datetime
from typing import Optional, List
from sqlalchemy import inspect, text
from sqlmodel import SQLModel, Field, create_engine, Session, select
from datetime import datetime
from pydantic import BaseModel
import os
from zoneinfo import ZoneInfo
from dotenv import load_dotenv

load_dotenv()

DB_FILE = "mortgage.db"
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_FILE}")

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

ist = ZoneInfo("Asia/Kolkata")


def now_ist():
    return datetime.now(ist).strftime("%d-%m-%Y, %H:%M")


connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    full_name: Optional[str] = None
    phone: Optional[str] = None
    password_hash: str
    created_at: str = Field(default_factory=now_ist)
    consent_accepted: bool = Field(default=False)
    consent_ts: Optional[datetime] = None


class CollateralValuation(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    region: str
    asset_type: str
    avg_price: float


class LoanApplication(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True)
    collateral_type: str  # property|gold|assets
    requested_amount: float
    tenure_years: int
    credit_score: Optional[int] = None
    existing_emi: Optional[float] = 0.0
    status: str = Field(
        default="draft"
    )  # draft|submitted|verification_pending|approved|rejected
    created_at: str = Field(default_factory=now_ist)
    # property-specific
    region: Optional[str] = None
    size_sqft: Optional[float] = None
    valuation_estimate: Optional[float] = None
    # gold-specific
    purity: Optional[str] = None  # e.g., 22k,
    gold_weight_grams: Optional[float] = None
    # store ITR info simply as total_annual_income (extracted from ITRs)
    annual_income: Optional[float] = None
    selected_offer_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    llm_risk_level: Optional[str] = None
    llm_max_loan: Optional[float] = None
    llm_recommended_roi: Optional[float] = None
    llm_explanation: Optional[str] = None
    llm_reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    rejection_reason: Optional[str] = None


class DocumentMeta(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    application_id: int = Field(index=True)
    user_id: int
    doc_type: str  # aadhaar|pan|salary_slip|bank_statement|property_doc
    filename: str
    mime_type: str
    size_bytes: int
    upload_ts: str = Field(default_factory=now_ist)
    sha256: Optional[str] = None
    extracted_name: Optional[str] = None
    extracted_fields_json: Optional[str] = None


class Admin(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    password_hash: str
    created_at: str = Field(default_factory=now_ist)


class RiskRequest(BaseModel):
    income: float
    loan_amount: float
    credit_score: int
    collateral_value: float
    age: Optional[int] = None
    itr_income: Optional[float] = None
    employment_type: Optional[str] = None


class RegisterIn(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None


class EligibilityForm(BaseModel):
    age: int
    annual_income: float
    credit_score: int


class EligibilityResp(BaseModel):
    eligible: bool
    amount_eligible: Optional[float] = None


class LoginIn(BaseModel):
    username: str
    password: str


class EligibilityForm(BaseModel):
    age: int
    annual_income: float
    credit_score: int


class EligibilityResp(BaseModel):
    eligible: bool
    amount_eligible: Optional[float] = None


class TokenResp(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ApplicationIn(BaseModel):
    collateral_type: str
    requested_amount: float
    tenure_years: int
    credit_score: Optional[int] = None
    existing_emi: Optional[float] = 0.0
    region: Optional[str] = None
    size_sqft: Optional[float] = None
    gold_weight_grams: Optional[float] = None
    purity: Optional[str] = None
    annual_income: Optional[float] = None


class ApplicationUpdate(BaseModel):
    collateral_type: Optional[str] = None
    requested_amount: Optional[float] = None
    tenure_years: Optional[int] = None
    credit_score: Optional[int] = None
    existing_emi: Optional[float] = None
    region: Optional[str] = None
    size_sqft: Optional[float] = None
    gold_weight_grams: Optional[float] = None
    purity: Optional[str] = None
    annual_income: Optional[float] = None


class ApplicationOut(BaseModel):
    id: int
    user_id: int
    collateral_type: str
    requested_amount: float
    tenure_years: int
    credit_score: Optional[int] = None
    existing_emi: Optional[float] = 0.0
    status: str
    created_at: str
    region: Optional[str] = None
    size_sqft: Optional[float] = None
    valuation_estimate: Optional[float] = None
    purity: Optional[str] = None
    gold_weight_grams: Optional[float] = None
    annual_income: Optional[float] = None
    selected_offer_id: Optional[str] = None
    aadhaar_number: Optional[str] = None
    pan_number: Optional[str] = None
    llm_risk_level: Optional[str] = None
    llm_max_loan: Optional[float] = None
    llm_recommended_roi: Optional[float] = None
    llm_explanation: Optional[str] = None
    llm_reviewed_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    rejection_reason: Optional[str] = None


class ChatMessage(BaseModel):
    message: str


class AdminLoginIn(BaseModel):
    username: str
    password: str


class AdminTokenResp(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


def init_db():
    inspector = inspect(engine)
    table_name = LoanApplication.__tablename__
    if inspector.has_table(table_name):
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "llm_reviewed_by" in columns and "reviewed_by" not in columns:
            with engine.begin() as connection:
                connection.execute(
                    text(
                        f'ALTER TABLE "{table_name}" '
                        'RENAME COLUMN "llm_reviewed_by" TO "reviewed_by"'
                    )
                )
    SQLModel.metadata.create_all(engine)
    # if not os.path.exists(DB_FILE):
    #     SQLModel.metadata.create_all(engine)


def get_session():
    return Session(engine)
