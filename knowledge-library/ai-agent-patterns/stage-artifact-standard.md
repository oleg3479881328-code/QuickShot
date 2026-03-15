# Stage Artifact Standard

Version: 1.0
Status: ACTIVE
Layer: Agent Pipeline Interface

---------------------------------------------------------------------

## Purpose

Stage Artifact Standard defines the canonical document structure
that agents must produce at each stage of the AI Software
Development Platform pipeline.

Artifacts act as the contract between:

Stage Agent
Validation Agent
Human Gate
Next Stage Agent

Artifacts must be human-readable and LLM-friendly.

---------------------------------------------------------------------

## Pipeline Artifacts

The canonical artifact set:

PRODUCT_SPEC.md
UX_FLOW.md
ARCHITECTURE.md
BACKEND_SPEC.md
UI_DESIGN_SPEC.md
FRONTEND_SPEC.md
QA_REPORT.md

Each stage produces exactly one primary artifact.

---------------------------------------------------------------------

## Artifact Naming Convention

Artifacts follow the Project + Stage ID format.

Example:

PRJ-001_STAGE-01_PRODUCT_SPEC.md
PRJ-001_STAGE-02_UX_FLOW.md
PRJ-001_STAGE-03_ARCHITECTURE.md
PRJ-001_STAGE-04_BACKEND_SPEC.md
PRJ-001_STAGE-05_UI_DESIGN_SPEC.md
PRJ-001_STAGE-06_FRONTEND_SPEC.md
PRJ-001_STAGE-07_QA_REPORT.md

---------------------------------------------------------------------

## Artifact Structure (Minimum)

All artifacts must contain:

1. Header
2. Purpose
3. Inputs
4. Output Specification
5. Key Decisions
6. Constraints
7. Open Questions (optional)

---------------------------------------------------------------------

## Example: PRODUCT_SPEC.md

Required sections:

# Product Specification

## Problem
What problem the product solves.

## Target Users
Who the product is for.

## Core Use Cases
Primary scenarios.

## Product Scope
What is included in MVP.

## Out of Scope
Explicitly excluded features.

## Success Criteria
What defines success.

---------------------------------------------------------------------

## Example: UX_FLOW.md

Required sections:

# UX Flow

## User Journeys
Main user flows.

## Screens
List of core screens.

## State Transitions
How the product moves between states.

## Interaction Logic
Rules of interaction.

---------------------------------------------------------------------

## Example: ARCHITECTURE.md

Required sections:

# Architecture

## System Overview
High level architecture.

## Components
Main system components.

## Data Flow
How data moves.

## Mermaid Diagrams
Required visualization format.

---------------------------------------------------------------------

## Example: BACKEND_SPEC.md

Required sections:

# Backend Specification

## Services
Backend services.

## API Endpoints
Endpoint definitions.

## Data Models
Core database structures.

## External Integrations
Third-party services.

---------------------------------------------------------------------

## Example: UI_DESIGN_SPEC.md

Required sections:

# UI Design Specification

## Layout
Screen layouts.

## Component System
UI component definitions.

## Visual Hierarchy
Spacing, typography, hierarchy.

---------------------------------------------------------------------

## Example: FRONTEND_SPEC.md

Required sections:

# Frontend Specification

## Framework
Frontend stack.

## Components
Component structure.

## State Management
Application state handling.

## Integration with Backend
API usage.

---------------------------------------------------------------------

## Example: QA_REPORT.md

Required sections:

# QA Report

## Test Scope
What was tested.

## Test Results
Pass / fail results.

## Known Issues
Remaining bugs.

## Release Readiness
Final QA recommendation.

---------------------------------------------------------------------

## Result

Stage Artifact Standard ensures that every stage in the
AI Software Development Platform produces predictable,
machine-readable, and human-understandable outputs.
