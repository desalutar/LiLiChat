# Generate .env file from config.yml
env:
	python3 scripts/generate-env.py


# Build and start all services (macOS/Windows)
up: env
	docker-compose up --build

# Build and start all services (Linux)
linuxUP: env
	docker compose up --build

# Watch TypeScript files and auto-compile on changes
watch-ts:
	cd frontend && npm run watch

# Compile TypeScript once
build-ts:
	cd frontend && npm run build

# Build everything: compile TypeScript and build Docker images (macOS/Windows)
build: build-ts
	@echo "Building Docker containers..."
	docker-compose build

# Build everything: compile TypeScript and build Docker images (Linux)
build-linux: build-ts
	@echo "Building Docker containers..."
	docker compose build