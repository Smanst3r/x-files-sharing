CREATE TABLE IF NOT EXISTS "uploaded_files"
(
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    token     TEXT not null,
    fileName  TEXT not null,
    dirName   TEXT not null,
    expiresAt TEXT not null,
    sessionId TEXT not null
);
CREATE TABLE IF NOT EXISTS "auth_token_invalid_attempts"
(
    ip TEXT not null PRIMARY KEY,
    attempts INTEGER not null DEFAULT 0,
    lastAttemptAt TEXT not null
)