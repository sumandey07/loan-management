import sqlite3
import random
import string
import datetime

DB_NAME = "mortgagehistorical.db"
NUM_LOANS = 500

random.seed(42)

# -----------------------------
# Utility functions
# -----------------------------
def rand_id(prefix, length=5):
    return prefix + "-" + "".join(random.choices(string.digits, k=length))

def rand_name():
    first = ["John", "Emily", "Aiden", "Sophia", "Lucas", "Mia", "Ethan", "Chloe", "Liam", "Ava"]
    last = ["West", "Johnson", "Anders", "Taylor", "Reed", "Hunt", "Gomez", "Parker", "Shaw", "Evans"]
    return random.choice(first) + " " + random.choice(last)

def rand_address():
    streets = ["Oak St", "Pine Ave", "Cedar Rd", "Maple Dr", "Birch Ln", "Lakeside Dr", "Hillview Ln"]
    return f"{random.randint(10,999)} {random.choice(streets)}, Cityville"

def rand_email(name):
    base = name.lower().replace(" ", ".")
    domains = ["example.com", "mail.com", "test.org"]
    return base + "@" + random.choice(domains)

def rand_phone():
    return "+1" + str(random.randint(2000000000, 9999999999))

def random_date(start_year=2015, end_year=2023):
    start = datetime.date(start_year,1,1).toordinal()
    end = datetime.date(end_year,12,31).toordinal()
    return datetime.date.fromordinal(random.randint(start, end)).isoformat()

def random_datetime():
    d = random_date()
    t = f"{random.randint(0,23):02}:{random.randint(0,59):02}:{random.randint(0,59):02}"
    return f"{d}T{t}"

# -----------------------------
# Database setup
# -----------------------------
conn = sqlite3.connect(DB_NAME)
cur = conn.cursor()

# Drop old tables if they exist
tables = [
    "loan_applications", "customer_kyc", "income_employment", "credit_history",
    "property_docs", "regulatory_compliance", "market_data", "communication_logs"
]

for t in tables:
    cur.execute(f"DROP TABLE IF EXISTS {t}")

# -----------------------------
# Create tables
# -----------------------------
cur.execute("""
CREATE TABLE hist_loan_applications (
    hist_loan_id TEXT PRIMARY KEY,
    hist_application_date TEXT,
    hist_loan_amount REAL,
    hist_loan_term_months INTEGER,
    hist_property_value REAL,
    hist_status TEXT,
    hist_approval_date TEXT,
    hist_rejection_reason TEXT,
    hist_default_date TEXT
)
""")

cur.execute("""
CREATE TABLE hist_customer_kyc (
    hist_customer_id TEXT,
    hist_loan_id TEXT,
    hist_name TEXT,
    hist_dob TEXT,
    hist_national_id TEXT,
    hist_address TEXT,
    hist_phone TEXT,
    hist_email TEXT,
    hist_identity_verification_status TEXT,
    PRIMARY KEY (hist_customer_id, hist_loan_id)
)
""")

cur.execute("""
CREATE TABLE hist_income_employment (
    hist_loan_id TEXT PRIMARY KEY,
    hist_employer TEXT,
    hist_employment_type TEXT,
    hist_annual_income REAL,
    hist_years_at_job REAL,
    hist_income_documents_submitted TEXT,
    hist_income_verification_status TEXT
)
""")

cur.execute("""
CREATE TABLE hist_credit_history (
    hist_loan_id TEXT PRIMARY KEY,
    hist_credit_score INTEGER,
    hist_past_defaults INTEGER,
    hist_active_loans INTEGER,
    hist_total_credit_limit REAL,
    hist_credit_report_verification TEXT
)
""")

cur.execute("""
CREATE TABLE hist_property_docs (
    hist_loan_id TEXT PRIMARY KEY,
    hist_property_address TEXT,
    hist_property_type TEXT,
    hist_appraisal_value REAL,
    hist_appraisal_report_status TEXT,
    hist_legal_document_status TEXT
)
""")

cur.execute("""
CREATE TABLE hist_regulatory_compliance (
    hist_loan_id TEXT PRIMARY KEY,
    hist_aml_check TEXT,
    hist_kyc_compliance TEXT,
    hist_credit_policy_compliance TEXT,
    hist_final_compliance_status TEXT
)
""")

cur.execute("""
CREATE TABLE hist_market_data (
    hist_date TEXT PRIMARY KEY,
    hist_base_interest_rate REAL,
    hist_average_property_price_index REAL,
    hist_mortgage_rate_trend TEXT
)
""")

