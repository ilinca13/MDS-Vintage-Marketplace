# Holy Grail - Vintage Marketplace 

<br>
</br>


[![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.x-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-API-ff1709?logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-Styling-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![JWT](https://img.shields.io/badge/Auth-JWT-black?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-TF--IDF-F7931E?logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)

A **full-stack** web marketplace for buying and selling second-hand and vintage clothing, inspired by platforms such as Vinted. The project was developed as a semester group project for our **Software Development Methodologies** course (2nd Year, 2nd Semester) and extends a conventional marketplace with several **AI-assisted modules** covering product description generation, tag suggestion, and content-based product recommendations.

This repository was built using a **Django REST Framework** backend, a **React (Vite)** frontend, and a **Dockerized** development environment.



## Table of Contents

- [Project Overview](#project-overview)
- [Team](#team)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [AI-Powered Modules](#ai-powered-modules)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Development Timeline](#development-timeline)
- [Testing](#testing)
- [Roadmap and Future Improvements](#roadmap-and-future-improvements)


## Project Overview

The platform allows users to **list**, **browse**, and **purchase** pre-owned clothing items while promoting sustainable consumption. Beyond the standard marketplace flow, the application focuses on reducing the friction sellers experience when creating listings and on helping buyers discover relevant items through automated, AI-driven assistance rather than purely manual curation.

The application is composed of three main services, all orchestrated through **Docker Compose**: a **Django backend** exposing a **REST API**, a **React frontend** consuming that API, and a **PostgreSQL** database for persistence.

## Team 

Our team consisted of:
* [@ilinca13](https://github.com/ilinca13)
* [@madalinamoraru](https://github.com/madalinamoraru)
* [@jordie31](https://github.com/jordie31)


To ensure efficient collaboration and maintain a high standard of software development, we followed **Agile practices and Git Flow source control mechanisms**:
* **Branching Strategy:** Each feature was developed on dedicated, isolated branches (`feat/`) to keep the `main` branch stable and deployable at all times.
* **Task Management:** We used **GitHub Issues** to define, assign, and track user stories and technical tasks, ensuring a balanced workload and complete transparency across the team.
* **Code Reviews & Integration:** Changes were integrated into the codebase exclusively through **Pull Requests** (PRs). Team members reviewed each other's code, collaborated to resolve merge conflicts whenever they arose, and ensured that everyone could support and assist each other.

### Roles and Contributions

* **[@ilinca13](https://github.com/ilinca13) (Backend & Core Frontend):** Designed and implemented the robust Django backend infrastructure, set up database schemas, developed core CRUD operations, and built the initial base frontend.
* **[@madalinamoraru](https://github.com/madalinamoraru) (AI Integration & Adaptations):** Integrated external APIs (such as SerpApi) for specialized features, crafted the backend logic to handle image-flagging capabilities, and adapted the services to fit the project's requirements.
* **[@jordie31](https://github.com/jordie31) (Frontend Customization & UI/UX):** Took ownership of the React frontend, transforming the base structure into a highly customizable, polished, and responsive user experience, ensuring seamless integration with the backend APIs.

## Core Features

>[!NOTE]
>To visualize the relationships and structure of our application, we generated an automated Entity-Relationship Diagram (ERD) directly from our Django models. This was achieved using the `django-extensions` package combined with `graphviz` to map out our database schema dynamically. The diagram illustrates how our core entities—such as Users, Products, and Categories—interact and maintain data integrity across the system.
><img width="1771" height="1829" alt="diagrama_marketplace_v2" src="https://github.com/user-attachments/assets/64fc329a-ae4b-4335-b687-e8aaf9c72056" />

**User accounts and profiles**
- Registration, authentication, and profile management built on a custom Django user model extended with avatar, biography, location, and phone number fields.

**Product catalog**
- Listing, searching, filtering, and sorting of products by category, price range, condition, and brand, backed by Django REST Framework and `django-filter`.

**Order management** 
- A full purchase flow with order status transitions (pending, confirmed, shipped, delivered, cancelled), automatic seller assignment, and price snapshotting at the time of purchase so that later price changes do not affect order history.

**Messaging system**
- A REST-based conversation system between buyers and sellers, scoped to a specific product, with read/unread tracking and client-side polling for near real-time updates.

**Reviews and seller reputation.**
- Buyers can leave a single review per completed order, rating communication, shipping speed, and response time. Aggregated scores are exposed on public seller profiles.

**Wishlist**
- A single-endpoint toggle mechanism for adding and removing products from a user's favorites, designed to support a simple heart-icon interaction on the frontend.

**Responsive interface**
- A fully responsive React frontend covering authentication, product browsing, product detail pages, listing creation and editing, user profiles, order management, and messaging.


## Technology Stack

**Backend**
- Python with Django 5 and Django REST Framework
- PostgreSQL as the relational database
- JSON Web Tokens for authentication (`djangorestframework-simplejwt`)
- `django-filter` for query-based filtering, search, and ordering
- `scikit-learn` for TF-IDF-based similarity scoring
- Hugging Face `transformers` with the BLIP image-captioning model for description generation

**Frontend**
- React, bootstrapped with Vite
- React Router v6 for client-side routing and route protection
- Axios, configured with interceptors for automatic JWT attachment and refresh
- Tailwind CSS for styling

**Infrastructure**
- Docker and Docker Compose for orchestrating the backend, frontend, and database containers
- Environment-based configuration via `.env` files
- An entrypoint script that runs database migrations and creates a default superuser automatically on container startup

## Architecture

The application follows a standard decoupled architecture: the React frontend communicates exclusively with the Django backend through a REST API, with no server-side rendering or shared session state between the two.

On the backend, functionality is split across distinct Django apps, each owning a clear domain: users, products, orders, messaging, reviews, wishlist, and the AI agent module. Authentication is stateless and token-based, with the frontend storing the JWT access and refresh tokens and an Axios interceptor handling silent token refresh when the access token expires.

The two AI agents are isolated within the backend's `ai_agent` app and exposed through their own endpoints, which keeps the image-captioning workload and the recommendation workload independent of each other and of the rest of the product API.

All three services run in separate Docker containers defined in `docker-compose.yml`, with PostgreSQL data persisted through a dedicated volume and media uploads (product images, avatars) persisted through a separate volume mapped into the backend container.


## AI-Powered Modules

>[!IMPORTANT]
> The project integrates two independent AI agents on the backend, each addressing a distinct problem in the marketplace workflow.


### AI Description and Tagging Agent

This module assists sellers during the listing creation process by automatically generating a product description and a set of relevant tags from the images already uploaded for that listing.

The agent originally relied on the `Salesforce/blip-image-captioning-base` model, processing only the first uploaded image. It was later upgraded to `Salesforce/blip-image-captioning-large`, which produces noticeably better results for fine-grained vintage details such as embroidery, prints, and fabric patterns.

A subsequent revision extended the agent to analyze every image uploaded for a listing rather than only the first one. A custom merging function (`_merge_captions`) combines the captions generated from each image while filtering out redundant or near-duplicate phrasing, so that a listing with photos of both the front and back of a garment produces a single coherent, non-repetitive description.

On the frontend, a "Generate with AI" button is available on both the listing creation page and the listing edit page. Activating it sends the uploaded images to the backend agent and populates the description field along with a list of suggested tags. Tags are presented as clickable chips, allowing the seller to add only the ones they consider relevant rather than having the full set inserted automatically.

---


### AI Product Recommendation Agent

Implemented as a second, independent agent, this module powers a "Similar Products" section displayed at the bottom of the product detail page.

The current implementation builds a text corpus for each product by combining its title, brand, category, and description, then applies TF-IDF vectorization and cosine similarity (via `scikit-learn`) to rank all other active products by textual similarity to the one being viewed. The top six results are returned through a dedicated endpoint and rendered in a card grid on the frontend.

This approach was deliberately chosen over a heavier embeddings-based model for resource efficiency: it runs entirely on CPU, requires no model downloads, and adds a lightweight dependency that does not interfere with the image-captioning agent already running in the same backend container. It also moves recommendation logic beyond simple equality filters (such as matching on category alone) toward a similarity score computed across multiple product attributes.

---

### Clickable Hashtags

As a smaller, complementary feature, hashtags written inside a product description (e.g. `#vintage`, `#retro`) are automatically detected on the product detail page and rendered as clickable links. Clicking a tag redirects the user to the homepage with a pre-filled search query, reusing the existing search pipeline on both frontend and backend without requiring any new endpoints.


## Getting Started

### Prerequisites

- Docker and Docker Compose installed locally
- Git

### Installation

Clone the repository and move into the project directory


Create a `.env` file at the project root (see [Environment Variables](#environment-variables) below for the required keys).

Build and start all services:

```bash
docker compose up --build
```

On first startup, the backend entrypoint script automatically applies database migrations and creates a default superuser using the credentials provided in `.env`.

### Accessing the Application

| Service | URL |
| --- | --- |
| Frontend (React) | http://localhost:5173 |
| Backend API root | http://localhost:8000 |
| Django Admin | http://localhost:8000/admin |

### Rebuilding After Dependency Changes

Whenever a new Python or Node package is added (for example, after pulling changes that introduce a new AI model or library), rebuild the containers rather than simply restarting them:

```bash
docker compose up --build
```

This is particularly relevant for the AI description agent, since the BLIP models are downloaded automatically on first run and require the container image to include the updated dependencies.

## Environment Variables

Sensitive configuration is kept out of version control and supplied through a `.env` file consumed by Docker Compose. At minimum, the following categories of variables are expected:

- Django secret key and debug flag
- PostgreSQL database name, user, password, host, and port
- Default superuser username, email, and password, used by the entrypoint script to create an admin account automatically on first startup

Refer to `.env.example` (if present in the repository) for the exact variable names expected by the project.

## API Reference

All endpoints are prefixed with `/api/` and, unless otherwise noted, expect a JSON body and return JSON responses. Endpoints marked as requiring authentication expect a `Bearer <access_token>` header obtained through the authentication flow described below.

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register/` | Register a new user account |
| POST | `/api/auth/token/` | Obtain a JWT access and refresh token pair |
| POST | `/api/auth/token/refresh/` | Refresh an expired access token |
| GET / PUT | `/api/users/me/` | Retrieve or update the authenticated user's profile |

Access tokens expire after 60 minutes; refresh tokens are valid for 7 days.

### Products

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/products/` | List products, with pagination, search, filtering, and ordering |
| POST | `/api/products/` | Create a new product listing (authenticated) |
| GET | `/api/products/<id>/` | Retrieve product detail |
| PUT / PATCH | `/api/products/<id>/` | Update a product (owner only) |
| DELETE | `/api/products/<id>/` | Soft-delete a product (owner only) |
| POST | `/api/products/<id>/images/` | Upload an image for a product |
| GET | `/api/categories/` | List available product categories |

Supported query parameters on the product list endpoint include `search` (title, description, brand), `min_price` / `max_price`, `category`, `condition`, `brand`, and `ordering`.

### Wishlist

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/wishlist/` | List the authenticated user's favorited products |
| POST | `/api/wishlist/toggle/` | Add or remove a product from the wishlist in a single call |
| POST | `/api/wishlist/` | Add a product directly (used in specific contexts) |
| DELETE | `/api/wishlist/<id>/` | Remove a wishlist entry directly |

The wishlist list endpoint also supports `search`, `category`, `max_price`, and `ordering` (for example, `ordering=-created_at` to show the most recently favorited items first).

### Orders

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/orders/` | Buyer or seller | List the user's own orders |
| POST | `/api/orders/` | Any authenticated user | Place a new order |
| GET | `/api/orders/<id>/` | Buyer or seller of the order | Retrieve order detail |
| PATCH | `/api/orders/<id>/status/` | Seller of the order | Advance the order status |

Allowed status transitions are `pending -> confirmed -> shipped -> delivered`, with `cancelled` reachable from `pending`, `confirmed`, or `shipped`. Invalid transitions, attempts to purchase one's own product, and attempts to order an already-reserved product all return a 400 response.

### Reviews

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| GET | `/api/reviews/` | Public | List reviews, filterable by `?seller=<id>` |
| POST | `/api/reviews/` | Buyer (JWT) | Leave a review after an order is delivered |
| GET | `/api/reviews/<id>/` | Public | Retrieve review detail |
| GET | `/api/users/<id>/review-summary/` | Public | Aggregated seller reputation scores |

A buyer may leave at most one review per order, and only after that order has reached the `delivered` status.

### Messaging

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/conversations/` | List the authenticated user's conversations |
| POST | `/api/conversations/start/` | Start (or retrieve an existing) conversation about a product |
| GET | `/api/conversations/<id>/` | Retrieve a conversation and its messages; marks messages as read |
| POST | `/api/conversations/<id>/messages/` | Send a message within a conversation |

The frontend polls conversation endpoints every five seconds to approximate real-time updates without a persistent WebSocket connection.

### AI Agents

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/ai_agent/...` | Generate a description and suggested tags from uploaded product images (BLIP-based) |
| GET | `/api/ai/recommendations/<product_id>/` | Retrieve the top similar products for a given product (TF-IDF based) |

## Development Timeline

The project evolved iteratively across a series of pull requests. The summary below reflects the actual order of implementation and the reasoning behind the more significant technical decisions.

1. **Initial architecture setup.** Django 5 with PostgreSQL support, a Vite-based React frontend, and a Docker Compose configuration orchestrating the web, database, and frontend containers, together with `.env`-based configuration and an automated entrypoint for migrations and superuser creation.

2. **Data models and custom user system.** Extension of `AbstractUser` with profile fields, plus the core domain models: categories, products and product images, orders and order items, conversations and messages, reviews, and wishlist entries. All models were registered in Django Admin with optimized list views and filters.

3. **JWT authentication.** Integration of `djangorestframework-simplejwt`, including registration, login, token refresh, and a profile endpoint, verified through manual `curl`-based testing.

4. **Product API.** Full CRUD for products with ownership checks, soft deletion, image upload handling, and filtering, search, and ordering support via `django-filter`.

5. **Wishlist API.** A toggle-based add/remove endpoint designed around a single frontend interaction, with duplicate-add protection and combinable filtering options.

6. **Order system.** Implementation of the `Order` model with automatic seller assignment, price snapshotting, and status-transition validation enforced through Django signals.

7. **Review system.** A constrained review flow limited to one review per completed order, with aggregated seller scoring exposed through a public summary endpoint.

8. **Messaging API.** A REST-based conversation and message system designed for client-side polling rather than WebSockets, including read-state tracking.

9. **Frontend foundation.** Project initialization with Vite and Tailwind CSS, React Router v6 configuration, route protection for private pages, an Axios instance with JWT interceptors, and global authentication state via context.

10. **Authentication pages.** Registration and login forms with client-side validation, password visibility toggling, secure token storage, and dynamic navbar state based on authentication status.

11. **Product listing page.** A responsive product grid with sidebar filtering, integrated search and sorting, pagination, skeleton loading states, and an empty-state message.

12. **Product detail page.** Photo gallery, full product attributes, seller reputation display, and an order placement modal with dynamic total calculation based on the selected shipping method.

13. **Sell and edit product pages.** Listing creation and editing forms with multi-image upload (up to eight images per product), instant thumbnail previews, real-time image deletion, and ownership-based access control.

14. **Profile and public seller pages.** A private profile dashboard with active/sold listing tabs and avatar management, alongside public seller pages displaying aggregated review scores and listing history.

15. **Order management pages.** Buyer and seller tabs for tracking and updating orders, including seller-side status controls, a review submission modal, and deep-linking from a submitted review to the corresponding seller profile tab.

16. **Messaging interface.** An inbox view grouping conversations by product, an individual chat view with auto-scroll and read-state handling, and five-second polling for near real-time updates.

17. **AI description and tagging agent (initial version).** Integration of `Salesforce/blip-image-captioning-base` to generate a description and tag suggestions from the first uploaded product image, exposed through a dedicated endpoint and surfaced via a "Generate with AI" button on the sell and edit pages.

18. **AI agent improvements: multi-image analysis and model upgrade.** Upgrade to `Salesforce/blip-image-captioning-large` for improved detail recognition, extension of the agent to process every uploaded image, and introduction of a caption-merging function to avoid redundant or repetitive generated text.

19. **AI-powered product recommendations.** A second, independent agent computing product similarity via TF-IDF vectorization and cosine similarity across title, brand, category, and description, exposed through a new endpoint and rendered as a "Similar Products" section on the product detail page.

20. **Clickable hashtags.** Frontend-only enhancement parsing `#tag` patterns inside product descriptions and converting them into links that reuse the existing search functionality, requiring no backend changes.

## Testing

No automated test suite is currently part of the project; verification was performed manually throughout development using `curl` for backend endpoints and manual interaction testing for the frontend. Representative examples include:

Registering a user and authenticating:

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"Test1234!","password2":"Test1234!"}'

curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"Test1234!"}'
```

Creating a product and verifying it through the API:

```bash
curl -X POST http://localhost:8000/api/products/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Vintage 70s Dress","description":"Floral summer dress, excellent condition.","price":"35.00","category":1,"condition":"like_new","size":"S","brand":"Unknown","location":"Cluj-Napoca"}'
```

Toggling a wishlist entry:

```bash
curl -X POST http://localhost:8000/api/wishlist/toggle/ \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"product": 1}'
```

Frontend flows (registration, login, listing creation, wishlist toggling, checkout, messaging, and the AI-assisted description and recommendation features) were validated manually across desktop and mobile viewport sizes.


## Roadmap and Future Improvements

**Single-image dependency in the description agent.** The captioning agent analyzes whichever images are provided, but recommendation quality still depends on the quality and number of images uploaded by the seller; further tuning of the merging logic remains possible as more listings are added.

**Next-generation recommendation agent.** A more advanced version of the recommendation system is planned, intended to combine three complementary signals rather than text similarity alone:

- Brand-based similarity, weighting items from the same brand or stylistically related brands more heavily.
- Semantic description similarity using text embeddings (rather than TF-IDF), to recognize related items even when they do not share exact keywords, for example surfacing other retro leather jackets when viewing a "black 90s leather jacket" even if the word "leather" does not appear in both descriptions.
- Tag-overlap similarity, comparing AI-generated tags (e.g. `#vintage`, `#retro`, `#casual`) to capture style, aesthetic, or material correlations.

The planned implementation would extend the existing `backend/ai_agent/` module with a new endpoint (for example, `/api/products/<id>/recommendations/`) that combines these three signals into a single similarity score and returns the top four to six matches, fetched by the frontend when the product detail page loads and displayed in a dedicated "Products you might like" section below the existing product description.

**Real-time messaging.** Replacing the current polling-based approach with WebSockets would reduce latency and unnecessary network requests as the user base grows.

**Automated testing.** Introducing a unit and integration test suite (e.g. with `pytest` for the backend and a component-testing setup for the frontend) would reduce reliance on manual `curl`-based verification.

