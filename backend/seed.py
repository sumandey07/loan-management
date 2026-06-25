# seed.py
from models import init_db, get_session, CollateralValuation

init_db()
session = get_session()

regions = [
    {
        "region": "Gurgaon",
        "property_type": "residential_flat",
        "avg_price_per_sqft": 5200,
    },
    {
        "region": "Delhi",
        "property_type": "residential_flat",
        "avg_price_per_sqft": 7500,
    },
    {
        "region": "Mumbai",
        "property_type": "residential_flat",
        "avg_price_per_sqft": 15000,
    },
    {
        "region": "Bengaluru",
        "property_type": "residential_flat",
        "avg_price_per_sqft": 8200,
    },
]

gold_prices = [
    {"region": "Gurgaon", "purity": "22k", "avg_price": 4700},
    {"region": "Delhi", "purity": "22k", "avg_price": 4800},
    {"region": "Mumbai", "purity": "22k", "avg_price": 4900},
    {"region": "Bengaluru", "purity": "22k", "avg_price": 4750},
    {"region": "Kolkata", "purity": "22k", "avg_price": 4650},
    {"region": "Mumbai", "purity": "24k", "avg_price": 5350},
    {"region": "Kolkata", "purity": "24k", "avg_price": 5100},
    {"region": "Delhi", "purity": "24k", "avg_price": 5250},
    {"region": "Gurgaon", "purity": "24k", "avg_price": 5200},
    {"region": "Bengaluru", "purity": "24k", "avg_price": 5150},
]

for r in regions:
    cv = CollateralValuation(
        region=r["region"],
        asset_type=r["property_type"],
        avg_price=r["avg_price_per_sqft"],
    )
    session.add(cv)

for g in gold_prices:
    cv = CollateralValuation(
        region=g["region"],
        asset_type=f"gold_{g['purity']}",
        avg_price=g["avg_price"],
    )
    session.add(cv)
session.commit()
session.close()
print("Seeded collateral valuations.")
