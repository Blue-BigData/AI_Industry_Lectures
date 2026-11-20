"""
main.py – FastAPI 애플리케이션 및 API 엔드포인트 정의
Memory Graph Backend – Initial Setup
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field

from database import get_connection, init_db, test_connection

# ──────────────────────────────────────────────
# FastAPI 앱 생성
# ──────────────────────────────────────────────
app = FastAPI(
    title="Memory Graph API",
    description="Memory Graph 프로젝트 백엔드 API 명세",
    version="0.1.0",
)


# ──────────────────────────────────────────────
# Pydantic 스키마 (요청 / 응답)
# ──────────────────────────────────────────────

# --- Keywords (PhotoDetail에서 참조하므로 먼저 정의) ---
class KeywordScore(BaseModel):
    keyword_id: int
    name_ko: str
    category: str
    score: float
    source: str


# --- Photos ---
class PhotoCreate(BaseModel):
    blob_path: str = Field(..., max_length=400, description="원본 이미지 경로")
    thumb_path: Optional[str] = Field(None, max_length=400, description="썸네일 경로")


class PhotoOut(BaseModel):
    id: int
    blob_path: str
    thumb_path: Optional[str] = None
    created_at: datetime


class PhotoDetail(PhotoOut):
    keywords: List[KeywordScore] = []


class KeywordPatch(BaseModel):
    keyword_id: int
    score: float = Field(ge=0, le=1)
    source: str = Field(default="user", max_length=10)


class KeywordsPatchRequest(BaseModel):
    keywords: List[KeywordPatch]


# --- Graph ---
class GraphNode(BaseModel):
    id: int
    blob_path: str
    thumb_path: Optional[str] = None


class GraphEdge(BaseModel):
    src_id: int
    dst_id: int
    weight: float


class GraphOut(BaseModel):
    nodes: List[GraphNode] = []
    edges: List[GraphEdge] = []


# --- Related Photos ---
class RelatedPhoto(BaseModel):
    id: int
    blob_path: str
    thumb_path: Optional[str] = None
    weight: float


# --- Exhibitions ---
class ExhibitionCreate(BaseModel):
    nickname: str = Field(..., max_length=50)
    keyword: Optional[str] = Field(None, max_length=50)
    title: str = Field(..., max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    photo_ids: List[int] = Field(default_factory=list, description="포함할 사진 ID 목록")


class ExhibitionOut(BaseModel):
    id: int
    nickname: str
    keyword: Optional[str] = None
    title: str
    description: Optional[str] = None
    created_at: datetime


class ExhibitionDetail(ExhibitionOut):
    photos: List[PhotoOut] = []


class ExhibitionPatch(BaseModel):
    title: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    photo_ids: Optional[List[int]] = None


# --- Guestbook ---
class GuestbookCreate(BaseModel):
    nickname: str = Field(..., max_length=50)
    text: str = Field(..., max_length=500)


class GuestbookOut(BaseModel):
    id: int
    exhibition_id: int
    nickname: str
    text: str
    created_at: datetime


# ──────────────────────────────────────────────
# 헬스 체크 / 유틸리티
# ──────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """서버 상태 확인"""
    return {"status": "ok", "project": "Memory Graph"}


@app.get("/health", tags=["Health"])
def health_check():
    """DB 연결 상태 확인"""
    db_ok = test_connection()
    return {"server": "ok", "database": "connected" if db_ok else "disconnected"}


@app.post("/init-db", tags=["Health"])
def initialize_database():
    """schema.sql 실행하여 테이블 초기화"""
    try:
        init_db()
        return {"message": "데이터베이스 초기화 완료"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ──────────────────────────────────────────────
# Photos API
# ──────────────────────────────────────────────

@app.post(
    "/api/photos",
    response_model=PhotoOut,
    status_code=201,
    tags=["Photos"],
    summary="사진 업로드",
    description="새로운 사진 정보를 등록한다. (실제 파일 업로드는 추후 구현)",
)
def upload_photo(body: PhotoCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO photos (blob_path, thumb_path) "
        "OUTPUT INSERTED.id, INSERTED.blob_path, INSERTED.thumb_path, INSERTED.created_at "
        "VALUES (?, ?)",
        body.blob_path,
        body.thumb_path,
    )
    row = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    return PhotoOut(id=row[0], blob_path=row[1], thumb_path=row[2], created_at=row[3])


@app.get(
    "/api/photos",
    response_model=List[PhotoOut],
    tags=["Photos"],
    summary="사진 목록 조회",
)
def list_photos(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, blob_path, thumb_path, created_at "
        "FROM photos ORDER BY created_at DESC "
        "OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
        skip,
        limit,
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        PhotoOut(id=r[0], blob_path=r[1], thumb_path=r[2], created_at=r[3])
        for r in rows
    ]


@app.get(
    "/api/photos/{photoId}",
    response_model=PhotoOut,
    tags=["Photos"],
    summary="사진 상세 조회",
)
def get_photo(photoId: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, blob_path, thumb_path, created_at FROM photos WHERE id = ?",
        photoId,
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다.")
    return PhotoOut(id=row[0], blob_path=row[1], thumb_path=row[2], created_at=row[3])


@app.delete(
    "/api/photos/{photoId}",
    tags=["Photos"],
    summary="사진 삭제",
)
def delete_photo(photoId: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM photos WHERE id = ?", photoId)
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다.")
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "삭제 완료"}


@app.patch(
    "/api/photos/{photoId}/keywords",
    tags=["Photos"],
    summary="키워드 수정",
    description="사진에 연결된 키워드 정보를 수정한다.",
)
def patch_photo_keywords(photoId: int, body: KeywordsPatchRequest):
    conn = get_connection()
    cursor = conn.cursor()
    # 사진 존재 확인
    cursor.execute("SELECT id FROM photos WHERE id = ?", photoId)
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="사진을 찾을 수 없습니다.")

    for kw in body.keywords:
        cursor.execute(
            "MERGE photo_keywords AS target "
            "USING (SELECT ? AS photo_id, ? AS keyword_id) AS src "
            "ON target.photo_id = src.photo_id AND target.keyword_id = src.keyword_id "
            "WHEN MATCHED THEN UPDATE SET score = ?, source = ? "
            "WHEN NOT MATCHED THEN INSERT (photo_id, keyword_id, score, source) "
            "VALUES (?, ?, ?, ?);",
            photoId, kw.keyword_id,
            kw.score, kw.source,
            photoId, kw.keyword_id, kw.score, kw.source,
        )

    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "키워드 수정 완료"}


# ──────────────────────────────────────────────
# Graph API
# ──────────────────────────────────────────────

@app.get(
    "/api/graph",
    response_model=GraphOut,
    tags=["Graph"],
    summary="그래프 조회",
    description="전체 사진 노드와 연결 관계(엣지)를 조회한다.",
)
def get_graph():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, blob_path, thumb_path FROM photos")
    nodes = [GraphNode(id=r[0], blob_path=r[1], thumb_path=r[2]) for r in cursor.fetchall()]

    cursor.execute("SELECT src_id, dst_id, weight FROM edges")
    edges = [GraphEdge(src_id=r[0], dst_id=r[1], weight=r[2]) for r in cursor.fetchall()]

    cursor.close()
    conn.close()
    return GraphOut(nodes=nodes, edges=edges)


@app.get(
    "/api/photos/{photoId}/related",
    response_model=List[RelatedPhoto],
    tags=["Graph"],
    summary="유사 사진 조회",
    description="특정 사진과 연결된 유사 사진 목록을 조회한다.",
)
def get_related_photos(photoId: int, limit: int = Query(10, ge=1, le=50)):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT p.id, p.blob_path, p.thumb_path, e.weight "
        "FROM edges e JOIN photos p ON p.id = e.dst_id "
        "WHERE e.src_id = ? "
        "ORDER BY e.weight DESC "
        "OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY",
        photoId,
        limit,
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        RelatedPhoto(id=r[0], blob_path=r[1], thumb_path=r[2], weight=r[3])
        for r in rows
    ]


# ──────────────────────────────────────────────
# Exhibitions API
# ──────────────────────────────────────────────

@app.post(
    "/api/exhibitions",
    response_model=ExhibitionOut,
    status_code=201,
    tags=["Exhibitions"],
    summary="전시장 생성",
)
def create_exhibition(body: ExhibitionCreate):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO exhibitions (nickname, keyword, title, description) "
        "OUTPUT INSERTED.id, INSERTED.nickname, INSERTED.keyword, "
        "       INSERTED.title, INSERTED.description, INSERTED.created_at "
        "VALUES (?, ?, ?, ?)",
        body.nickname,
        body.keyword,
        body.title,
        body.description,
    )
    row = cursor.fetchone()
    exhibition_id = row[0]

    for idx, pid in enumerate(body.photo_ids):
        cursor.execute(
            "INSERT INTO exhibition_photos (exhibition_id, photo_id, sort_order) "
            "VALUES (?, ?, ?)",
            exhibition_id, pid, idx,
        )

    conn.commit()
    cursor.close()
    conn.close()
    return ExhibitionOut(
        id=row[0], nickname=row[1], keyword=row[2],
        title=row[3], description=row[4], created_at=row[5],
    )


@app.get(
    "/api/exhibitions",
    response_model=List[ExhibitionOut],
    tags=["Exhibitions"],
    summary="전시장 목록 조회",
)
def list_exhibitions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, nickname, keyword, title, description, created_at "
        "FROM exhibitions ORDER BY created_at DESC "
        "OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
        skip,
        limit,
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        ExhibitionOut(
            id=r[0], nickname=r[1], keyword=r[2],
            title=r[3], description=r[4], created_at=r[5],
        )
        for r in rows
    ]


@app.get(
    "/api/exhibitions/{exhibitionId}",
    response_model=ExhibitionDetail,
    tags=["Exhibitions"],
    summary="전시장 상세 조회",
)
def get_exhibition(exhibitionId: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "SELECT id, nickname, keyword, title, description, created_at "
        "FROM exhibitions WHERE id = ?",
        exhibitionId,
    )
    row = cursor.fetchone()
    if not row:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="전시장을 찾을 수 없습니다.")

    cursor.execute(
        "SELECT p.id, p.blob_path, p.thumb_path, p.created_at "
        "FROM exhibition_photos ep JOIN photos p ON p.id = ep.photo_id "
        "WHERE ep.exhibition_id = ? ORDER BY ep.sort_order",
        exhibitionId,
    )
    photos = [
        PhotoOut(id=p[0], blob_path=p[1], thumb_path=p[2], created_at=p[3])
        for p in cursor.fetchall()
    ]

    cursor.close()
    conn.close()
    return ExhibitionDetail(
        id=row[0], nickname=row[1], keyword=row[2],
        title=row[3], description=row[4], created_at=row[5],
        photos=photos,
    )


@app.patch(
    "/api/exhibitions/{exhibitionId}",
    tags=["Exhibitions"],
    summary="전시장 수정",
)
def patch_exhibition(exhibitionId: int, body: ExhibitionPatch):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM exhibitions WHERE id = ?", exhibitionId)
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="전시장을 찾을 수 없습니다.")

    if body.title is not None:
        cursor.execute(
            "UPDATE exhibitions SET title = ? WHERE id = ?", body.title, exhibitionId
        )
    if body.description is not None:
        cursor.execute(
            "UPDATE exhibitions SET description = ? WHERE id = ?",
            body.description, exhibitionId,
        )
    if body.photo_ids is not None:
        cursor.execute(
            "DELETE FROM exhibition_photos WHERE exhibition_id = ?", exhibitionId
        )
        for idx, pid in enumerate(body.photo_ids):
            cursor.execute(
                "INSERT INTO exhibition_photos (exhibition_id, photo_id, sort_order) "
                "VALUES (?, ?, ?)",
                exhibitionId, pid, idx,
            )

    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "전시장 수정 완료"}


@app.delete(
    "/api/exhibitions/{exhibitionId}",
    tags=["Exhibitions"],
    summary="전시장 삭제",
)
def delete_exhibition(exhibitionId: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM exhibitions WHERE id = ?", exhibitionId)
    if cursor.rowcount == 0:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="전시장을 찾을 수 없습니다.")
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "삭제 완료"}


# ──────────────────────────────────────────────
# Guestbook API
# ──────────────────────────────────────────────

@app.post(
    "/api/exhibitions/{exhibitionId}/guestbook",
    response_model=GuestbookOut,
    status_code=201,
    tags=["Guestbook"],
    summary="방명록 작성",
)
def create_guestbook(exhibitionId: int, body: GuestbookCreate):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM exhibitions WHERE id = ?", exhibitionId)
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="전시장을 찾을 수 없습니다.")

    cursor.execute(
        "INSERT INTO guestbook (exhibition_id, nickname, text) "
        "OUTPUT INSERTED.id, INSERTED.exhibition_id, INSERTED.nickname, "
        "       INSERTED.text, INSERTED.created_at "
        "VALUES (?, ?, ?)",
        exhibitionId,
        body.nickname,
        body.text,
    )
    row = cursor.fetchone()
    conn.commit()
    cursor.close()
    conn.close()
    return GuestbookOut(
        id=row[0], exhibition_id=row[1], nickname=row[2],
        text=row[3], created_at=row[4],
    )


@app.get(
    "/api/exhibitions/{exhibitionId}/guestbook",
    response_model=List[GuestbookOut],
    tags=["Guestbook"],
    summary="방명록 조회",
)
def list_guestbook(
    exhibitionId: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM exhibitions WHERE id = ?", exhibitionId)
    if not cursor.fetchone():
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="전시장을 찾을 수 없습니다.")

    cursor.execute(
        "SELECT id, exhibition_id, nickname, text, created_at "
        "FROM guestbook WHERE exhibition_id = ? "
        "ORDER BY created_at DESC "
        "OFFSET ? ROWS FETCH NEXT ? ROWS ONLY",
        exhibitionId,
        skip,
        limit,
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return [
        GuestbookOut(
            id=r[0], exhibition_id=r[1], nickname=r[2],
            text=r[3], created_at=r[4],
        )
        for r in rows
    ]
