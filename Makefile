# Project Makefile.
#
# Targets are documented inline with `## ` comments — the `help`
# target greps for them, so adding a new target with a `## ` comment
# automatically lists it in `make help`.

.DEFAULT_GOAL := help

.PHONY: help init run run-api fmt fmt-check build test test-api test-e2e lint clean \
        assets-build assets-validate assets-validate-test assets-export-web \
        assets-populate-runtime \
        physics-harness-dry-run physics-harness physics-harness-test \
        smoke-nemotron smoke-nemotron-dry-run smoke-nemotron-test

BACKLOG_SOURCE ?= github:lesserevil/Backlog.md
BACKLOG_CLI ?= bun x --bun $(BACKLOG_SOURCE)
BACKLOG_DIR ?= backlog
BACKLOG_PROJECT_NAME ?= $(notdir $(CURDIR))

# Web workspace directory
WEB_DIR := web

# Backend API directory
API_DIR := api

help: ## Show this help.
	@awk 'BEGIN {FS = ":.*?## "; printf "Usage: make <target>\n\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' \
		$(MAKEFILE_LIST)

# ─── Bootstrap ────────────────────────────────────────────────────
# `make init` brings a fresh checkout into a working state: git
# repo and Backlog.md task tracker. Each step is idempotent — running
# `make init` again is safe.

init: ## Initialize repo: git init and Backlog.md from lesserevil.
	@set -e; \
	if [ ! -d .git ]; then \
		echo "[init] git init"; \
		git init; \
	else \
		echo "[init] git: already initialized"; \
	fi; \
	if ! command -v bun >/dev/null 2>&1; then \
		echo "[init] bun not found on PATH."; \
		echo "       Install Bun from https://bun.sh and re-run 'make init'."; \
		echo "       Backlog.md is run from $(BACKLOG_SOURCE)."; \
		exit 1; \
	else \
		echo "[init] bun: $$(command -v bun)"; \
	fi; \
	if [ ! -d "$(BACKLOG_DIR)" ] || { [ ! -f backlog.config.yml ] && [ ! -f "$(BACKLOG_DIR)/config.yml" ]; }; then \
		echo "[init] backlog init ($(BACKLOG_SOURCE))"; \
		$(BACKLOG_CLI) init "$(BACKLOG_PROJECT_NAME)" \
			--defaults \
			--backlog-dir "$(BACKLOG_DIR)" \
			--config-location root \
			--integration-mode none; \
	else \
		echo "[init] backlog: already initialized ($(BACKLOG_DIR)/ and config present)"; \
	fi; \
	if [ -d "$(WEB_DIR)" ]; then \
		echo "[init] installing web dependencies (bun install)"; \
		cd $(WEB_DIR) && bun install; \
	fi

# ─── Local development ─────────────────────────────────────────────

run: ## Start the MVP web app development server on all interfaces.
	cd $(WEB_DIR) && bun run dev

run-api: ## Start the backend chat API server (port 8000). Requires: pip install api/requirements.txt.
	python3 -m uvicorn api.main:app --reload --port 8000

# ─── Backend API ──────────────────────────────────────────────────
# The backend chat service lives in api/ and uses Python + FastAPI.
# Tests do not require a real NVIDIA key.
# Install deps once: pip install -r api/requirements-dev.txt

test-api: ## Run backend chat service unit tests (no NVIDIA key required).
	python3 -m pytest api/tests/ -v

# ─── Quality gates ────────────────────────────────────────────────
# These targets delegate to the web/ workspace via bun scripts.
# Add additional workspaces here when they are added to the repo.

fmt: ## Format all source files in place.
	cd $(WEB_DIR) && bun run fmt

fmt-check: ## Check formatting without modifying files.
	cd $(WEB_DIR) && bun run fmt-check

build: ## Build the project.
	cd $(WEB_DIR) && bun run build

test: ## Run the test suite.
	cd $(WEB_DIR) && bun run test

