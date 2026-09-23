FROM node:22-alpine AS build

WORKDIR /app

ARG MODE=production

COPY package*.json ./

RUN npm ci

ENV NODE_ENV=$MODE

COPY . .

RUN if [ "$NODE_ENV" = "development" ]; then \
      echo "Building Angular in DEVELOPMENT mode"; \
      npm run build -- --configuration=development; \
    else \
      echo "Building Angular in PRODUCTION mode"; \
      npm run build -- --configuration=production; \
    fi

FROM nginx:alpine
COPY --from=build /app/dist/reserve/browser /usr/share/nginx/html
COPY nginx-prod.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443