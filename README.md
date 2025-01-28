# Profit and Loss Extractor Frontend
## Tech stack:
- NextJS 14
- Node/NPM
- Shadcn/ui
- Docker

## How to Deploy
Instead of deploying the frontend alone, you should use the given docker-compose.yml file in the root dir where both frontend and backend directories are found. (One level up than this README file) to run both frontend and backend together.

Before deploying, make sure the `.env` file is properly configured in the frontend project root directory.
If you cannot find a `.env` in the root dir, please create one with the following variables.

```.env
# the Base URL of backend API. Make sure you have the same 
# port configured for the backend in the backend .env file
NEXT_PUBLIC_BACKEND_BASE_URL=http://localhost:8000
```

- Once the env is created, go one level up and simply run `docker compose up -d` to run the frontend and backend services
- The frontend app can then be accessed via `http://localhost:3000` (if local), `http://localhost:3001` (if docker).
- You can find the primary README file in the project root, one level up.
