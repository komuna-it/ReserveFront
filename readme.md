# VipSound FrontEnd

A reservation platform designed for rehearsal studios. Built with **Angular 21** using a reactive architecture and real-time synchronization.

## Overview
VipSound is a full-stack booking solution that allows bands and organizations to manage rehearsal space reservations in real-time. The front-end leverages Angular's latest reactivity primitives to ensure a fluid, flicker-free user experience, even with high-concurrency data updates.

## Tech Stack & Key Decisions
* **Core:** Angular 21 (Standalone Components)
* **State Management:** Built on **Angular Signals** for fine-grained reactivity and minimal change detection overhead.
* **Architecture:** Implements the **Facade Pattern** (`ReservationFacade`) to abstract API communication and store logic away from the UI components.
* **Real-time Updates:** Utilizes **Server-Sent Events (SSE)** via `@microsoft/fetch-event-source` to keep the calendar synchronized across all connected users without polling.
* **Styling:** Tailwind CSS with custom utility-first configurations.
* **i18n:** JSVerse Transloco for dynamic language support.

## Development Highlights
- **Reactive Data Flow:** Used `computed` signals for complex calendar grid rendering, deriving state from reservation lists and user metadata automatically.
- **Robust Auth:** JWT-based authentication with `ngx-cookie-service` and persistent session management.
- **Scalable API Layer:** Service-oriented architecture with dedicated API classes for clear separation of concerns.

##  Getting Started

### Prerequisites
- Node.js `20` or higher
- npm `10` or higher

### Installation
```bash
# Clone the repository
git clone [https://github.com/your-username/VipSoundFront.git](https://github.com/your-username/VipSoundFront.git)

# Navigate to the project folder
cd VipSoundFront

# Install dependencies
npm install

# Run development server
ng serve
```

## Environment Configuration
The project relies on environment variables for API communication. Ensure you have the VSF_API_URL variable configured in your environment setup.

## Core Architecture
* ReservationFacade: Acts as the single source of truth and orchestrator between the API, the Store, and the UI components.

* ReservationStore: Uses signals to provide a reactive view of rooms, bookings, and team organizations.

* AuthService: Handles token lifecycle, JWT decoding, and secure cookie management.

## TODO
* Secure JWT Cookies
* Admin panel
* Notifications
