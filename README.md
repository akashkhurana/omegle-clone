# Omegle Clone

A full-stack, real-time video chat application inspired by Omegle, built with React, Node.js, and Socket.io.

## 🚀 Features

- **Real-time Video/Audio Chat**: Seamless communication using WebRTC or similar protocols.
- **Anonymous Connection**: Pairs users randomly for chat sessions.
- **Responsive Design**: Modern and clean UI that works across devices.
- **TypeScript**: Type-safe development for both frontend and backend.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), TypeScript, CSS
- **Backend**: Node.js, Express, Socket.io, TypeScript
- **Communication**: Socket.io for signaling.

## 📦 Getting Started

### Prerequisites

- Node.js (v16.x or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/omegle-clone.git
   cd omegle-clone
   ```

2. Install all dependencies (root, frontend, and backend):
   ```bash
   npm run install-all
   ```

### Running the Application

To start both the frontend and backend in development mode:

```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

## 📂 Project Structure

- `/frontend`: React application built with Vite.
- `/backend`: Node.js/Express server handling socket connections.
