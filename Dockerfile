###
### CLIENT
###
FROM node:20-alpine as client_builder
WORKDIR /client-build

# Install frontend dependencies
COPY client/package*.json ./
RUN npm install

COPY client ./
RUN npm run build  # This assumes `npm run build` creates the `dist` directory

###
### SERVER
###

# 1. Build stage for the server
FROM node:20-alpine AS server_builder

WORKDIR /server-build

# Install dependencies (including dev dependencies needed for the build)
COPY server/package*.json ./
RUN npm install

# Copy source files and build the server
COPY server ./
RUN npm run build

# 2. Runtime stage for the server
FROM node:20-alpine
WORKDIR /app/server

# Install only production dependencies
COPY server/package*.json ./
RUN npm install --omit=dev

# Copy server build output and necessary runtime files from the build stage
COPY --from=server_builder /server-build/dist ./dist
COPY --from=server_builder /server-build/uploads ./uploads
COPY --from=server_builder /server-build/sessions ./sessions
COPY --from=server_builder /server-build/allowed_ip_addresses.txt ./allowed_ip_addresses.txt
COPY --from=server_builder /server-build/tokens.txt ./tokens.txt
COPY --from=server_builder /server-build/*.json ./

# Copy the frontend build output from the client build stage
COPY --from=client_builder /client-build/dist /app/server/dist/public

COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
ENV NODE_ENV=production

EXPOSE 3333

ENTRYPOINT ["./entrypoint.sh"]
# Start the server
CMD ["node", "dist/main"]
