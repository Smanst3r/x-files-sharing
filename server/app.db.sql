DROP TABLE IF EXISTS "uploaded_files";
CREATE TABLE IF NOT EXISTS "uploaded_files"
(
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    token     TEXT not null,
    fileName  TEXT not null,
    dirName   TEXT not null,
    expiresAt TEXT not null,
    sessionId TEXT not null
);


DROP TABLE IF EXISTS "auth_token_invalid_attempts";
CREATE TABLE IF NOT EXISTS "auth_token_invalid_attempts"
(
    ip TEXT not null PRIMARY KEY,
    attempts INTEGER not null DEFAULT 0,
    last_attempt_at TEXT not null
)