# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json ./
COPY .npmrc ./

# Copy only API and shared packages (not mobile)
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Create a modified package.json that only includes api and shared workspaces
RUN node -e "const pkg = require('./package.json'); pkg.workspaces = ['apps/api', 'packages/shared']; require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));"

# Install dependencies (only for api and shared)
RUN npm install --legacy-peer-deps

# Copy source code
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY tsconfig.json ./

# Build shared first, then API
WORKDIR /app/packages/shared
RUN npm run build

WORKDIR /app/apps/api
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

# Set environment
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
