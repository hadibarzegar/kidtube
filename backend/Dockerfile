# Build stage
FROM golang:1.25-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

# Site API target
FROM builder AS site-api-build
RUN CGO_ENABLED=0 go build -o /bin/site-api ./cmd/site-api

# Admin API target
FROM builder AS admin-api-build
RUN CGO_ENABLED=0 go build -o /bin/admin-api ./cmd/admin-api

# Seed target
FROM builder AS seed-build
RUN CGO_ENABLED=0 go build -o /bin/seed ./cmd/seed

# Site API runtime
FROM alpine:3.19 AS site-api
RUN apk add --no-cache wget
COPY --from=site-api-build /bin/site-api /bin/site-api
ENTRYPOINT ["/bin/site-api"]

# Admin API runtime — includes ffmpeg and seed binary
FROM alpine:3.19 AS admin-api
RUN apk add --no-cache wget ffmpeg
COPY --from=admin-api-build /bin/admin-api /bin/admin-api
COPY --from=seed-build /bin/seed /bin/seed
ENTRYPOINT ["/bin/admin-api"]
