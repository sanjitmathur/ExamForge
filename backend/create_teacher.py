"""CLI script to create teacher accounts. Run from the backend/ directory.

Usage:
    python create_teacher.py --email teacher@school.com --password secret123 --name "Jane Doe" --school "Springfield High"
"""

import argparse
import sys
from pathlib import Path

# Ensure we can import the app package
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import sync_engine, SyncSessionLocal, Base
from app.models import User
from app.utils.auth import hash_password
from sqlalchemy import select


def main():
    parser = argparse.ArgumentParser(description="Create a teacher account for ExamForge")
    parser.add_argument("--email", required=True, help="Teacher email address")
    parser.add_argument("--password", required=True, help="Password")
    parser.add_argument("--name", required=True, help="Full name")
    parser.add_argument("--school", default=None, help="School name (optional)")
    args = parser.parse_args()

    # Create tables if they don't exist
    Base.metadata.create_all(bind=sync_engine)

    session = SyncSessionLocal()
    try:
        existing = session.execute(select(User).where(User.email == args.email)).scalar_one_or_none()
        if existing:
            print(f"Error: User with email '{args.email}' already exists.")
            sys.exit(1)

        user = User(
            email=args.email,
            hashed_password=hash_password(args.password),
            full_name=args.name,
            school_name=args.school,
            role="admin",
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"Teacher created successfully!")
        print(f"  ID:     {user.id}")
        print(f"  Email:  {user.email}")
        print(f"  Name:   {user.full_name}")
        print(f"  School: {user.school_name or '(none)'}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
