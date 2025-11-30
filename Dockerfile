FROM golang:1.25.4-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o lilychat ./cmd/main.go

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/lilychat .

COPY config ./config

ENV POSTGRES_DSN=postgres://postgres:password@db:5432/lilychat?sslmode=disable
ENV SERVER_PORT=9900
ENV SHUTDOWN_TIMEOUT=5s

EXPOSE 9900

CMD ["./lilychat"]
