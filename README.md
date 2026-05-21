# USYD Class Aquarium

A classroom-friendly React + TypeScript + Vite demo for a University of Sydney Web Development guest lecture. Students create fish from their own devices and the projector screen shows a shared animated aquarium.

## Run locally

```bash
npm install
npm run dev
```

Open:

- Big screen: <http://localhost:5173/screen>
- Student view: <http://localhost:5173/student>
- Landing page: <http://localhost:5173/>

The default room ID is `usyd-web`. You can test future rooms with `?roomId=demo1`.

## What is included

- `/` landing page with lecturer and student entry points.
- `/screen` projector view with animated water, bubbles, SVG decor, fish count, join URL, sound toggle, and reset button.
- `/student` mobile-friendly creator with localStorage username, template coloring, and procedural description-based fish generation.
- `GET`, `POST`, and `DELETE /api/fishes` Azure Static Web Apps compatible endpoint.
- Local browser fallback mode when the API is unavailable, useful during Vite-only development.
- Stage 2 placeholders for the live-coded Class Goal Unlock feature.

## Deployment to Azure Static Web Apps

1. Create an Azure Static Web App.
2. Link it to this GitHub repository.
3. Add the GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN`.
4. Push to `main`.

The workflow builds the Vite app from `/`, uses `api` for Azure Functions, and deploys `dist`.

## Environment variables

The API works out of the box with an **in-memory** store — perfect for local dev. For deployed classroom use, set up **Azure Table Storage** so fish persist across cold starts and across Functions instances.

| Variable | Required | Purpose |
| --- | --- | --- |
| `AZURE_STORAGE_CONNECTION_STRING` | For persistence | Connection string for the storage account. If unset, the API falls back to in-memory mode. |
| `AQUARIUM_TABLE_NAME` | Optional | Table name. Defaults to `fishes`. |

The storage adapter lives in [api/shared/storage.js](api/shared/storage.js) and exposes `listFishes`, `addFish`, `clearFishes` — the same interface for both backends.

### Configuring Azure Table Storage

1. Create a Storage Account in the Azure Portal (Standard / LRS is fine).
2. Copy a **connection string** from *Security + networking → Access keys*.
3. In your Static Web App: *Configuration → Application settings* → add `AZURE_STORAGE_CONNECTION_STRING`.
4. (Optional) Add `AQUARIUM_TABLE_NAME` if you want a name other than `fishes`. The table is created automatically on first request.

For local dev against real storage, create `api/local.settings.json` (already gitignored by Functions tooling):

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AZURE_STORAGE_CONNECTION_STRING": "UseDevelopmentStorage=true"
  }
}
```

That value uses **Azurite** (the local storage emulator) if you have it running.

## Stage 2 live coding plan

The project intentionally leaves extension points for the live class:

- `ClassGoalProgress.tsx` can become a real goal display such as `Class goal: 13 / 20 fish`.
- `UnlockCreature.tsx` can render a friendly whale or shark animation.
- `clearTankWithWhale()` can trigger a wave animation and clear or refresh the aquarium for the next round.

The procedural generator in `src/services/fishGenerator.ts` also includes a TODO where a future Azure OpenAI image generation service could be integrated.
