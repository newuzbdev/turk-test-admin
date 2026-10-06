# Only static browser assets cross into the target-platform Nginx image.
FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_STUDENT_APP_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STUDENT_APP_URL=$VITE_STUDENT_APP_URL
RUN test -n "$VITE_API_URL" && test -n "$VITE_STUDENT_APP_URL" && npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
