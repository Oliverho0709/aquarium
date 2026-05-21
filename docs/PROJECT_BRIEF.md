Project name:
USYD Class Aquarium

Project goal:
Build a simple online interactive classroom web app for a guest lecture on Web Development. The app has two sides:

1. Big screen / projector view
   - Shows a beautiful animated aquarium.
   - Displays all fish submitted by students.
   - Fish swim around in the water.
   - Each fish shows the creator’s name underneath.
   - Shows a live fish count.
   - Plays a short bubble / splash sound when a new fish is added.
   - Shows a QR code / join link for students.

2. Student device view
   - Students open the webpage on their phone or laptop.
   - First time they open it, they must enter their name.
   - Store only the username in browser localStorage.
   - Students can keep adding multiple fish.
   - They can create fish in two ways:
     A. Pick a fish template and color it in.
     B. Type a text description and generate an AI-style fish.
   - After submission, their fish appears in the shared aquarium on the projector screen.

Important:
This should be a classroom-friendly MVP. Keep it simple, reliable, visually fun, and easy to extend during the live class.

Core user experience:
- Lecturer opens /screen on the projector.
- Students scan QR code or open /student.
- Student enters name once.
- Student creates a fish.
- Fish appears in the classroom aquarium.
- The aquarium animates water, bubbles, and swimming fish.
- Big screen shows fish count.
- When a new fish appears, a short generated sound effect plays.

Recommended tech stack:
- React + TypeScript + Vite
- CSS animations, no heavy game engine
- Use SVG assets generated inside the project
- Azure Static Web Apps for deployment
- Azure Static Web Apps API / Azure Functions for lightweight backend
- Use Azure Table Storage or a simple JSON-like storage adapter for shared fish state
- If backend storage is not configured, provide a local demo fallback mode

Routes:
- /               Landing page with two buttons: "Open Big Screen" and "Join as Student"
- /screen         Projector aquarium view
- /student        Student fish creation view

Data model:
Fish:
{
  id: string;
  roomId: string;
  creatorName: string;
  fishName: string;
  creationMode: "template" | "description";
  templateId?: string;
  description?: string;
  svgMarkup?: string;
  bodyColor?: string;
  finColor?: string;
  tailColor?: string;
  patternColor?: string;
  createdAt: string;
}

Room:
{
  roomId: string;
  fishCount: number;
}

Username:
- Store only in localStorage on student device.
- localStorage key: usyd-aquarium-username
- Do not require login.
- Do not store any sensitive personal data.

Screen view requirements:
- The /screen page should be optimized for large projector display.
- Show title: "USYD Class Aquarium"
- Show subtitle: "Create a fish from your device and watch it join the aquarium"
- Show QR code or at least a large join URL.
- Show fish count: "Fish in tank: X"
- Show animated water background.
- Show bubbles rising.
- Show seaweed / coral / rocks as decorative SVG assets.
- Fish should swim using simple animation:
  - random x/y position
  - random speed
  - random direction
  - flip horizontally when changing direction
  - keep fish inside aquarium bounds
- Each fish should show creatorName underneath in a small readable label.
- When a new fish is detected, play a short bubble / splash sound.
- Because browser autoplay may block sound, include an "Enable Sound" button on the screen view.

Student view requirements:
- If no username exists in localStorage, show name entry screen.
- After name is entered, show fish creation interface.
- Student can create multiple fish without re-entering their name.
- Show two tabs:
  1. Color a Fish
  2. Describe a Fish

Color a Fish tab:
- Provide several generated SVG fish templates:
  1. Classic fish
  2. Round puffer fish
  3. Long speedy fish
  4. Angelfish
- Student can choose a template.
- Student can choose colors:
  - body color
  - fin color
  - tail color
  - pattern color
- Student enters fish name.
- Show live preview.
- Submit button: "Release Fish into Aquarium"

Describe a Fish tab:
- Student enters fish name.
- Student enters text description.
- Button: "Generate Fish"
- For MVP, implement this as a local procedural SVG generator based on the description, not a real paid image-generation service.
- The generator should look for keywords and create a fun SVG fish:
  - "robot" → metallic body, circuit pattern
  - "rainbow" → rainbow stripes
  - "shark" → grey sharp-looking fish, but still friendly
  - "gold" → golden fish
  - "github" → dark fish with small code/cat-inspired pattern, but avoid using trademarked logos directly
  - "cloud" → blue/white soft fish
  - "fire" → red/orange fish
  - "ice" → blue/cyan fish
  - "dragon" → spiky fins
  - "sleepy" → closed eyes
  - "happy" → smiling face
- Keep the function modular:
  generateFishFromDescription(description: string): GeneratedFishSvg
- Add TODO comments showing where a real Azure OpenAI image generation service could be integrated later.

Sample text descriptions to include in the UI:
- "a rainbow fish with tiny wings"
- "a sleepy cloud fish made of soft blue light"
- "a cyberpunk robot fish with glowing fins"
- "a golden fish that looks very confident"
- "a dragon fish with red scales and spiky fins"
- "a tiny GitHub Copilot-inspired coding fish"
- "an ice fish with crystal fins"
- "a funny fish wearing sunglasses"
- "a friendly shark pretending to be a student"
- "a magical fish from Sydney Harbour"

Design style:
- Fun, playful, modern classroom demo style.
- Use bright but not overwhelming colors.
- Aquarium should feel alive.
- Use CSS gradients, animated bubbles, seaweed, coral, rocks, light rays.
- Fish should be cute, not realistic.
- Mobile UI should be simple and touch-friendly.
- Big screen UI should be readable from the back of a classroom.

Generated assets:
Please create all assets inside the project. Do not require external image downloads.

