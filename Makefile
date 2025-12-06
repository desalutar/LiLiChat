# Generate .env from config.yml before running docker-compose
env:
	python3 scripts/generate-env.py

up: env
	docker-compose up --build

linuxUP: env
	docker compose up --build