FROM golang:1.21-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o elect.exe ./cmd/elect/main.go

FROM alpine:latest

WORKDIR /app

RUN apk add --no-cache ca-certificates

COPY --from=builder /app/elect.exe .
COPY --from=builder /app/web ./web

EXPOSE 8080

ENV PORT=8080
ENV LOG_LEVEL=info

CMD ["./elect.exe"]