Assets to generate:
- SVG aquarium background elements:
  - coral
  - seaweed
  - rocks
  - bubbles
  - light rays
- SVG fish templates:
  - classic fish
  - puffer fish
  - long fish
  - angelfish
- Procedural AI-style fish SVG generator
- Sound effect:
  - Use Web Audio API to generate a short bubble / splash sound.
  - Do not require an external mp3 file.
  - Create function playFishAddedSound().
  - Sound should be short, light, and classroom-friendly.

Backend / shared state:
The app needs shared state because fish submitted from student devices must appear on the projector screen.

Keep it simple:
- Create API endpoints:
  - GET /api/fishes?roomId=default
  - POST /api/fishes
  - DELETE /api/fishes?roomId=default   // optional reset button for lecturer
- Store fish records using a storage adapter.
- Provide two storage implementations:
  1. Local in-memory / local JSON fallback for development
  2. Azure Table Storage adapter for deployed classroom use
- Keep the adapter interface simple:
  - listFishes(roomId)
  - addFish(fish)
  - clearFishes(roomId)
- Projector screen can poll GET /api/fishes every 2 seconds. WebSocket is not required for MVP.
- Avoid overengineering real-time infrastructure.

Room behavior:
- Default roomId: usyd-web
- /screen uses roomId=usyd-web by default
- /student uses roomId=usyd-web by default
- Allow roomId query parameter for future use:
  /screen?roomId=demo1
  /student?roomId=demo1

Stage 2 live classroom extension:
During the actual class, we will implement an additional feature live with GitHub Copilot:

Feature name:
Class Goal Unlock

Description:
- The class has a goal to fill the aquarium with enough fish.
- Example goal: 20 fish.
- The screen view shows progress:
  "Class goal: 13 / 20 fish"
- When the goal is reached, unlock a special sea creature:
  - shark or whale
- The shark/whale swims across the screen.
- It "clears up" or "refreshes" the fish tank in a playful way.
- It should not feel violent.
- Suggested animation:
  - A whale swims slowly across the tank.
  - A wave animation appears.
  - Existing fish gently swim away / fade out / reposition.
  - The tank becomes "clean" and ready for the next round.
- Add TODO comments and placeholder components for this stage:
  - ClassGoalProgress.tsx
  - UnlockCreature.tsx
  - clearTankWithWhale()
- Do not fully implement this in Stage 1. Leave it ready for live coding.

Components suggested:
src/
  App.tsx
  main.tsx
  routes/
    LandingPage.tsx
    ScreenPage.tsx
    StudentPage.tsx
  components/
    Aquarium.tsx
    SwimmingFish.tsx
    FishLabel.tsx
    BubbleLayer.tsx
    AquariumDecor.tsx
    FishCount.tsx
    JoinQRCode.tsx
    NameEntry.tsx
    FishCreator.tsx
    FishTemplatePicker.tsx
    FishColorCustomizer.tsx
    FishPreview.tsx
    DescriptionFishGenerator.tsx
    SoundToggle.tsx
    ClassGoalProgress.tsx      // Stage 2 placeholder
    UnlockCreature.tsx         // Stage 2 placeholder
  services/
    fishApi.ts
    fishGenerator.ts
    soundEffects.ts
    storageAdapter.ts
  assets/
    fishTemplates.ts
    aquariumAssets.ts
  styles/
    aquarium.css
    student.css

API suggested:
api/
  fishes/
    index.ts

If using Azure Static Web Apps API, create Azure Functions-compatible endpoints.

CI/CD:
Provide GitHub Actions workflow for Azure Static Web Apps deployment.

Create:
.github/workflows/azure-static-web-apps.yml

The workflow should:
- Trigger on push to main
- Trigger on pull_request to main
- Build the Vite React app
- Deploy to Azure Static Web Apps
- Use secret:
  AZURE_STATIC_WEB_APPS_API_TOKEN

Suggested workflow structure:
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - main

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || github.event.action != 'closed'
    runs-on: ubuntu-latest
    name: Build and Deploy
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: true
          lfs: false

      - name: Build And Deploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: upload
          app_location: "/"
          api_location: "api"
          output_location: "dist"

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request
    steps:
      - name: Close Pull Request
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: close

Project setup:
- Use npm.
- Provide package.json scripts:
  - dev
  - build
  - preview
  - lint if easy
- Provide README.md with:
  - project description
  - how to run locally
  - how to deploy to Azure Static Web Apps
  - how to open screen view
  - how students join
  - environment variables
  - Stage 2 live coding plan

README should include:
Local run:
npm install
npm run dev

Open:
http://localhost:5173/screen
http://localhost:5173/student

Deployment:
- Create Azure Static Web App
- Link to GitHub repo
- Add AZURE_STATIC_WEB_APPS_API_TOKEN secret
- Configure storage connection string if using Azure Table Storage
- Push to main

Quality expectations:
- Code should be simple, readable, and suitable for teaching.
- Avoid unnecessary libraries.
- Keep the MVP reliable.
- Add comments explaining important web development concepts:
  - component state
  - props
  - API calls
  - localStorage
  - polling
  - CSS animation
  - client/server boundary
- Make the UI visually impressive enough for a classroom projector.
- Ensure mobile layout works well.
- Add graceful error states:
  - backend unavailable
  - failed to submit fish
  - no fish yet
  - sound not enabled
- Add reset tank button on /screen for lecturer.

Important constraints:
- Do not use external image files.
- Do not require login.
- Do not store sensitive data.
- Store username only in localStorage.
- Use backend only for shared fish objects so the projector can show submissions.
- Make AI fish generation work without paid AI service by using procedural SVG generation.
- Keep real Azure AI image generation as a future extension point, not required for MVP.
- Make Stage 2 easy to implement live during class.