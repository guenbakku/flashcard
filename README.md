# 📇 Flashcard App

[![Made with Nuxt UI](https://img.shields.io/badge/Made%20with-Nuxt%20UI-00DC82?logo=nuxt&labelColor=020420)](https://ui.nuxt.com)

An intuitive flashcard study application designed to help you memorize efficiently and track your learning progress directly in your browser.

## 🚀 Key Features

* **Interactive Card Flipping:** A seamless, responsive review experience to test your knowledge.
* **Progress Tracking:** Monitor your completion rate and mastery level for each study deck.
* **Smart Review Modes:** Shuffle card order or filter out mastered cards to focus entirely on your weak spots.
* **Local Database Persistence:** Your deck data, study history, and progress are securely stored directly in your browser using **IndexedDB**, ensuring high-performance offline access with zero cloud dependencies.

## 📦 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed (recommended version 22+ or latest LTS).

### Installation

Clone the repository and install the required dependencies:

```bash
yarn install
```

### Development Server

Start the local development server on `http://localhost:3000`:

```bash
yarn dev
```

## 🏗️ Production & Deployment

### Static Build (SPA)

This application is architected as a Single Page Application (SPA). It runs completely client-side and can be hosted on any static web server (e.g., GitHub Pages, Vercel, Netlify) without the need for a server-side database or dynamic runtime environments.

To build the application for static production:

```bash
yarn generate
```

> 💡 **Note on Deck Data:** The `yarn generate-decks-data` command compiles your source flashcard data into the application. You don't need to run this manually; it is automatically executed during the production build sequence.

If you ever need to manually trigger the data generation without running a full build:

```bash
yarn generate-decks-data
```

## 🧪 Quality Assurance

### Unit Testing

Run the test suite to ensure application stability:

```bash
# Run all tests
yarn test

# Run tests and generate a code coverage report (Output: /.coverage/)
yarn test:coverage
```

### Linting & Formatting

Maintain code quality and style standards:

```bash
# Check code for linting errors
yarn lint

# Automatically fix linting and formatting issues
yarn lint:fix
```

## 📄 License

This project is open-source and available under the [MIT License](https://github.com/guenbakku/flashcard/blob/master/LICENSE).
