# Execution Packet Standard

Version: 1.0
Status: ACTIVE
Layer: Thinking -> Execution Interface

---------------------------------------------------------------------

## Purpose

Execution Packet defines the canonical contract between
Thinking Layer and Execution Layer.

It ensures strict separation between:

generated state
and
executed state.

Thinking layer:
- designs
- proposes
- prepares changes

Execution layer:
- creates files
- modifies repositories
- performs commits
- performs pushes

No change is considered real until confirmed by execution events.

---------------------------------------------------------------------

## Execution Packet Structure

### 1. Header

EXECUTION PACKET
TYPE
TARGET
PURPOSE

---------------------------------------------------------------------

### 2. Context

Short explanation of the change.

---------------------------------------------------------------------

### 3. Input Artifacts

List of decisions, snapshots, or documents
that justify the operation.

Example:

- MIGRATION SNAPSHOT
- ADR entries
- architectural decisions

---------------------------------------------------------------------

### 4. File Operations

Explicit operations must be declared.

Allowed operations:

CREATE
UPDATE
DELETE
MOVE

Each operation must include:

PATH
CONTENT or CHANGE description

---------------------------------------------------------------------

### 5. Constraints

Rules that execution layer must respect.

Examples:

- do not rewrite git history
- do not modify unrelated files
- perform a single commit

---------------------------------------------------------------------

### 6. Expected Result

Execution layer must confirm:

files created
files updated
commit performed
push performed

---------------------------------------------------------------------

### 7. Execution Report

Execution layer must return a structured report.

Required fields:

STATUS
FILES CREATED
FILES UPDATED
COMMIT MESSAGE
BRANCH
PUSH RESULT
WORKING TREE STATUS

---------------------------------------------------------------------

## Result

Execution Packet becomes the canonical bridge between
thinking layer and execution layer for the platform.