test-e2e: ## Run Playwright end-to-end tests (requires: bun run install-browsers first).
	cd $(WEB_DIR) && bun run test:e2e

lint: ## Run static analysis / linters.
	cd $(WEB_DIR) && bun run typecheck && bun run lint

clean: ## Remove build artifacts.
	rm -rf $(WEB_DIR)/dist $(WEB_DIR)/coverage $(WEB_DIR)/playwright-report

# ─── Asset pipeline ────────────────────────────────────────────────
# Non-interactive USD asset pipeline.  Each target delegates to a
# backing script under scripts/assets/.  Run from the repo root.
#
# Tools such as Blender and usd-core are OPTIONAL — the scripts check
# for them and print actionable install instructions when missing.
# GPU hardware, Omniverse, Nucleus, and RTX rendering are NOT required.
#
# See docs/asset-pipeline.md for full usage and install instructions.

assets-build: ## Convert source GLB/glTF assets to canonical USD (requires Blender).
	scripts/assets/assets-build.sh

assets-validate: ## Validate USD stage structure, web manifest mapping, and physics metadata (usd-core optional).
	scripts/assets/assets-validate.sh
	python3 scripts/assets/validate_usd.py

assets-validate-test: ## Run unit tests for the USD Physics metadata validator.
	python3 -m pytest scripts/assets/test_validate_usd.py -v

assets-export-web: ## Export canonical USD assets to web GLB files (requires Blender).
	scripts/assets/assets-export-web.sh

assets-populate-runtime: ## Populate checked-in MVP office runtime GLBs from Kenney + local generated props.
	node scripts/assets/populate-office-runtime-glbs.mjs

# ─── Newton physics evaluation harness (optional) ──────────────────────────
# Newton and NVIDIA Warp are OPTIONAL dependencies.  These targets do not
# require a GPU.  The smoke harness exits with code 2 (SKIP) when Newton is
# not installed; that is not an error.
# See docs/office-physics.md for installation instructions.

physics-harness-dry-run: ## Run Newton smoke harness in dry-run mode (no Newton/GPU needed).
	python3 scripts/physics/newton_smoke_harness.py --dry-run

physics-harness: ## Run Newton smoke harness with Newton (skips if Newton not installed).
	python3 scripts/physics/newton_smoke_harness.py; \
	exit_code=$$?; \
	if [ $$exit_code -eq 2 ]; then \
		echo "[make] Newton not installed — harness skipped (exit 2 is not a failure)."; \
		exit 0; \
	fi; \
	exit $$exit_code

physics-harness-test: ## Run unit and integration tests for the Newton smoke harness (no GPU needed).
	python3 -m pytest scripts/physics/test_newton_smoke_harness.py -v

# ─── Nemotron live smoke check (opt-in) ────────────────────────────────────
# Sends a low-token request to the NVIDIA Nemotron model using the same
# backend client as /api/chat.  Requires a valid NVIDIA API key — skips
# gracefully (exit 2 → treated as success) when credentials are absent.
#
# NOT wired into make test or any default CI gate.  Run manually after
# confirming a valid key is configured (NVIDIA_API_KEY or ~/.netrc).
#
# See docs/nemotron-chat.md § Opt-in Live Smoke Check for full usage.

smoke-nemotron-dry-run: ## Validate Nemotron smoke-check prompt without calling the NVIDIA API.
	python3 scripts/nemotron/nemotron_smoke_check.py --dry-run

smoke-nemotron: ## Run the live Nemotron smoke check (requires NVIDIA key; skips if absent).
	python3 scripts/nemotron/nemotron_smoke_check.py; \
	exit_code=$$?; \
	if [ $$exit_code -eq 2 ]; then \
		echo "[make] NVIDIA key not configured — smoke check skipped (exit 2 is not a failure)."; \
		exit 0; \
	fi; \
	exit $$exit_code

smoke-nemotron-test: ## Run unit tests for the Nemotron smoke check (no NVIDIA key required).
	python3 -m pytest scripts/nemotron/test_nemotron_smoke_check.py -v
