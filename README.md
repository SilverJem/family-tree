# 🌳 KinTree — Interactive Family Tree Builder

A modern, full-stack family tree application built with React, React Flow, and Supabase. KinTree lets you build, visualize, edit, and share detailed multi-generational family trees with an interactive canvas experience.

---

## Table of Contents

1. [Overview](#overview)
2. [Live Demo & Deployment](#live-demo--deployment)
3. [Tech Stack](#tech-stack)
4. [Features](#features)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [Getting Started](#getting-started)
8. [Environment Variables](#environment-variables)
9. [Running Locally](#running-locally)
10. [Building for Production](#building-for-production)
11. [Supabase Setup](#supabase-setup)
12. [Key Pages & Components](#key-pages--components)
13. [Data Import & Export](#data-import--export)
14. [Public Share Links](#public-share-links)
15. [Known Limitations](#known-limitations)
16. [Roadmap](#roadmap)

---

## Overview

KinTree is a single-page React application that enables users to document their family heritage in a visually engaging way. Every family member is represented as a card node on an interactive canvas with connections drawn as labelled edges. Users can add rich metadata — biography, occupation, tribe, location, photo — and share their tree via a read-only public link that mirrors the full editing experience.

---

## Live Demo & Deployment

Deployed via **Vercel**. A `vercel.json` config file in the root handles SPA routing rewrites so page refreshes work correctly on all routes.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI Framework | React 18 + Vite |
| Canvas / Graph | React Flow (`@xyflow/react`) |
| Graph Layout | Dagre (`dagre`) |
| Backend / Auth / DB | Supabase (Postgres + Auth + Storage) |
| Server State | TanStack Query (React Query v5) |
| Global UI State | Zustand |
| Icons | iconsax-react |
| Fonts | DM Sans (headings), Inter (body) via Google Fonts |
| Deployment | Vercel |

---

## Features

### Core Canvas
- **Automatic Dagre layout** — nodes are automatically positioned in clean, readable generational rows. Relationships are drawn as curved edges with colour-coded labels (Parent, Spouse, Sibling).
- **Zoom, pan & fit** — full React Flow controls with minimap and a "Fit to screen" button.
- **Single-click profile drawer** — clicking any node opens a 384px slide-in `Family Profile` panel on the right showing all stored details and family link rows.
- **Inline tree name editing** — click the tree name in the canvas topbar to rename it in place.

### People Management
- **Add person** — open the Add Person modal from the topbar or from a node's connection handle button.
- **Edit person** — a full-form modal lets you update all fields: photo, first/last name, birth name (née), gender, living status, birth date, death date, occupation/title, tribe/clan, location, biography, and additional notes.
- **Photo upload** — photos are uploaded directly to Supabase Storage and rendered as circular avatars on each node and in the profile drawer.
- **Delete person** — accessible from the detail drawer's action menu.

### Relationship Types
The app supports the following relationship types stored in the `relationships` table:

| Type | Description |
|---|---|
| `parent_child` | Biological parent to child |
| `step_parent_child` | Step-parent to child |
| `adoptive_parent_child` | Adoptive parent to child |
| `foster_parent_child` | Foster parent to child |
| `spouse` | Married partners |
| `partner` | Unmarried partners |
| `divorced_spouse` | Former spouse (divorced) |
| `ex_partner` | Former partner |

### Person Profile Drawer
Displayed when a node is clicked (both on canvas and on the public Share View). Contains:
- Avatar (photo or generated initial-based avatar)
- Full name + Maiden name (née) if applicable
- Occupation/title subtitle
- Tags: Gender, Living/Deceased status, Location, Tribe
- Biography section
- Additional Notes section
- Metadata grid: Born year, Tribe
- **Established Family Links** — clickable rows for all linked parents, spouses, siblings, and children

### Filtering
- Filter by **Living Status** (Living / Deceased)
- Filter by **Gender** (Male / Female / Non-binary)
- Filters update the canvas by highlighting or dimming nodes

### Search
- Topbar search bar with live dropdown results showing avatar, name, and birth/death range
- Selecting a result pans and zooms the canvas to that person's node

### Dashboard
- **Tree grid** — card-based list of all family trees owned by the logged-in user
- **Create tree** — name a new tree and get started immediately
- **Rename tree** — rename from the dashboard card's action menu without entering the canvas
- **Delete tree** — with confirmation prompt
- **Import tree** — upload a GEDCOM (`.ged`) or JSON (`.json`) file; a modal prompts you for a custom name before saving

### Authentication
- Email/password sign-in and registration via Supabase Auth
- Registration sends a confirmation email; account must be confirmed before signing in
- Public routes: `/`, `/login`, `/share/:token`
- Protected routes: `/dashboard`, `/tree/:id`

### Public Share View (`/share/:token`)
- Full read-only replica of the canvas experience — same topbar, same profile drawer, same member count
- "Read Only" badge shown in topbar
- **Build Your Tree** CTA links guests back to the landing page
- No auth required to view

### Landing Page
- Public-facing marketing page at `/`
- Highlights all app features with an AI-generated hero screenshot
- 3-step "How It Works" guide
- Dark footer CTA banner
- Authenticated users see a "Go to Dashboard" button instead of "Get Started"

---

## Project Structure

```
family-tree-app/
├── public/
│   └── hero_mockup.jpg         # Landing page hero image
├── src/
│   ├── App.jsx                 # Root router with Landing, Auth, Dashboard, Canvas, Share routes
│   ├── main.jsx                # React entry point + QueryClient provider
│   ├── pages/
│   │   ├── Landing.jsx         # Public marketing landing page
│   │   ├── Login.jsx           # Sign-in + registration page
│   │   ├── Dashboard.jsx       # Tree list, create, import, rename, delete
│   │   ├── Canvas.jsx          # Interactive tree canvas with topbar and profile drawer
│   │   └── ShareView.jsx       # Public read-only tree view
│   ├── components/
│   │   ├── canvas/
│   │   │   ├── TreeCanvas.jsx  # React Flow canvas wrapper
│   │   │   ├── PersonNode.jsx  # Custom React Flow node component
│   │   │   └── EdgeLabel.jsx   # Custom labelled edge renderer
│   │   ├── modals/
│   │   │   ├── PersonModal.jsx       # Add / Edit person form
│   │   │   ├── RelationshipModal.jsx # Add relationship form
│   │   │   └── ShareModal.jsx        # Export / Share right-side drawer
│   │   └── ui/
│   │       ├── Avatar.jsx        # Photo or initial-based avatar component
│   │       ├── PersonSearch.jsx  # Topbar search with dropdown results
│   │       ├── TreeFilterBar.jsx # Living status + gender filter popover
│   │       ├── ToastContainer.jsx # Notification toast system
│   │       └── ErrorBoundary.jsx  # React error boundary wrapper
│   ├── hooks/
│   │   ├── useAuth.js          # Supabase auth hook (signIn, signUp, signOut, user)
│   │   ├── useTree.js          # React Query hooks for trees + tree name updating
│   │   ├── usePeople.js        # React Query hooks for people CRUD + photo upload
│   │   └── useRelationships.js # React Query hooks for relationship CRUD
│   ├── lib/
│   │   ├── supabase.js         # Supabase client initialisation
│   │   ├── layout.js           # Dagre auto-layout engine (converts people + relationships to nodes/edges)
│   │   └── utils.js            # Utility helpers (e.g. calculateAge)
│   ├── store/
│   │   └── useUIStore.js       # Zustand store (selected person, active modal, toast queue)
│   └── css/
│       └── style.css           # Global styles, CSS variables, component styles
├── supabase/
│   └── migrations/
│       ├── 001_schema.sql          # Core tables: trees, people, relationships, tree_members, share_links
│       ├── 002_rls.sql             # Row-Level Security policies
│       ├── 003_add_siblings.sql    # Sibling relationship type added
│       ├── 004_add_location.sql    # location column added to people
│       ├── 005_add_godparent.sql   # Godparent relationship type
│       ├── 006_public_share_rls.sql # RLS for public share link access
│       ├── 007_enable_realtime.sql  # Enable Supabase realtime on people/relationships
│       └── 008_add_new_fields.sql   # occupation, biography, clan columns
├── index.html
├── vite.config.js
├── vercel.json
└── package.json
```

---

## Database Schema

### `trees`
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `owner_id` | UUID | Foreign key to `auth.users` |
| `name` | TEXT | Tree name (editable) |
| `visibility` | TEXT | `private` \| `shared_link` \| `public` |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `people`
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `tree_id` | UUID | Foreign key to `trees` |
| `first_name` | TEXT | First name (required) |
| `last_name` | TEXT | Last name |
| `birth_name` | TEXT | Maiden / birth name |
| `gender` | TEXT | `male` \| `female` \| `non_binary` \| `unknown` |
| `birth_date` | DATE | Date of birth |
| `death_date` | DATE | Date of death (if deceased) |
| `is_living` | BOOLEAN | Living status |
| `photo_url` | TEXT | URL to Supabase Storage avatar |
| `occupation` | TEXT | Job title or role |
| `location` | TEXT | City, Country |
| `clan` | TEXT | Tribe / clan name |
| `biography` | TEXT | Long-form life story |
| `notes` | TEXT | Additional notes |
| `canvas_x` | FLOAT | Saved canvas X position |
| `canvas_y` | FLOAT | Saved canvas Y position |

### `relationships`
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `tree_id` | UUID | Foreign key to `trees` |
| `type` | TEXT | Relationship type (see list above) |
| `person_a_id` | UUID | First person |
| `person_b_id` | UUID | Second person |
| `start_date` | DATE | e.g. marriage date |
| `end_date` | DATE | e.g. divorce date |

### `share_links`
Stores hashed tokens used to validate public share URLs (`/share/:token`).

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **pnpm** (recommended) or npm
- A **Supabase** project (free tier is sufficient)

### Installation

```bash
# Clone the repository
git clone https://github.com/SilverJem/family-tree.git
cd family-tree

# Install dependencies
pnpm install
# or: npm install
```

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are found in your Supabase project under **Settings → API**.

---

## Running Locally

```bash
pnpm dev
# or: npm run dev
```

The app will start at `http://localhost:5173`.

---

## Building for Production

```bash
pnpm build
# or: npm run build
```

Output is written to the `dist/` folder. Serve it with any static host (Vercel, Netlify, etc.)

---

## Supabase Setup

### 1. Create a Supabase project
Go to [supabase.com](https://supabase.com) and create a new project.

### 2. Run the database migrations
Open the **SQL Editor** in your Supabase dashboard and run each migration file in order:

```
supabase/migrations/001_schema.sql
supabase/migrations/002_rls.sql
supabase/migrations/003_add_siblings.sql
supabase/migrations/004_add_location.sql
supabase/migrations/005_add_godparent.sql
supabase/migrations/006_public_share_rls.sql
supabase/migrations/007_enable_realtime.sql
supabase/migrations/008_add_new_fields.sql
```

### 3. Enable Storage
In Supabase → **Storage**, create a bucket named `photos` and set it to **public**.

### 4. Enable Auth
In Supabase → **Authentication → Providers**, enable the **Email** provider. Optionally turn off email confirmation for development.

### 5. Copy your keys
Copy `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from **Settings → API** into your `.env.local`.

---

## Key Pages & Components

### `Landing.jsx`
Public marketing page. Shows a hero image, a 6-card feature grid, a "How it Works" 3-step section, and a dark CTA banner. Uses `iconsax-react` for feature icons and `DM Sans` / `Inter` typography.

### `Dashboard.jsx`
Protected. Shows a card grid of all trees owned by the authenticated user. Actions per card: Open canvas, Rename, Delete. Import GEDCOM/JSON triggers a name-prompt modal before saving.

### `Canvas.jsx`
The core editing experience. Renders:
- **Topbar** — back navigation, tree logo + editable name, search bar, filter button, export/share button
- **React Flow canvas** — person nodes with avatar, name, and connection handles
- **Side profile drawer** — 384px right panel showing the selected person's full profile

### `ShareView.jsx`
Identical to Canvas in UX but all editing functionality is removed. Renders from a `share_token` URL param, validates against the `share_links` table, and loads the tree without requiring login.

### `PersonModal.jsx`
Full-featured form modal for creating or editing a person. Fields: photo upload (camera icon placeholder), first name, last name, birth name, gender pills, living checkbox, birth/death dates, occupation, tribe, location, biography, and notes. Scrollbar is hidden while still allowing scroll.

### `ShareModal.jsx`
Right-side drawer panel for the export/share workflow. Slides in from the right edge of the viewport (not from the bottom).

### `PersonSearch.jsx`
Topbar search input with live-filtering dropdown. Results show avatar, name, and life years. Selecting a result triggers `fitView` to pan the canvas to that node. Dropdown has `zIndex: 250` to float above all canvas elements.

### `TreeFilterBar.jsx`
Popover filter UI. Filters by **Living Status** and **Gender**. The Clan filter was intentionally removed.

### `layout.js`
Converts the flat `people` + `relationships` arrays into a positioned node/edge graph using the Dagre hierarchical layout algorithm. Nodes are sized `152 × 196` with `80px` horizontal and `100px` vertical padding between rows.

---

## Data Import & Export

### Import
Supported formats: **GEDCOM (`.ged`)** and **JSON (`.json`)**.

When a file is imported from the Dashboard:
1. The file is parsed client-side.
2. A modal appears asking you to confirm or edit the tree name.
3. The tree and all its people/relationships are saved to Supabase.

### Export
From the canvas Export / Share panel:
- **Download JSON** — full backup of tree data as a JSON file
- **Download GEDCOM** — export in the standard `.ged` genealogy format compatible with other tools
- **Copy share link** — generates a tokenised public URL and copies it to the clipboard

---

## Public Share Links

When you click **Share** → **Generate Link** in the canvas:
1. A cryptographic token is generated and its hash stored in `share_links`.
2. The tree's `visibility` is updated to `shared_link`.
3. A URL in the format `https://your-domain.com/share/<token>` is generated.

Anyone with the link can view the interactive tree (read-only) without needing an account. The share view has full parity with the canvas: profile drawers, search, biography, tribe tags, family links, etc.

---

## Known Limitations

- **No real-time collaboration** — multiple users editing the same tree simultaneously may cause data conflicts. Realtime subscription is enabled but the UI does not yet merge concurrent edits.
- **No drag-to-reposition** — the Dagre auto-layout controls all node positions. Manual repositioning is not persisted.
- **Share link expiry** — the `expires_at` column exists in `share_links` but expiry is not yet enforced in the application logic.
- **GEDCOM import fidelity** — complex GEDCOM features (notes, sources, media, alternate names) are partially parsed; only core identity and relationship data is imported.

---

## Roadmap

- [ ] Drag-to-reposition nodes with position persistence
- [ ] Real-time collaborative editing (multi-user)
- [ ] Share link expiry enforcement + regeneration
- [ ] Print-to-PDF / image export of the full canvas
- [ ] Timeline view — events ordered chronologically
- [ ] Full GEDCOM 5.5.1 import/export compliance
- [ ] Dark mode support
- [ ] Mobile-responsive canvas gestures

---

## License

MIT — feel free to fork and adapt for your own family history project.
