from models import Admin, get_session, init_db
from auth import hash_password

init_db()
session = get_session()

# Create default admin
admin = Admin(
    username="admin",
    password_hash=hash_password("admin123"),
)

session.add(admin)
session.commit()
session.close()

print("Admin user created: username=admin password=admin123")
