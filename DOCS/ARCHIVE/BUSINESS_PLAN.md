# VIIYD Studio: Business Plan & Operation Strategy

> **Role**: Senior COO
> **Objective**: Transform VIIYD from a personal blog into a premium Miniature Painting Studio brand.
> **Aesthetic Identity**: "Imperial Gold" (High-End, Grimdark Luxury).

---

## 1. Executive Summary
VIIYD Studio is a boutique miniature painting service specializing in **Warhammer 40k** and **Age of Sigmar**. We differentiate ourselves through "Imperial Aesthetics"—a focus on stark contrast, metallics, and atmospheric weathering. We target busy professionals who value narrative cohesion and table presence over mass-produced speed-painting.

## 2. Service Tiers (The Product)
We offer three distinct quality levels to clarify value for the client.

### Level 1: "Battleline" (Tabletop Standard)
*   **Focus**: Clean, cohesive, striking on the table from 3ft away.
*   **Techniques**: Zenital priming, base coating, wash/oil filtering, single highlight, standard basing.
*   **Pricing Target**: Entry-level (e.g., $15-$25/infantry).
*   **Ideal For**: Rank & file troops (Guardsmen, Gaunts, Orcs).

### Level 2: "Elite" (Parade Ready) — *Core Product*
*   **Focus**: High contrast, detailed faces, edge highlighting, weathering effects.
*   **Techniques**: Volumetric lighting, glazing, OSL (plasma/eyes), decals applied & weathered, complex basing.
*   **Pricing Target**: Mid-range (e.g., $40-$60/infantry, $100+/vehicle).
*   **Ideal For**: Space Marines, Elites, Tanks, Kill Teams.

### Level 3: "Chapter Master" (Display/Art)
*   **Focus**: Competition standard. Every angle perfect.
*   **Techniques**: NMM (Non-Metallic Metal), freehand banners, display plinths, resin pours.
*   **Pricing Target**: Time-based or Premium Fixed (e.g., $200+/character).
*   **Ideal For**: Centerpiece Warlords, Primarchs, Dioramas.

## 3. Operational Workflow (The Funnel)
The website must facilitate this flow:

1.  **Acquisition**: User lands on Bento Grid Homepage. Visual shock (Imperial Gold).
2.  **Education**: User visits `Services` to see Tiers (Comparison Photos).
3.  **Trust**: User visits `Process` to understand how we handle their plastic.
4.  **Conversion**: User clicks "Get Strategy Quote" (Call to Action).
    *   *Input*: Models, Level, Timeline.
    *   *Backend*: Worker API calculates estimate (Phase 5).
5.  **Execution**: 50% Deposit -> Painting Updates -> Final Photo Approval -> Shipment.

## 4. Website Architecture & User Flow (Logic Refinement)

### 4.1 Site Structure (Sitemap)
Clear separation of concerns to guide the user journey.

*   **Home (`/`)**: Brand Impact, "Commission Open" Status.
*   **Services (`/services`)**: The Product Catalog (Tiers).
*   **Process (`/process`)**: Visual Timeline.
*   **Work / Delivery (`/work`)**: **New Core Section**.
    *   **Gallery**: High-res photos hosted on **Cloudflare R2**.
    *   **The "Paint No.7" System**: Each project lists the specific paints used (especially "Paint No.7").
    *   **Affiliate Hook**: "Get this look" -> Links to Amazon (Affiliate) for paints/tools.
*   **Quote System (`/quote`)**: AI Hook for commissions.

### 4.2 The "Affiliate" & "Quote" Dual-Engine
We now have TWO revenue streams:
1.  **Service (Commission)**: High ticket, low volume.
2.  **Product (Affiliate)**: Low ticket, passive volume.

### 4.3 Visual Style: "Modern Industrial Gallery" (Definitive)
*   **Core**: Hybrid of **Layout A (Gallery)** and **Layout B (Technical)**.
*   **Aesthetic**: Matte Dark Grey, Champagne Gold, Art-Book Whitespace.
*   **NO Cyberpunk**: Avoid neon, holograms, or overly masculine "Gamer" tropes. Reflects the female lead artist (MAYLYY).
*   **Data Visualization**: "Hardcore Deconstruction" of paint recipes using elegant, thin engineering lines (Blueprint style, not Sci-Fi style).

### 4.4 Final Site Structure (Approved)

#### A. Homepage (The Storefront)
A "Funnel" design to guide users from Trust to Interest.
1.  **Top Section (The Intro)**: 3 Core "Info Cards" (Static):
    *   **About**: Who is MAYLYY (Workshop intro).
    *   **Pricing**: Tiers & Rate Card link.
    *   **Status/Commission**: "Open/Closed" indicator & Entry Hook.
2.  **Bottom Section (The Feed)**: 
    *   Grid of Project Cards (Cover Image + Title + Tier Label).
    *   Infinite scroll or pagination for the 29+ active portfolios.

#### B. Project Detail Page (The Delivery & Sales)
Based on **Layout D (Hybrid)**.
1.  **Hero Area**: "Deconstruction" View. Main Photo + Paint Recipe Sidebar (Affiliate Links).
2.  **Gallery Area**: Grid of R2 delivery photos (Angles, Close-ups).
3.  **Bottom Hook**: "Want a commission like this?" -> Link to Quote Logic.

## 5. Website Requirements Table (UI Implications)

| Page | Business Goal | UI Requirement |
| :--- | :--- | :--- |
| **Home** | Funnel Entry | **3-Card Hero** (Info) + **Project Grid** (Feed). |
| **Work (Post)**| Affiliate & Delivery | **Layout D**: SplitView (Photo/Paints) + Bottom Gallery + Sticky CTA. |
| **Services** | Upselling | **Pricing Table** with "What's Included". |
| **Process** | Risk Reduction | Step-by-step visual roadmap. |
| **Contact** | Lead Gen | **AI-Powered Quote System** (Upload Ref -> Get Price). |

## 6. Development Roadmap
1.  **Frontend (Home)**: Implement the "3-Card Hero + Grid" layout.
2.  **Frontend (Post)**: Implement the "Layout D" (Breakdown + Affiliate).
3.  **Content**: Migrate the 29+ existing projects.
4.  **Backend**: Add the dynamic Quote/Affiliate logic later.
