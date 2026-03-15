# Orchestrator State Model

Version: 1.0
Status: ACTIVE
Layer: Platform Control Layer

---------------------------------------------------------------------

## Purpose

The Orchestrator State Model defines how the platform tracks
the lifecycle of software projects across the AI development pipeline.

This model is independent from Git repositories.

GitHub stores code and canonical documents.

The orchestrator stores project state.

---------------------------------------------------------------------

## Core Principle

Project state must be explicit and queryable.

The orchestrator must always know:

- which stage is active
- which artifacts exist
- which gates have passed
- which stage is next

---------------------------------------------------------------------

## Core Entity: ProjectState

Minimal canonical structure:

project_id
current_stage
status
last_completed_stage
next_stage
current_artifact
gate_state
history

---------------------------------------------------------------------

## Field Definitions

### project_id

Unique identifier for the project.

Example:

PRJ-001

---------------------------------------------------------------------

### current_stage

Active stage of the pipeline.

Examples:

STAGE-01-PRODUCT
STAGE-02-UX
STAGE-03-ARCH
STAGE-04-BACKEND
STAGE-05-UI
STAGE-06-FRONTEND
STAGE-07-QA

---------------------------------------------------------------------

### status

Project execution state.

Allowed values:

generated
validated
approved
ready_to_apply
applied_locally
committed
pushed_to_github

---------------------------------------------------------------------

### last_completed_stage

The most recent stage that passed the gate.

Example:

STAGE-02-UX

---------------------------------------------------------------------

### next_stage

The stage that should run next.

Example:

STAGE-03-ARCH

---------------------------------------------------------------------

### current_artifact

Reference to the artifact produced by the current stage.

Example:

PRJ-001_STAGE-02_UX_FLOW.md

---------------------------------------------------------------------

### gate_state

Gate decision for the current stage.

Allowed values:

pending
validated
approved
rejected

---------------------------------------------------------------------

### history

Chronological log of stage transitions.

Example entry:

STAGE-01-PRODUCT -> approved -> artifact created

---------------------------------------------------------------------

## Example State Object

Example representation:

project_id: PRJ-001
current_stage: STAGE-03-ARCH
status: validated
last_completed_stage: STAGE-02-UX
next_stage: STAGE-04-BACKEND
current_artifact: PRJ-001_STAGE-03_ARCHITECTURE.md
gate_state: pending

---------------------------------------------------------------------

## Role of the Orchestrator

The orchestrator:

- reads ProjectState
- determines allowed transitions
- launches stage agents
- updates state after validation and gates

The orchestrator does not store code.

---------------------------------------------------------------------

## Result

The Orchestrator State Model enables deterministic
control of the AI Software Development Platform pipeline.
