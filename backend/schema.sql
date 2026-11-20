-- Memory Graph Database Schema
-- Azure SQL Database

-- 1. photos: 사진 기본 정보 및 이미지 임베딩 저장
CREATE TABLE photos (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    blob_path   NVARCHAR(400)   NOT NULL,
    thumb_path  NVARCHAR(400),
    embedding   VARBINARY(MAX),
    created_at  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);

-- 2. keywords: 키워드 정보 저장
CREATE TABLE keywords (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    category    NVARCHAR(20)    NOT NULL,
    name_ko     NVARCHAR(50)    NOT NULL,
    prompts_en  NVARCHAR(MAX),
    vector      VARBINARY(MAX)
);

-- 3. photo_keywords: 사진-키워드 연결 정보
CREATE TABLE photo_keywords (
    photo_id    INT             NOT NULL,
    keyword_id  INT             NOT NULL,
    score       FLOAT           NOT NULL DEFAULT 0.0,
    source      NVARCHAR(10)    NOT NULL DEFAULT 'ai',
    PRIMARY KEY (photo_id, keyword_id),
    FOREIGN KEY (photo_id)   REFERENCES photos(id)   ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES keywords(id)  ON DELETE CASCADE
);

-- 4. edges: 사진 간 연결 관계
CREATE TABLE edges (
    src_id      INT             NOT NULL,
    dst_id      INT             NOT NULL,
    weight      FLOAT           NOT NULL DEFAULT 0.0,
    PRIMARY KEY (src_id, dst_id),
    FOREIGN KEY (src_id) REFERENCES photos(id) ON DELETE NO ACTION,
    FOREIGN KEY (dst_id) REFERENCES photos(id) ON DELETE NO ACTION
);

-- 5. exhibitions: 전시장 정보
CREATE TABLE exhibitions (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    nickname    NVARCHAR(50)    NOT NULL,
    keyword     NVARCHAR(50),
    title       NVARCHAR(100)   NOT NULL,
    description NVARCHAR(1000),
    created_at  DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);

-- 6. exhibition_photos: 전시장-사진 연결 정보
CREATE TABLE exhibition_photos (
    exhibition_id INT           NOT NULL,
    photo_id      INT           NOT NULL,
    sort_order    INT           NOT NULL DEFAULT 0,
    PRIMARY KEY (exhibition_id, photo_id),
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE,
    FOREIGN KEY (photo_id)      REFERENCES photos(id)      ON DELETE CASCADE
);

-- 7. guestbook: 방명록 정보
CREATE TABLE guestbook (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    exhibition_id   INT             NOT NULL,
    nickname        NVARCHAR(50)    NOT NULL,
    text            NVARCHAR(500)   NOT NULL,
    created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
    FOREIGN KEY (exhibition_id) REFERENCES exhibitions(id) ON DELETE CASCADE
);
