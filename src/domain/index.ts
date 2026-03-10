/**
 * Domain Layer
 * 
 * This module provides the core domain model for the Editor Zen application.
 * It follows Domain-Driven Design principles and is completely persistence-agnostic.
 * 
 * Architecture:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        Presentation Layer                        │
 * │                    (React Components, Pages)                     │
 * └─────────────────────────────────────────────────────────────────┘
 *                                  │
 *                                  ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        Application Layer                         │
 * │              (Use Cases, Application Services)                   │
 * └─────────────────────────────────────────────────────────────────┘
 *                                  │
 *                                  ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                         Domain Layer                             │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
 * │  │  Entities   │  │   Events    │  │  Services   │              │
 * │  │ Note,Folder │  │ NoteCreated │  │ NoteService │              │
 * │  │ Tag, User   │  │ FolderMoved │  │ FolderSvc   │              │
 * │  └─────────────┘  └─────────────┘  └─────────────┘              │
 * │                                                                   │
 * │  ┌─────────────────────────────────────────────────────────────┐ │
 * │  │              Repository Interfaces (Ports)                  │ │
 * │  │    INoteRepository, IFolderRepository, ITagRepository       │ │
 * │  └─────────────────────────────────────────────────────────────┘ │
 * └─────────────────────────────────────────────────────────────────┘
 *                                  │
 *                                  ▼
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                    Infrastructure Layer                          │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
 * │  │  Supabase   │  │   IndexedDB │  │    Neon     │              │
 * │  │   Adapter   │  │   Adapter   │  │   Adapter   │              │
 * │  └─────────────┘  └─────────────┘  └─────────────┘              │
 * │                                                                   │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
 * │  │   Vercel    │  │   AWS S3    │  │   Local     │              │
 * │  │    Blob     │  │   Storage   │  │ Filesystem  │              │
 * │  └─────────────┘  └─────────────┘  └─────────────┘              │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * Supported Persistence Mechanisms:
 * - Databases: Supabase, Neon, PlanetScale, Turso, Prisma (any)
 * - Local Storage: IndexedDB, localStorage, SQLite (via WASM)
 * - File Systems: Vercel Blob, AWS S3, local filesystem
 * - Real-time Sync: Supabase Realtime, Liveblocks, Yjs
 * 
 * Key Design Decisions:
 * 1. Entities are immutable value objects with readonly IDs
 * 2. Branded ID types prevent mixing different entity IDs
 * 3. Repository interfaces define the persistence contract
 * 4. Domain events enable loose coupling and audit trails
 * 5. Unit of Work pattern ensures transactional consistency
 * 6. Result type provides explicit error handling
 */

// Core Entities
export * from './entities';

// Repository Interfaces
export * from './repositories';

// Domain Events
export * from './events';

// Domain Services
export * from './services';
