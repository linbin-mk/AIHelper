## ADDED Requirements

### Requirement: Shared Source Directory

The project SHALL maintain a `shared/` directory at the repository root containing all browser-agnostic business logic (chat, config, memory, knowledge, resource, session management, skill registry, i18n, output files, favorites, CSS, and third-party libraries).

#### Scenario: Shared logic is independent of browser platform

- **WHEN** a developer reads a file in `shared/`
- **THEN** the file SHALL contain no `chrome.*` or `browser.*` API calls specific to any single browser platform

#### Scenario: Chrome extension works with shared code

- **WHEN** the sync script copies `shared/` into `chrome-extension/src/shared/`
- **THEN** the Chrome extension SHALL load and function correctly

#### Scenario: Firefox extension works with shared code

- **WHEN** the sync script copies `shared/` into `firefox-extension/src/shared/`
- **THEN** the Firefox extension SHALL load and function correctly

### Requirement: Content Script Sharing

The Chrome extension's `src/content/` directory (request-interceptor, request-interceptor-bridge, page-context, page-interactive-elements, page-css, page-source, page-js, auth-extractor, element-click, execute-request-inject) SHALL be shared between Chrome and Firefox without modification.

#### Scenario: Content scripts are identical across platforms

- **WHEN** the sync script copies content scripts from `chrome-extension/src/content/` to `firefox-extension/src/content/`
- **THEN** all content scripts SHALL work in Firefox without platform-specific modifications

### Requirement: Skills Directory Sharing

The `skills/` directory containing all skill definitions SHALL be shared between Chrome and Firefox extensions via the sync script.

#### Scenario: Skills are identical across platforms

- **WHEN** the sync script copies `skills/` to both extension directories
- **THEN** the same skill JSON and markdown files SHALL be available in both Chrome and Firefox

### Requirement: Sync Script

A `sync.sh` shell script SHALL be provided at the repository root that copies shared files into all platform extension directories.

#### Scenario: Sync copies shared logic

- **WHEN** `bash sync.sh` is executed
- **THEN** all files from `shared/` SHALL be copied to `chrome-extension/src/shared/` and `firefox-extension/src/shared/`

#### Scenario: Sync copies skills

- **WHEN** `bash sync.sh` is executed
- **THEN** all files from `skills/` SHALL be copied to `chrome-extension/skills/` and `firefox-extension/skills/`

#### Scenario: Sync copies content scripts

- **WHEN** `bash sync.sh` is executed
- **THEN** all files from `chrome-extension/src/content/` SHALL be copied to `firefox-extension/src/content/`

#### Scenario: Sync removes stale files

- **WHEN** a file is deleted from `shared/` and `bash sync.sh` is executed
- **THEN** the corresponding file SHALL be removed from both platform extension directories

### Requirement: Platform Abstraction Layer

The extension SHALL provide a thin platform abstraction layer that isolates browser-specific code (Side Panel vs Popup, DNR vs webRequest blocking, Service Worker vs Event Pages) from shared business logic.

#### Scenario: Shared code calls platform-agnostic API

- **WHEN** shared business logic needs to perform a platform-specific operation (e.g., open UI panel, modify request headers)
- **THEN** it SHALL call through a platform abstraction function, not directly invoke `chrome.*` or `browser.*`

#### Scenario: Platform-specific code lives in platform directories

- **WHEN** a developer needs to modify Chrome-specific behavior
- **THEN** they SHALL edit files in `chrome-extension/src/`, not files in `shared/`

#### Scenario: Platform-specific code lives in platform directories (Firefox)

- **WHEN** a developer needs to modify Firefox-specific behavior
- **THEN** they SHALL edit files in `firefox-extension/src/`, not files in `shared/`
