# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json turbo.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm ci
RUN npm run build --workspace @sms/api

# ---- Runtime stage ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
