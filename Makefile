# Project Makefile.
#
# Targets are documented inline with `## ` comments — the `help`
# target greps for them, so adding a new target with a `## ` comment
# automatically lists it in `make help`.

.DEFAULT_GOAL := help

.PHONY: help init fmt fmt-check build test lint clean

BACKLOG_SOURCE ?= github:lesserevil/Backlog.md
BACKLOG_CLI ?= bun x --bun $(BACKLOG_SOURCE)
BACKLOG_DIR ?= backlog
BACKLOG_PROJECT_NAME ?= $(notdir $(CURDIR))

help: ## Show this help.
	@awk 'BEGIN {FS = ":.*?## "; printf "Usage: make <target>\n\nTargets:\n"} \
		/^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' \
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
	fi

# ─── Quality gates ────────────────────────────────────────────────
# Stubs — replace the bodies with this project's real toolchain.
# AGENTS.md references these target names; keep them named the same
# so the documented workflow stays accurate.

fmt: ## Format all source files in place.
	@echo "fmt: not yet configured — edit Makefile" && exit 1

fmt-check: ## Check formatting without modifying files.
	@echo "fmt-check: not yet configured — edit Makefile" && exit 1

build: ## Build the project.
	@echo "build: not yet configured — edit Makefile" && exit 1

test: ## Run the test suite.
	@echo "test: not yet configured — edit Makefile" && exit 1

lint: ## Run static analysis / linters.
	@echo "lint: not yet configured — edit Makefile" && exit 1

clean: ## Remove build artifacts.
	@echo "clean: not yet configured — edit Makefile" && exit 1
