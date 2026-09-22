# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./

# Оптимизация: отключаем аудит и отрисовку прогресс-баров для экономии CPU Intel
RUN npm ci --no-audit --progress=false

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage (Раздача статики через ультра-легкий Nginx)
FROM nginx:alpine

# Копируем ваш настроенный nginx.conf и собранный фронтенд
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
