# Block-Train API Endpoints

This document lists all available endpoints in the Express backend for testing purposes.

## Active Blocks (`/api/active_blocks`)
- `GET /api/active_blocks` - Fetch all active maintenance blocks.
- `POST /api/active_blocks` - Create a new maintenance block (used by Chatbot/Dashboard).
- `DELETE /api/active_blocks/:id` - Cancel an existing maintenance block.

## AI (`/api/ai`)
- `POST /api/ai/analyze` - Analyze railway telemetry or data using the Groq AI model.

## Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new admin/user.
- `POST /api/auth/login` - Login and receive a JWT.

## Dispatch / Twilio (`/api/dispatch`)
- `POST /api/dispatch/notify` - Triggers Twilio text-to-speech voice calls and SMS to workers.
- `POST /api/dispatch/audio` - Upload a custom recorded audio file (returns a public URL for Twilio to play).

## Incidents (`/api/incidents`)
- `POST /api/incidents/` - Report a new railway incident.
- `GET /api/incidents/:id/impact` - Get the blast radius / delay impact of a specific incident.
- `GET /api/incidents/:id/advisory` - Get AI-generated advisory steps to mitigate an incident.

## Network (`/api/network`)
- `GET /api/network/` - Fetch railway network topology.

## Optimization (`/api/optimization`)
- `POST /api/optimization/priority` - Set optimization priorities for routing.
- `POST /api/optimization/baseline` - Fetch baseline metrics.
- `POST /api/optimization/optimize` - Run the pathfinding and traffic optimization algorithm.

## Plans (`/api/plans`)
- `GET /api/plans/weekly` - Fetch the weekly maintenance plan.
- `GET /api/plans/monthly` - Fetch the monthly maintenance plan.
- `GET /api/plans/comparison` - Compare maintenance plans.
- `POST /api/plans/:id/approve` - Approve a proposed maintenance plan.
- `POST /api/plans/:id/reject` - Reject a proposed maintenance plan.

## Tasks (`/api/tasks`)
*(Note: Requires department-level authorization middleware)*
- `GET /api/tasks/` - List all tasks for the department.
- `GET /api/tasks/:id` - Get details of a specific task.
- `POST /api/tasks/` - Create a new task.
- `PATCH /api/tasks/:id` - Update task details.
- `PATCH /api/tasks/:taskId/status` - Update task status (e.g., pending -> completed).
- `DELETE /api/tasks/:id` - Delete a task.

## Tracks (`/api/tracks`)
- `GET /api/tracks/` - Get all track sections.
- `GET /api/tracks/:sectionId` - Get details of a specific track section.

## Workers (`/api/workers`)
- `GET /api/workers/` - List all workers in the directory.
- `POST /api/workers/` - Add a new worker.
- `DELETE /api/workers/:id` - Remove a worker from the directory.
