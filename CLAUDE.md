# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Development
- `npm run build` - Build the NestJS application
- `npm run dev` - Start development server with watch mode
- `npm run start` - Start production server
- `npm run start:prod` - Start production server from dist

### Code Quality
- `npm run lint` - Run ESLint with auto-fix on src, apps, libs, test, and prisma directories
- `npm run format` - Format TypeScript files using Prettier

### Testing
- `npm run test` - Run unit tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:cov` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:debug` - Run tests in debug mode

### Database Management
- `npm run migrate:create` - Create a new Prisma migration (dev only)
- `npm run migrate:dev` - Apply migrations in development
- `npm run migrate:deploy` - Deploy migrations in production
- `npx prisma db seed` - Run database seeding

## Project Architecture

### Technology Stack
- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control (RBAC)
- **Documentation**: Swagger/OpenAPI
- **File Storage**: Local filesystem with Sharp for image processing

### Core Architecture

#### Database Schema Structure
The application uses Prisma with a comprehensive schema featuring:
- **Role-based authentication system**: SUPERADMIN, ADMIN, OPERATOR, USER with granular permissions per module (ARTICLE, EVENT, USER, COMMENT)
- **Content management workflow**: Articles and Events follow DRAFT → ON_REVIEW → APPROVED → PUBLISHED status progression
- **Social features**: Following system, threaded comments, reactions (like/dislike/love/clap), bookmarks
- **Analytics tracking**: Visit/visitor analytics with fingerprinting, content statistics
- **User profiles**: Writer profiles with social links, ratings, specializations

#### Module Architecture
- **AuthModule**: JWT authentication with layered guards (Auth → Roles → Permissions)
- **Article/EventModule**: Content management with approval workflow and versioning
- **CommentModule**: Threaded comments with mentions and reactions
- **PhotoContentModule**: Image upload/processing with Sharp
- **ContentStatsModule**: Real-time analytics and metrics
- **ErrorLogModule**: Global error tracking with request context

#### Guard System (Applied Globally)
1. **ThrottlerGuard**: Rate limiting (100 requests/10 seconds)
2. **AuthGuard**: JWT token validation
3. **RolesGuard**: Role-based access control
4. **PermissionsGuard**: Granular permission checking

#### Content Approval Workflow
Articles/Events use a sophisticated approval system:
- Authors create content in DRAFT status
- Content moves to ON_REVIEW when submitted
- Approvers can APPROVE/REJECT with notes
- Only PUBLISHED content appears publicly
- Version history maintained for all changes
- Soft deletion with audit trails

### Key Implementation Details
- **API Versioning**: URI-based versioning enabled
- **CORS**: Configured for specific frontend origin via `process.env.WEB_URI`
- **Trust Proxy**: Enabled for production deployment behind load balancers
- **File System**: Auto-creates `./public/avatar` and `./public/photo` directories on startup
- **Global Error Handling**: All exceptions logged to database with full request context

### Database Backup/Restore (Production)
From README.md production operations:

**Backup Database:**
```bash
docker exec prod_followers_bicara_postgre \
  pg_dump -U followersBicaraDong -d postgres > backup_postgres_followerbicara_$(date +"%Y%m%d").sql
```

**Restore Database:**
```bash
docker exec -i prod_followers_bicara_postgre \
  psql -U followersBicaraDong -d postgres < backup_postgres_followerbicara_20250809.sql
```

**Backup Files:**
```bash
docker run --rm \
  -v prod_volume_api_followers:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/public_files_followersbicara_$(date +"%Y%m%d").tar.gz -C /source .
```