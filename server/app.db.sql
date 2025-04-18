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
