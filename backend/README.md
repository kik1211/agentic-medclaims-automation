# ClaimPilot Backend Architecture

The ClaimPilot backend follows a strict 4-tier layered architecture:

```
HTTP Request
     │
     ▼
[ Controller Layer ] (Extracts params, invokes Service, formats HTTP response)
     │
     ▼
[ Service Layer ]    (Pure business logic; no Express request/response objects)
     │
     ▼
[ Repository Layer ] (Data access logic; no HTTP context)
     │
     ▼
[ Database Layer ]   (SQLite persistence engine)
```

## Directory Structure

- **`config/`**: Typed environment variables and application settings via Zod
- **`controllers/`**: HTTP request handlers
- **`services/`**: Core domain logic and business workflow orchestrators
- **`repositories/`**: Data access abstractions
- **`middleware/`**: Express request validation (`validateRequest`) and global error handling
- **`routes/`**: Route definitions
- **`types/`**: Backend type interfaces
- **`errors/`**: Custom application error classes (`AppError`, `NotFoundError`, etc.)
- **`utils/`**: Shared utilities (Logger, formatting, crypto)
- **`database/`**: Database connections and migrations
- **`schemas/`**: Zod validation schemas
- **`validators/`**: Input validation infrastructure

## Running the Backend

```bash
# Development server (runs on port 5000 with hot reloading)
npm run dev

# Type check
npm run typecheck

# Production build
npm run build
```
