# Evalio LMS - Learning Management System

Evalio LMS is a modern learning management system built with React, Vite, and Clerk for authentication. The application offers a clean, responsive UI using Tailwind CSS.

## Features

- **Authentication**:
  - Email OTP authentication (passwordless)
  - Google OAuth sign-in
  - Sign up with username and email verification
  - Secure session management

- **Dashboard**:
  - User profile display
  - Activity tracking
  - Modern UI with responsive design

## Technology Stack

- **Frontend**: React with functional components and hooks
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS for utility-first styling
- **Authentication**: Clerk for secure, modern auth workflows
- **Routing**: React Router for client-side navigation

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```
3. Create a `.env.local` file with your Clerk publishable key:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Project Structure

- `/src` - Source code
  - `/components` - Reusable UI components
    - `/Auth` - Authentication components
    - `/Dashboard` - Dashboard components
    - `/Layout` - Layout components
  - `/pages` - Page components
  - `/assets` - Static assets

## Authentication Flow

The application uses a modern authentication approach:

1. **Email OTP Authentication**:
   - User enters their email
   - Receives a one-time password
   - Verifies identity with the code

2. **Social Authentication**:
   - Single-click sign in with Google
   - Secure OAuth 2.0 flow

3. **Protected Routes**:
   - Automatic redirection to sign-in for unauthenticated users
   - Session persistence

## Environment Setup

For local development, you'll need to configure Clerk with the appropriate credentials. Visit the [Clerk Dashboard](https://dashboard.clerk.dev/) to set up your application.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
