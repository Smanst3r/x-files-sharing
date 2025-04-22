### SERVER (Build Stage)
FROM node:20-alpine AS server_builder
WORKDIR /build/server

# Install backend dependencies
COPY server/package*.json ./
RUN npm install

COPY server ./
RUN npm run build

### CLIENT (Build Stage)
FROM node:20-alpine AS client_builder
WORKDIR /build/client

# Install frontend dependencies
COPY client/package*.json ./
RUN npm install

COPY client ./
RUN npm run build

### SERVER (Runtime Stage)
FROM node:20-alpine AS server_runtime
WORKDIR /app/server

RUN apk add --no-cache sqlite sqlite-dev

# Install only production dependencies
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy server build output and other necessary runtime files from the build stage
COPY --from=server_builder /build/server/dist ./dist
COPY --from=server_builder /build/server/uploads ./uploads
COPY --from=server_builder /build/server/sessions ./sessions
# Copy other necessary files
COPY --from=server_builder /build/server/app.db.sql ./app.db.sql
COPY --from=server_builder /build/server/*.json ./
# Copy built frontend files from the client build stage into the /public directory
COPY --from=client_builder /build/server/public ./public

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
ENV NODE_ENV=production

EXPOSE 3333

ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/main"]
