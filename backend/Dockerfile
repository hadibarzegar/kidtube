# Build stage
FROM golang:1.23-alpine AS builder
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

# Site API runtime
FROM alpine:3.19 AS site-api
RUN apk add --no-cache wget
COPY --from=site-api-build /bin/site-api /bin/site-api
ENTRYPOINT ["/bin/site-api"]

# Admin API runtime
FROM alpine:3.19 AS admin-api
RUN apk add --no-cache wget
COPY --from=admin-api-build /bin/admin-api /bin/admin-api
ENTRYPOINT ["/bin/admin-api"]
