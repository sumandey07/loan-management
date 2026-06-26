from models import Admin, get_session, init_db
from auth import hash_password

init_db()
session = get_session()

# Create default admin
admin1 = Admin(
    username="admin1",
    password_hash=hash_password("admin12"),
)

admin2 = Admin(
    username="admin2",
    password_hash=hash_password("admin13"),
)

session.add(admin1)
session.add(admin2)
session.commit()
session.close()

print(
    "Admin users created: username=admin1 password=admin12, username=admin2 password=admin13"
)
