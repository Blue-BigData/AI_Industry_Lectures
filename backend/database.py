"""
database.py – Azure SQL Database 연결 및 초기화
"""

import os
import pyodbc
from dotenv import load_dotenv

load_dotenv()

SQL_CONNECTION_STRING: str = os.getenv("SQL_CONNECTION_STRING", "")


def get_connection() -> pyodbc.Connection:
    """데이터베이스 연결 객체를 반환한다."""
    if not SQL_CONNECTION_STRING:
        raise RuntimeError(
            "SQL_CONNECTION_STRING 환경 변수가 설정되지 않았습니다. "
            ".env 파일을 확인하세요."
        )
    return pyodbc.connect(SQL_CONNECTION_STRING)


def init_db() -> None:
    """schema.sql을 읽어 테이블을 생성한다."""
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r", encoding="utf-8") as f:
        raw_sql = f.read()

    conn = get_connection()
    cursor = conn.cursor()

    # GO 또는 빈 줄 기준이 아닌, 세미콜론 뒤 개행으로 문장 분리
    statements = [s.strip() for s in raw_sql.split(";") if s.strip()]
    for stmt in statements:
        # 주석만 있는 블록은 건너뛴다
        lines = [l for l in stmt.splitlines() if not l.strip().startswith("--")]
        if not any(lines):
            continue
        try:
            cursor.execute(stmt)
        except pyodbc.ProgrammingError as e:
            # 이미 존재하는 테이블이면 무시
            if "already an object" in str(e) or "이미 있습니다" in str(e):
                pass
            else:
                raise

    conn.commit()
    cursor.close()
    conn.close()


def test_connection() -> bool:
    """데이터베이스 연결 테스트. 성공 시 True 반환."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"DB 연결 실패: {e}")
        return False
