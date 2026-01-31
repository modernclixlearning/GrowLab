# Cannabis Growing App
## Technical Planning & Development Documentation

**Full-Stack TypeScript with TanStack Start**

Version 1.0 | January 30, 2026

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Application Overview](#application-overview)
3. [Technical Stack & Requirements](#technical-stack--requirements)
4. [Application Pages & Features](#application-pages--features)
5. [Database Schema Design](#database-schema-design)
6. [API Architecture](#api-architecture)
7. [State Management Strategy](#state-management-strategy)
8. [Authentication & Authorization](#authentication--authorization)
9. [Development Phases & Timeline](#development-phases--timeline)
10. [Deployment Strategy](#deployment-strategy)

---

## 1. Executive Summary

The Cannabis Growing App is a comprehensive full-stack web application designed to help growers manage their cannabis cultivation from seed to harvest. Built with TypeScript and TanStack Start, the application provides an intuitive interface for tracking plant growth stages, managing care schedules, monitoring environmental conditions, and receiving automated reminders for watering, feeding, and other maintenance tasks.

This document outlines the complete technical architecture, feature specifications, and development roadmap for building a production-ready application that serves both hobbyist and professional cannabis cultivators.

### Key Features

- Multi-plant garden management with visual progress tracking
- Automated care schedules with smart reminders
- Growth stage tracking (Seedling, Vegetative, Flowering)
- Strain-specific care profiles and recommendations
- Photo documentation with timeline visualization
- Environmental monitoring (light, humidity, temperature)
- Nutrient scheduling and feeding line management

---

## 2. Application Overview

The application follows a modern full-stack architecture using TypeScript throughout the entire codebase. TanStack Start provides the foundation for both the frontend and backend, enabling seamless data flow and type safety from database to UI.

### Target Users

- Home hobbyist growers managing 1-10 plants
- Small-scale commercial growers with multiple grow rooms
- Medical cannabis patients tracking their personal gardens

### Design Philosophy

The app embraces a clean, modern aesthetic with a botanical green color palette (`#1a4d2e`, `#2d5f3a`, `#3d7245`). The interface prioritizes clarity and ease of use while providing powerful features for advanced users. Mobile-first responsive design ensures the app works seamlessly on phones, tablets, and desktops.

---

## 3. Technical Stack & Requirements

### Core Technologies

| Layer | Technology |
|-------|-----------|
| **Framework** | TanStack Start (React-based full-stack framework) |
| **Language** | TypeScript 5.3+ |
| **Database** | PostgreSQL 15+ with Drizzle ORM |
| **Styling** | Tailwind CSS with custom theme |
| **State Management** | TanStack Query + React Context |
| **Validation** | Zod for schema validation |
| **Testing** | Vitest + Testing Library + Playwright |

### Additional Dependencies

- **@tanstack/react-query** - Server state management
- **zod** - Runtime type validation
- **date-fns** - Date manipulation and formatting
- **recharts** - Data visualization and growth charts
- **react-hook-form** - Form state management
- **lucide-react** - Icon library
- **clsx / tailwind-merge** - Conditional styling utilities
- **jose** - JWT operations for authentication
- **bcrypt** - Password hashing
- **sharp** - Image processing and optimization

### Development Requirements

- Node.js 20+ LTS
- pnpm 8+ (recommended package manager)
- PostgreSQL 15+ or compatible database
- TypeScript 5.3+

---

## 4. Application Pages & Features

### 4.1 Grower Dashboard

The dashboard serves as the central hub for all growing activities. It provides an at-a-glance overview of garden health, upcoming tasks, and critical alerts.

#### Key Components

**Garden Statistics Cards**
- Total plant count with growth trend indicator
- Current dominant growth stage with days remaining
- Active alerts and warnings badge

**Watering Schedule Section**
- Horizontal scrollable cards showing upcoming waterings
- Plant thumbnail, name, water amount, and timing
- Quick action buttons: DONE (mark complete) and PENDING
- Visual indicators for overdue waterings

**Individual Plant Care Cards**
- Plant photo with health status badge (Optimal, Thirsty, Alert)
- Light cycle display (e.g., 18/6 Cycle)
- Current environmental readings (temperature, humidity)
- Tap to view detailed plant profile

**Fertilization Reminders**
- Nutrient alert cards with specific recommendations
- Feeding schedule based on growth stage
- SNOOZE and LOG FEED action buttons

#### Technical Implementation

- **Route:** `/dashboard`
- **Component:** `DashboardPage.tsx`
- **Data fetching:** useQuery hooks for dashboard stats, watering schedule, and alerts
- **Real-time updates:** WebSocket connection for live plant status changes
- **Responsive grid layout using Tailwind CSS grid system**

---

### 4.2 Add Plant - Step 1: Basic Identity

The first step in adding a new plant focuses on establishing basic identification information. This creates the foundational record for tracking throughout the plant's lifecycle.

#### Form Fields

**Plant Profile Photo**
- Large dashed border upload area with plant icon
- Camera icon button for mobile photo capture
- Image preview with crop/edit functionality
- Recommended: 1:1 aspect ratio, minimum 400x400px

**Plant Name**
- Text input with example placeholder (e.g., "OG Kush #1")
- Validation: Required, 1-50 characters
- Auto-suggest previous naming patterns

**Strain Type**
- Dropdown select with searchable options
- Categories: Indica, Sativa, Hybrid, Auto-flowering
- Add custom strain option for unlisted varieties

#### Technical Implementation

- **Route:** `/plants/add/basic`
- **Component:** `AddPlantBasic.tsx`
- **Form library:** react-hook-form with zod validation
- **Image upload:** Client-side resize, compress to WebP, store temporarily
- **Progress indicator:** 1/3 steps with visual progress bar
- **Navigation:** Continue to Step 2 button (validates before proceeding)

---

### 4.3 Add Plant - Step 2: Growth Stage

This step determines the current developmental phase of the plant, which directly influences care requirements, nutrient schedules, and projected harvest timelines.

#### Stage Selection Cards

**Seedling**
- Icon: Small seedling plant graphic
- Description: First leaves & early growth
- Typical duration: 2-3 weeks

**Vegetative**
- Icon: Leafy growth plant graphic
- Description: Leafy growth & stem development
- Typical duration: 4-8 weeks

**Flowering**
- Icon: Flowering bud graphic
- Description: Bud formation & ripening
- Typical duration: 8-12 weeks

#### Start Date Configuration

- Date picker for stage start date
- Default: Today's date
- Helper text: "This helps us calculate the plant's total age"
- Visual timeline showing growth phase illustrations

#### Technical Implementation

- **Route:** `/plants/add/stage`
- **Component:** `AddPlantStage.tsx`
- **Radio button card selection with visual feedback**
- **Date calculation:** Compute plant age from selected date
- **Stage-specific defaults:** Pre-populate care settings based on selection

---

### 4.4 Add Plant - Step 3: Care Setup

The final configuration step establishes automated care schedules that will drive reminders and tracking throughout the plant's growth cycle.

#### Watering Configuration

**Watering Frequency**
- Dropdown: Every 1-7 days
- Smart defaults based on growth stage
- Option for custom intervals

**Automatic Reminders**
- Toggle switch for push notifications
- Time preference selector

#### Light Cycle Selection

- Preset options:
  - 18/6 (vegetative standard)
  - 12/12 (flowering standard)
  - 24/0 (auto-flowering)
- Visual indicators showing day/night split
- Helper text explaining optimal cycles per strain type

#### Nutrient Schedule

**Feeding Line**
- Dropdown: Standard, Custom Schedule, No Nutrients
- Popular nutrient brands as quick-select options

**Feed Frequency**
- Options: Every watering, Every other watering, Weekly, Custom

#### Technical Implementation

- **Route:** `/plants/add/care`
- **Component:** `AddPlantCare.tsx`
- **Schedule generation:** Create recurring tasks in database
- **Notification setup:** Register device for push notifications
- **Final submission:** POST `/api/plants` with complete plant data
- **Success redirect:** Navigate to new plant detail page

---

### 4.5 Garden View List

The garden view provides a comprehensive list of all plants with powerful filtering and sorting capabilities. It serves as the primary navigation hub for accessing individual plant details.

#### List Features

**Search Bar**
- Real-time search across plant names and strain types
- Magnifying glass icon with placeholder: "Search your plants..."

**Stage Filter Pills**
- Horizontal scrollable filter chips
- Options: All, Seedling, Veg, Flower, Cure
- Active filter highlighted in green

**Plant Cards**
- Large thumbnail image (left side)
- Plant name and strain type
- Growth stage badge with day counter
- Health status indicator (Thriving, Needs Water, Check PH, Alert)
- Tap anywhere to view plant details

**Floating Action Button**
- Fixed position bottom-right
- Plus icon to add new plant
- Prominent green color for visibility

#### Technical Implementation

- **Route:** `/garden`
- **Component:** `GardenList.tsx`
- **Data fetching:** GET `/api/plants` with query params for filtering
- **Virtualization:** Use `@tanstack/react-virtual` for performance with large lists
- **Infinite scroll:** Load more plants as user scrolls
- **Empty state:** Friendly message with call-to-action when no plants exist

---

### 4.6 Plant Details View

The plant details page provides comprehensive information about an individual plant, including real-time health metrics, growth progress, and care history.

#### Page Structure

**Hero Section**
- Full-width high-quality plant image
- Image carousel if multiple photos exist
- Back button to return to garden list

**Plant Info Header**
- Plant name and strain badge
- Age, stage, and health status in stat cards
- Current week in stage (e.g., "Week 5 of 9")

**Quick Actions**
- Three prominent action buttons:
  - **WATER** - Log watering event
  - **PHOTO** - Add progress photo
  - **FEED** - Log nutrient feeding

**Growth Progress Chart**
- Bar chart showing weekly growth measurements
- Week labels on x-axis
- Height in centimeters or inches on y-axis
- Growth delta indicator ("+4.2 inches this week")

**Care Requirements Panel**
- Three column grid displaying optimal ranges:
  - **Light:** Current cycle (12/12) vs. target
  - **Humidity:** Current % with color-coded status
  - **Temperature:** Current reading in °F/°C
- Edit targets button to customize ranges

#### Technical Implementation

- **Route:** `/plants/:plantId`
- **Component:** `PlantDetail.tsx`
- **Data fetching:** GET `/api/plants/:id` with nested growth_logs
- **Chart library:** Recharts with responsive configuration
- **Image optimization:** Next-gen formats (WebP/AVIF) with lazy loading
- **Action modals:** Slide-up panels for logging care events

---

## 5. Database Schema Design

The database schema is designed using Drizzle ORM with PostgreSQL, providing type-safe database operations throughout the application.

### Core Tables

#### users
User accounts with authentication credentials.

**Fields:**
- `id` (UUID, Primary Key)
- `email` (VARCHAR, Unique, Not Null)
- `password_hash` (VARCHAR, Not Null)
- `name` (VARCHAR)
- `subscription_tier` (ENUM: 'free', 'premium')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### plants
Individual plant records.

**Fields:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users.id)
- `name` (VARCHAR, Not Null)
- `strain_type` (ENUM: 'indica', 'sativa', 'hybrid', 'auto')
- `growth_stage` (ENUM: 'seedling', 'vegetative', 'flowering', 'curing')
- `stage_start_date` (DATE, Not Null)
- `health_status` (ENUM: 'optimal', 'needs_attention', 'alert')
- `photo_url` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### care_logs
Care events history.

**Fields:**
- `id` (UUID, Primary Key)
- `plant_id` (UUID, Foreign Key → plants.id)
- `log_type` (ENUM: 'water', 'feed', 'photo', 'note')
- `amount` (DECIMAL, Nullable)
- `unit` (VARCHAR, Nullable)
- `notes` (TEXT, Nullable)
- `logged_at` (TIMESTAMP)

#### growth_logs
Weekly growth measurements.

**Fields:**
- `id` (UUID, Primary Key)
- `plant_id` (UUID, Foreign Key → plants.id)
- `height_cm` (DECIMAL)
- `week_number` (INTEGER)
- `notes` (TEXT, Nullable)
- `measured_at` (TIMESTAMP)

#### schedules
Automated care schedules.

**Fields:**
- `id` (UUID, Primary Key)
- `plant_id` (UUID, Foreign Key → plants.id)
- `schedule_type` (ENUM: 'water', 'feed')
- `frequency_days` (INTEGER)
- `last_completed_at` (TIMESTAMP, Nullable)
- `next_due_at` (TIMESTAMP)
- `is_active` (BOOLEAN, Default: true)

#### plant_photos
Progress photo gallery.

**Fields:**
- `id` (UUID, Primary Key)
- `plant_id` (UUID, Foreign Key → plants.id)
- `photo_url` (VARCHAR, Not Null)
- `thumbnail_url` (VARCHAR)
- `caption` (TEXT, Nullable)
- `taken_at` (TIMESTAMP)

#### environment_logs
Environmental readings.

**Fields:**
- `id` (UUID, Primary Key)
- `plant_id` (UUID, Foreign Key → plants.id)
- `temperature_f` (DECIMAL)
- `humidity_percent` (DECIMAL)
- `light_hours` (DECIMAL)
- `recorded_at` (TIMESTAMP)

### Table Relationships

- **users → plants** (one-to-many): A user can own multiple plants
- **plants → care_logs** (one-to-many): Each plant has many care events
- **plants → growth_logs** (one-to-many): Track growth measurements over time
- **plants → plant_photos** (one-to-many): Multiple photos per plant
- **plants → schedules** (one-to-many): Automated care schedules
- **plants → environment_logs** (one-to-many): Environmental readings

---

## 6. API Architecture

The API follows RESTful conventions and leverages TanStack Start's server functions for type-safe client-server communication.

### Endpoint Structure

#### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create new user account |
| POST | `/api/auth/login` | Authenticate user, return JWT |
| POST | `/api/auth/logout` | Invalidate session |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user profile |

#### Plant Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/plants` | List user's plants with optional filters |
| POST | `/api/plants` | Create new plant |
| GET | `/api/plants/:id` | Get single plant with related data |
| PATCH | `/api/plants/:id` | Update plant details |
| DELETE | `/api/plants/:id` | Delete plant (soft delete) |

#### Care Logging Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/plants/:id/logs` | Log care event (water/feed/note) |
| GET | `/api/plants/:id/logs` | Get care history for plant |
| POST | `/api/plants/:id/photos` | Upload plant photo |
| GET | `/api/plants/:id/photos` | Get photo gallery |

#### Schedule Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedules` | Get all active schedules for user |
| POST | `/api/schedules/:id/complete` | Mark schedule item as completed |
| PATCH | `/api/schedules/:id` | Update schedule configuration |

#### Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Get garden statistics |
| GET | `/api/dashboard/alerts` | Get urgent care alerts |
| GET | `/api/dashboard/upcoming` | Get upcoming care tasks |

### Authentication Flow

1. Client sends credentials to POST `/api/auth/login`
2. Server validates credentials against database
3. JWT token generated and returned with httpOnly cookie
4. Subsequent requests include token automatically
5. Middleware validates token on protected routes

### Error Handling

All API responses follow a consistent error format with appropriate HTTP status codes:

- **200 OK** - Successful request
- **201 Created** - Resource successfully created
- **400 Bad Request** - Validation errors
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource does not exist
- **500 Internal Server Error** - Unexpected server error

**Error Response Format:**
```typescript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Human-readable error message",
    fields?: {
      fieldName: ["Field-specific error message"]
    }
  }
}
```

---

## 7. State Management Strategy

The application uses a combination of TanStack Query for server state and React Context for UI state management.

### Server State (TanStack Query)

All data fetched from the API is managed through TanStack Query, providing automatic caching, refetching, and synchronization.

- **Queries:** `useQuery` for reading data (plants, schedules, care logs)
- **Mutations:** `useMutation` for creating/updating/deleting resources
- **Optimistic updates:** Immediate UI feedback before server confirmation
- **Automatic refetching:** On window focus and network reconnection
- **Cache invalidation:** Strategic invalidation on mutations

**Query Keys Pattern:**
```typescript
// Plant queries
['plants'] // All plants
['plants', 'list', filters] // Filtered plant list
['plants', plantId] // Single plant
['plants', plantId, 'logs'] // Plant care logs
['plants', plantId, 'photos'] // Plant photos

// Schedule queries
['schedules'] // All schedules
['schedules', 'upcoming'] // Upcoming tasks

// Dashboard queries
['dashboard', 'stats'] // Garden statistics
['dashboard', 'alerts'] // Urgent alerts
```

### UI State (React Context)

- Theme preferences (light/dark mode)
- Modal/drawer open states
- Active filters and sorting preferences
- Form wizard step tracking
- Toast notification queue

**Context Structure:**
```typescript
// ThemeContext
interface ThemeContext {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

// UIContext
interface UIContext {
  isModalOpen: boolean;
  modalContent: React.ReactNode | null;
  openModal: (content: React.ReactNode) => void;
  closeModal: () => void;
}

// FilterContext (for Garden List)
interface FilterContext {
  activeStage: GrowthStage | 'all';
  searchQuery: string;
  sortBy: 'name' | 'age' | 'stage';
  setActiveStage: (stage: GrowthStage | 'all') => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: 'name' | 'age' | 'stage') => void;
}
```

### Local Storage

Persistent client-side storage for user preferences:

- Temperature unit preference (Fahrenheit/Celsius)
- Measurement unit preference (Imperial/Metric)
- Last viewed garden filter
- Onboarding completion status

**Implementation:**
```typescript
// hooks/useLocalStorage.ts
function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

---

## 8. Authentication & Authorization

Security is implemented using JWT-based authentication with refresh token rotation and role-based access control.

### Authentication Implementation

- **Library:** jose (lightweight JWT operations)
- **Access token expiry:** 15 minutes
- **Refresh token expiry:** 7 days
- **Token storage:** httpOnly secure cookies
- **Password hashing:** bcrypt with salt rounds = 12

**Token Payload Structure:**
```typescript
interface JWTPayload {
  sub: string; // User ID
  email: string;
  tier: 'free' | 'premium';
  iat: number; // Issued at
  exp: number; // Expiration
}
```

### Protected Routes

Middleware checks authentication status before rendering protected pages:

- `/dashboard` - Requires authentication
- `/garden` - Requires authentication
- `/plants/*` - Requires authentication
- `/settings` - Requires authentication

**Middleware Implementation:**
```typescript
// middleware/auth.ts
export async function requireAuth(request: Request) {
  const token = getCookie(request, 'access_token');
  
  if (!token) {
    throw redirect('/login');
  }
  
  try {
    const payload = await verifyJWT(token);
    return payload;
  } catch (error) {
    throw redirect('/login');
  }
}
```

### Authorization Levels

**Free User**
- Maximum 5 active plants
- Basic care schedules
- Standard notifications

**Premium User**
- Unlimited plants
- Advanced analytics and insights
- Custom notification schedules
- Detailed growth reports
- Priority support

**Feature Gating:**
```typescript
// utils/features.ts
export function canAccessFeature(
  user: User,
  feature: Feature
): boolean {
  const featureMap: Record<SubscriptionTier, Feature[]> = {
    free: ['basic_tracking', 'basic_schedules', 'photo_upload'],
    premium: [
      'basic_tracking',
      'basic_schedules',
      'photo_upload',
      'advanced_analytics',
      'unlimited_plants',
      'custom_schedules',
      'export_reports'
    ]
  };
  
  return featureMap[user.subscription_tier].includes(feature);
}
```

---

## 9. Development Phases & Timeline

The project is structured into four main phases, each building upon the previous foundation.

### Phase 1: Foundation (Weeks 1-3)

**Objectives:**
- Establish project infrastructure
- Set up development environment
- Implement core authentication

**Tasks:**
- Project setup with TanStack Start and TypeScript
- Database schema design and migration system
- Authentication system implementation (registration, login, JWT)
- Basic UI component library setup (buttons, inputs, cards)
- User registration and login pages
- Protected route middleware

**Deliverables:**
- Working development environment
- User authentication flow
- Database with initial schema
- Component library foundation

### Phase 2: Core Features (Weeks 4-7)

**Objectives:**
- Implement primary plant management features
- Enable users to add and track plants
- Build core navigation structure

**Tasks:**
- Add plant wizard (all three steps)
- Garden list view with filtering
- Plant detail page with basic info
- Care logging functionality (water, feed)
- Photo upload and display system
- Basic responsive layout

**Deliverables:**
- Complete plant CRUD operations
- Working add plant flow
- Garden list with search/filter
- Individual plant detail pages

### Phase 3: Advanced Features (Weeks 8-11)

**Objectives:**
- Implement automated scheduling
- Add data visualization
- Build dashboard experience

**Tasks:**
- Dashboard with statistics and schedules
- Automated reminder system with notifications
- Growth tracking charts (Recharts integration)
- Environmental monitoring interface
- Nutrient scheduling system
- Bulk operations (multi-plant actions)

**Deliverables:**
- Functional dashboard
- Automated watering/feeding reminders
- Growth visualization charts
- Complete care tracking system

### Phase 4: Polish & Launch (Weeks 12-14)

**Objectives:**
- Optimize performance
- Complete testing coverage
- Prepare for production deployment

**Tasks:**
- Performance optimization (code splitting, lazy loading)
- Responsive design refinement (mobile, tablet, desktop)
- Comprehensive testing (unit, integration, e2e)
- Security audit and fixes
- Documentation (API docs, user guide)
- Production deployment setup
- Beta testing with real users

**Deliverables:**
- Production-ready application
- Complete test coverage
- Deployed to production
- Documentation complete

---

## 10. Deployment Strategy

The application will be deployed using modern cloud infrastructure with automatic scaling and continuous deployment.

### Recommended Platform: Vercel

**Benefits:**
- Native TanStack Start support
- Automatic deployments from Git
- Edge function support for API routes
- Built-in CDN for static assets
- Zero-config deployment
- Automatic HTTPS

**Configuration:**
```json
{
  "framework": "tanstack-start",
  "buildCommand": "pnpm build",
  "outputDirectory": ".output/public",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install"
}
```

### Database Hosting

**Primary Option: Neon**
- Serverless Postgres with autoscaling
- Automatic branching for development
- Generous free tier
- Low latency globally

**Alternative: Supabase**
- Includes auth and storage
- Real-time subscriptions
- Built-in REST API
- Open-source

**Connection Pooling:**
```typescript
// lib/db.ts
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
});

export const db = drizzle(pool);
```

### File Storage

**Service:** Cloudflare R2 or AWS S3

**Features:**
- S3-compatible API
- Global CDN distribution
- Automatic image optimization
- Cost-effective storage

**Image Processing Pipeline:**
1. User uploads original image
2. Server validates file type and size
3. Sharp processes image:
   - Resize to standard dimensions
   - Convert to WebP format
   - Generate thumbnail
   - Optimize compression
4. Upload to R2/S3
5. Return CDN URLs to client

**Implementation:**
```typescript
// lib/image-processing.ts
import sharp from 'sharp';

export async function processPlantPhoto(buffer: Buffer) {
  const fullSize = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside' })
    .webp({ quality: 85 })
    .toBuffer();
    
  const thumbnail = await sharp(buffer)
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();
    
  return { fullSize, thumbnail };
}
```

### CI/CD Pipeline

**GitHub Actions Workflow:**

1. **Trigger:** Push to main branch
2. **Test:** Run automated tests (unit, integration, e2e)
3. **Type Check:** Run TypeScript type checking
4. **Lint:** Run ESLint and Prettier
5. **Build:** Build production bundle
6. **Deploy Staging:** Deploy to staging environment
7. **Smoke Tests:** Run smoke tests on staging
8. **Deploy Production:** Promote to production on success

**Workflow Example:**
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Type check
        run: pnpm type-check
        
      - name: Lint
        run: pnpm lint
        
      - name: Test
        run: pnpm test
        
      - name: Build
        run: pnpm build
        
      - name: Deploy to Vercel
        uses: vercel/deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Monitoring & Observability

**Error Tracking:** Sentry
- Real-time error monitoring
- Performance tracking
- Release tracking
- User feedback integration

**Analytics:** Plausible or Fathom
- Privacy-friendly analytics
- No cookies required
- Simple dashboard
- GDPR compliant

**Uptime Monitoring:** Better Uptime or Pingdom
- Global availability checks
- SSL certificate monitoring
- API endpoint monitoring
- Incident notifications

**Performance:** Web Vitals with Vercel Analytics
- Core Web Vitals tracking
- Real user monitoring
- Performance insights
- Automatic optimization suggestions

### Environment Variables

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Authentication
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# File Storage
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=cannabis-app-uploads

# External Services
SENTRY_DSN=https://your-sentry-dsn
PLAUSIBLE_DOMAIN=yourdomain.com

# API Keys (if needed)
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

---

## Conclusion

This technical documentation provides a comprehensive blueprint for building the Cannabis Growing App. The full-stack TypeScript architecture with TanStack Start ensures type safety, excellent developer experience, and maintainability throughout the project lifecycle.

The phased development approach allows for iterative delivery of features while maintaining code quality and testing coverage. The chosen technology stack represents modern best practices in web development and provides a solid foundation for future enhancements.

With this plan in place, development can proceed confidently from initial setup through production deployment, delivering a robust application that serves the cannabis growing community effectively.

### Next Steps

1. **Project Initialization**
   - Set up Git repository
   - Initialize TanStack Start project
   - Configure development environment

2. **Team Setup**
   - Assign roles and responsibilities
   - Set up communication channels
   - Establish development workflows

3. **Sprint Planning**
   - Break down Phase 1 into 2-week sprints
   - Define acceptance criteria for each feature
   - Set up project management tools (Jira, Linear, etc.)

4. **Begin Development**
   - Start with Phase 1: Foundation
   - Follow agile methodology
   - Regular standups and reviews

---

**Document Version:** 1.0  
**Last Updated:** January 30, 2026  
**Author:** Technical Planning Team  
**Status:** Ready for Development
