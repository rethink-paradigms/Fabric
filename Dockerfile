FROM golang:1.23-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git build-base

# Cache dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN go build -o fabric-bin cmd/fabric/main.go

EXPOSE 8080

# Environment variables found in documentation/code (optional adjustments)
ENV FABRIC_OUTPUT_PATH=/app/output

CMD ["./fabric-bin", "--serve"]