cur.execute("""
CREATE TABLE hist_communication_logs (
    hist_communication_id TEXT PRIMARY KEY,
    hist_loan_id TEXT,
    hist_timestamp TEXT,
    hist_channel TEXT,
    hist_agent TEXT,
    hist_summary TEXT,
    hist_sentiment TEXT
)
""")

# -----------------------------
# Populate market data (365 days × ~2 years)
# -----------------------------
trend_list = ["up", "down", "flat"]
market_dates = set()

for _ in range(700):
    d = random_date(2018, 2023)
    if d in market_dates:
        continue
    market_dates.add(d)
    cur.execute("""
        INSERT INTO market_data VALUES (?, ?, ?, ?)
    """, (
        d,
        round(random.uniform(2.0, 7.0), 2),
        round(random.uniform(120.0, 180.0), 1),
        random.choice(trend_list)
    ))

# -----------------------------
# Populate loan data
# -----------------------------
statuses = ["approved", "rejected", "defaulted"]

for _ in range(NUM_LOANS):
    loan_id = rand_id("LN")
    status = random.choice(statuses)

    app_date = random_date()
    approval_date = random_date() if status == "approved" else None
    rejection = "Insufficient documentation" if status == "rejected" else None
    default_date = random_date() if status == "defaulted" else None

    loan_amount = random.randint(80000, 600000)
    prop_value = loan_amount + random.randint(20000, 200000)

    # Loan applications
    cur.execute("""
        INSERT INTO loan_applications VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        loan_id,
        app_date,
        loan_amount,
        random.choice([180, 240, 300, 360]),
        prop_value,
        status,
        approval_date,
        rejection,
        default_date
    ))

    # KYC
    name = rand_name()
    customer_id = rand_id("CUST")
    cur.execute("""
        INSERT INTO customer_kyc VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        customer_id,
        loan_id,
        name,
        random_date(1960, 2000),
        rand_id("ID", 8),
        rand_address(),
        rand_phone(),
        rand_email(name),
        random.choice(["verified", "pending", "failed"])
    ))

    # Income & Employment
    cur.execute("""
        INSERT INTO income_employment VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        loan_id,
        random.choice(["TechCorp", "RetailCo", "ManufacturePlus", "EduWorld", "ConsultX"]),
        random.choice(["full-time", "part-time", "self-employed", "contract"]),
        random.randint(30000, 150000),
        round(random.uniform(0.5, 25.0), 1),
        random.choice(["yes", "no"]),
        random.choice(["verified", "pending", "failed"])
    ))

    # Credit History
    cur.execute("""
        INSERT INTO credit_history VALUES (?, ?, ?, ?, ?, ?)
    """, (
        loan_id,
        random.randint(520, 820),
        random.randint(0, 2),
        random.randint(0, 6),
        random.randint(5000, 80000),
        random.choice(["verified", "pending"])
    ))

    # Property Docs
    cur.execute("""
        INSERT INTO property_docs VALUES (?, ?, ?, ?, ?, ?)
    """, (
        loan_id,
        rand_address(),
        random.choice(["house", "condo", "apartment", "land"]),
        prop_value,
        random.choice(["approved", "requires review", "rejected"]),
        random.choice(["verified", "pending"])
    ))

    # Regulatory
    aml = random.choice(["pass", "fail"])
    kyc_c = random.choice(["pass", "fail"])
    policy = random.choice(["pass", "fail"])
    final = "pass" if aml == "pass" and kyc_c == "pass" and policy == "pass" else "exception"

    cur.execute("""
        INSERT INTO regulatory_compliance VALUES (?, ?, ?, ?, ?)
    """, (
        loan_id,
        aml,
        kyc_c,
        policy,
        final
    ))

    # Communication Logs (0–3 per loan)
    for _ in range(random.randint(0, 3)):
        cur.execute("""
            INSERT INTO communication_logs VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            rand_id("COMM", 6),
            loan_id,
            random_datetime(),
            random.choice(["phone", "email", "chat", "in-person"]),
            random.choice(["Alice Morris", "David Chen", "Sarah Collins", "James Clark", "Maria Lopez"]),
            random.choice([
                "Customer asked for clarification.",
                "Discussed repayment terms.",
                "Requested documents.",
                "Explained appraisal process.",
                "Reviewed next steps."
            ]),
            random.choice(["positive", "neutral", "negative"])
        ))

# Save DB
conn.commit()
conn.close()

print("mortgage.db successfully created with 500 synthetic loans.")
