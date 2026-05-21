# GitHub Copilot Instructions — USYD Class Aquarium

## Project context

This project is a classroom demo web app for a University of Sydney Web Development guest lecture.

The app is called **USYD Class Aquarium**.

It has two main experiences:

1. **Big screen / projector view**
   - Shows a shared animated aquarium.
   - Displays all fish submitted by students.
   - Fish swim in animated water.
   - Each fish shows the creator's name underneath.
   - Shows fish count.
   - Plays a generated bubble/splash sound when a new fish is added.

2. **Student device view**
   - Students open the webpage from their phone or laptop.
   - They enter their name once.
   - Store the username only in browser `localStorage`.
   - Students can create and submit multiple fish.
   - Fish can be created by choosing/coloring a template or by entering a text description.

Always read `docs/PROJECT_BRIEF.md` before creating a plan or implementing large features.

## Tech stack

Use:

- React
- TypeScript
- Vite
- CSS animations
- Azure Static Web Apps
- Azure Static Web Apps API / Azure Functions style backend
- GitHub Actions for CI/CD

Avoid unnecessary dependencies. This is a teaching demo, so code should be simple, readable, and easy to explain.

## Architecture principles

Keep the MVP simple and reliable.

Use this basic architecture:

- React frontend for `/screen`, `/student`, and `/`.
- Lightweight backend API for shared fish state.
- Polling from the screen view every 2 seconds is acceptable.
- Do not use WebSockets for Stage 1 unless explicitly requested.
- Keep all fish rendering and animation simple.
- Use SVG and CSS rather than a heavy game engine.

Use these routes:

- `/` — landing page
- `/screen` — projector aquarium view
- `/student` — student fish creator view

Use default room ID:

```ts
const DEFAULT_ROOM_ID = "usyd-web";