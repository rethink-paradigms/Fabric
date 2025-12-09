# Fabric

**Fabric** is an open-source framework designed to augment human capabilities using AI. It organizes AI prompts (called "Patterns") into a structured, manageable system that can be accessed via a Command Line Interface (CLI) or a Web Interface.

## Project Overview

*   **Core Logic:** The heart of Fabric is its collection of **Patterns** (prompts), stored as Markdown files in `data/patterns`. These patterns are designed to solve specific problems (e.g., summarization, extraction, analysis).
*   **CLI (Go):** The primary interface is a Go-based CLI tool that allows users to pipe content into these patterns.
*   **Web Interface (Svelte/TypeScript):** A modern web UI for interacting with Fabric, located in the `web/` directory.
*   **Ecosystem:** Includes helper apps (`to_pdf`, `code_helper`), browser extensions, and integrations (Obsidian).

## Key Directories

*   **`cmd/`**: Contains the main applications.
    *   `cmd/fabric/`: The main CLI entry point.
    *   `cmd/to_pdf/`: Helper tool to convert LaTeX to PDF.
    *   `cmd/code_helper/`: Helper tool for coding tasks.
*   **`internal/`**: Private application and library code.
*   **`data/patterns/`**: The library of AI prompts. Each pattern is a directory containing a `system.md` (and optional `user.md`) file.
*   **`web/`**: The source code for the Fabric Web App (SvelteKit).
*   **`scripts/`**: Installation and utility scripts (Python, Bash, PowerShell).

## Building and Running

### CLI (Go)

**Prerequisites:** Go 1.25+

1.  **Install/Update:**
    ```bash
    go install github.com/danielmiessler/fabric/cmd/fabric@latest
    ```

2.  **Setup:**
    ```bash
    fabric --setup
    ```
    This initializes configuration and downloads patterns to `~/.config/fabric`.

3.  **Usage:**
    ```bash
    # Standard usage
    fabric --pattern summarize < input.txt

    # List patterns
    fabric --listpatterns
    ```

### Web App (Svelte)

**Prerequisites:** Node.js 18+

1.  **Navigate to directory:**
    ```bash
    cd web
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    pnpm install
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    *Note: The web app requires the Fabric API server to be running (`fabric --serve`).*

## Development Conventions

*   **Patterns:**
    *   Stored in `data/patterns/<pattern_name>/system.md`.
    *   Must use Markdown formatting.
    *   Focus on clear, structural instructions for the AI.
*   **Go Code:**
    *   Follows standard Go project layout (`cmd`, `internal`, `pkg`).
    *   Dependencies managed via `go.mod`.
*   **Web Code:**
    *   Built with SvelteKit and Tailwind CSS.
    *   Uses `pnpm` or `npm`.
*   **Contribution:**
    *   New patterns should be added via Pull Request to `data/patterns`.
    *   Code changes should follow the existing style and include tests where appropriate.

## Important Files

*   `README.md`: Main project documentation.
*   `GEMINI.md`: This context file.
*   `go.mod`: Go module definition.
*   `web/package.json`: Web app dependencies and scripts.
*   `data/patterns/pattern_explanations.md`: Summary of available patterns.
