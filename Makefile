# Project Makefile.
#
# Targets are documented inline with `## ` comments — the `help`
# target greps for them, so adding a new target with a `## ` comment
# automatically lists it in `make help`.

.DEFAULT_GOAL := help

.PHONY: help init run fmt fmt-check build test test-e2e lint clean \
        assets-build assets-validate assets-export-web

BACKLOG_SOURCE ?= github:lesserevil/Backlog.md
BACKLOG_CLI ?= bun x --bun $(BACKLOG_SOURCE)
BACKLOG_DIR ?= backlog
BACKLOG_PROJECT_NAME ?= $(notdir $(CURDIR))

# Web workspace directory
WEB_DIR := web

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

assets-validate: ## Validate USD assets in assets/usd/office/ (requires usd-core).
	scripts/assets/assets-validate.sh

assets-export-web: ## Export canonical USD assets to web GLB files (requires Blender).
	scripts/assets/assets-export-web.sh
