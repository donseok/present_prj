# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SI-Doc-Creator (DocuGen) is a document generation system for SI (System Integration) projects. It manages project information and generates documents (DOCX, PPTX, PDF) from templates by replacing placeholders with project data.

## Development Commands

```bash
# Install all dependencies (root, client, server)
npm run install:all

# Run both client and server in development mode
npm run dev

# Run client only (Vite dev server on port 5173)
npm run dev:client

# Run server only (Express API on port 4000)
npm run dev:server

# Build for production
npm run build

# Lint
cd client && npm run lint
cd server && npm run lint
```

## Architecture

### Monorepo Structure
- **Root**: Orchestrates client/server with concurrently
- **client/**: React 18 + Vite + TypeScript + Tailwind CSS frontend
- **server/**: Express + TypeScript backend API

### Data Flow
```
Client (React) → REST API → DataStore (JSON file) → Document Generators
```

### Server Architecture (`server/src/`)
- **index.ts**: Express app entry, mounts routes at `/api/*`
- **routes/**: REST endpoints
  - `projects.ts`: CRUD for projects (`/api/projects`)
  - `templates.ts`: Template upload/list/delete (`/api/templates`)
  - `documents.ts`: Document generation (`/api/documents/generate`)
- **services/**:
  - `dataStore.ts`: JSON file-based persistence (`data/store.json`)
  - `templateParser.ts`: Extracts `{{placeholder}}` patterns from DOCX/PPTX
- **generators/**: Document generation using JSZip
  - `docx/generator.ts`: Processes word/document.xml, headers, footers
  - `pptx/generator.ts`: Processes slides, layouts, masters
  - `pdf/generator.ts`: Generates PDF using PDFKit

### Client Architecture (`client/src/`)
- **App.tsx**: React Router with protected routes and authentication
- **contexts/AuthContext.tsx**: Authentication state management (sessionStorage-based)
- **pages/**: Route components (LoginPage, HomePage, ProjectsPage, ProjectFormPage, TemplatesPage, GeneratePage)
- **components/**: Shared UI (Layout)
- **types/**: TypeScript interfaces (shared with server)

### Authentication
- Client-side authentication using React Context
- Default credentials: `admin` / `admin123`
- Session persisted in sessionStorage
- All routes except `/login` are protected

### Template Placeholder System
Templates use `{{placeholder}}` syntax. Supported placeholders:
- Basic: `{{프로젝트명}}`, `{{고객사}}`, `{{설명}}`, `{{범위}}`, `{{시작일}}`, `{{종료일}}`, `{{상태}}`
- Counts: `{{팀원수}}`, `{{마일스톤수}}`
- Lists: `{{팀원목록}}`, `{{마일스톤목록}}`

### Key Data Types
```typescript
interface Project {
  id, name, client, description, scope
  startDate, endDate, status
  team: TeamMember[]
  milestones: Milestone[]
  requirements: { functional, nonFunctional }
}

interface Template {
  id, name, documentType
  format: 'docx' | 'pptx'
  filePath, placeholders[]
}
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List all projects |
| GET | /api/projects/:id | Get project by ID |
| POST | /api/projects | Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| GET | /api/templates | List all templates |
| POST | /api/templates/upload | Upload template (multipart) |
| DELETE | /api/templates/:id | Delete template |
| POST | /api/documents/generate | Generate document |
| POST | /api/documents/generate-pdf | Generate PDF |
| GET | /api/health | Health check |

## Important Implementation Details

- Templates stored in `templates/uploads/` directory
- Data persisted to `data/store.json` (auto-created if missing)
- Document generation works by unzipping Office files, replacing placeholders in XML, re-zipping
- Server uses ES modules (`.js` extensions required in imports)
- PDF generator uses built-in Helvetica font (Korean text may not render properly)
