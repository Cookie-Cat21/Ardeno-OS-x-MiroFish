# Ardeno OS x MiroFish: Integration Guide (2026)

This document provides a comprehensive overview of the integration between Ardeno OS and the MiroFish Parallel Agency Society.

## 1. System Architecture
The integration is structured into two core loops:
1.  **Strategic Foresight (Phase 3):** Simulates future scenarios among 300+ agents via a the Swarm Intelligence hub.
2.  **Autonomous Execution (Phase 4):** Enables departments (Commercial, Design, Dev, etc.) to perform real-world tasks through an orchestrated workflow.

## 2. Persistence Layer (PostgreSQL/Supabase)
All agents and memories are stored for cross-simulation persistence:
- **`agents`:** Central registry of the 2026 workforce, including personality embeddings and departmental biases.
- **`memories`:** A `pgvector`-based storage system for "Cognitive RAG," allowing agents to remember past outcomes.

## 3. Core Agency Services
- **`DirectorService`:** Analyzes high-level goals and breaks them into actionable departmental tickets.
- **`WorkflowEngine`:** A state machine managing asynchronous tasks and inter-departmental dependencies.
- **`CostGuard`:** Monitors token usage and enforces USD budgets per department and per day.

## 4. Operational Frontend
In **PredictionEngine.tsx**, you have access to:
- **Mission Hub:** Deploy multi-departmental goals (e.g., "Scale the analytics dashboard for Sri Lankan markets").
- **Project Board:** Real-time Kanban view of your agents' labor status.
- **Foresight Inbox:** Asynchronous signals intercepted by your "Commercial & Research" scouts.

---

*Compiled by Antigravity for Ardeno OS, March 2026.*
