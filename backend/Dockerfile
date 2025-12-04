FROM golang:1.25.4-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN go build -o lilychat ./cmd/main.go

FROM alpine:latest

RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY --from=builder /app/lilychat .

COPY config ./config
COPY --from=builder /app/internal ./internal


EXPOSE 9900

CMD ["./lilychat"]
