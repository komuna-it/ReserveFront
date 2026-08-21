# ReserveFront FrontEnd

A reservation platform designed for rehearsal studios. Built with **Angular 21** using a reactive architecture and real-time synchronization.

## Overview
ReserveFront is a full-stack booking solution that allows bands and organizations to manage rehearsal space reservations in real-time. The front-end leverages Angular's latest reactivity primitives to ensure a fluid, flicker-free user experience, even with high-concurrency data updates.

## Tech Stack & Key Decisions
* **Core:** Angular 22 
* **State Management:** Built on **Angular Signals** for fine-grained reactivity and minimal change detection overhead.
* **Architecture:** Implements the **Facade Pattern** (`ReservationFacade`) to abstract API communication and store logic away from the UI components.
* **Real-time Updates:** Utilizes **Server-Sent Events (SSE)** via `@microsoft/fetch-event-source` to keep the calendar synchronized across all connected users without polling.
* **Styling:** Tailwind CSS with custom utility-first configurations.
* **i18n:** JSVerse Transloco for dynamic language support.

## Development Highlights
- **Reactive Data Flow:** Used `computed` signals for complex calendar grid rendering, deriving state from reservation lists and user metadata automatically.
- **Robust Auth:** JWT-based authentication with `ngx-cookie-service` and XSRF tokens.
- **Scalable API Layer:** Service-oriented architecture with dedicated API classes for clear separation of concerns.

##  Getting Started

### Install backend
https://github.com/komuna-it/Reserve

### Prerequisites
- Backend installed
- Node.js `20` or higher
- npm `10` or higher


### Installation
```bash
# Clone the repository
git clone [https://github.com/m-troja/ReserveFront.git](https://github.com/m-troja/ReserveFront.git)

# Navigate to the project folder
cd VipSoundFront

# Install dependencies
npm install

# Run development server
ng serve --ssl
```

## Environment Configuration
The project relies on backend IP variables for API communication. Ensure you have the variable in `src\environments\environment.ts` 

