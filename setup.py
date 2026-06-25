from setuptools import setup, find_packages

setup(
    name="medical_assistant",
    version="0.1",
    packages=find_packages(where="medical_assistant"),
    package_dir={"": "medical_assistant"},
    install_requires=[
        "fastapi~=0.118.3",
        "uvicorn",
        "asyncpg",
        "sqlalchemy~=2.0.45",
        "pydantic~=2.12.0",
        "pydantic[email]",
        "passlib",
        "bcrypt",
        "alembic",
        "pydantic-settings",
        "python-dotenv",
        "python-jose[cryptography]",
        "python-multipart",
        "psycopg2-binary",
    ],
)
