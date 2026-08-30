<div align="center">
  <h1>🚂 BlockTrain</h1>
  <p><strong>Next-Generation Railway Digital Twin & Emergency Dispatch Platform</strong></p>

  ![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
  ![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css)
</div>

---

## ⚡ Overview

**BlockTrain** is an intelligent, real-time digital twin platform designed to completely modernize railway maintenance scheduling, train routing, and emergency dispatch protocols. 

Built for high-stakes, mission-critical rail environments, it replaces archaic paper-based track block approvals with a **live, interactive map**, automated **AI-driven path optimization**, and instantaneous **voice/SMS dispatch protocols**.

---

## ✨ Key Features

### 🗺️ Live Digital Twin & Kinematics
*   **Interactive Railway Map:** A beautifully rendered, fully interactive SVG map of the railway network.
*   **Real-Time Visualization:** Instantly visualizes active trains, maintenance blocks (yellow hazard zones), and station platforms.
*   **Physics-Based Kinematics:** Trains move smoothly across the network using custom physics hooks, preventing instant teleportation and providing a realistic simulation of network traffic.

### 🎙️ Instant Emergency Dispatch
*   **One-Click Maintenance Blocks:** Click any track on the map to instantly schedule a maintenance block.
*   **Voice Recorder Integration:** Record live emergency audio dispatches directly from the browser UI.
*   **Native SMS Routing:** Instantly triggers native SMS protocols to blast the custom emergency text—including the Cloudinary-hosted audio playback link—directly to all relevant field workers' cell phones simultaneously.

### 🧠 AI-Powered Rerouting & Optimization
*   **Smart Analytics:** Integrated with **Grok AI** to analyze blocked tracks and calculate the ripple effects across the network.
*   **Automated Solutions:** Automatically suggests optimized routing paths to dispatchers, minimizing train delays and maximizing network throughput while preserving absolute safety boundaries.

### 🏗️ Enterprise-Grade Architecture
*   **Domain-Driven Design (DDD):** The backend is cleanly structured into 5 highly scalable feature domains (`blocks`, `dispatch`, `workers`, `chatbot`, `optimization`).
*   **High Performance:** Powered by a lightweight Next.js frontend and an Express.js backend connected via connection pooling to PostgreSQL.

---

## 🛠️ Tech Stack

**Frontend Interface**
*   **Framework:** Next.js 14 (App Router)
*   **Styling:** Tailwind CSS (with highly customized UI components)
*   **State Management:** Zustand
*   **Icons:** Lucide React

**Backend API & Database**
*   **Runtime:** Node.js + Express.js
*   **Database:** PostgreSQL (using `pg` pool)
*   **Media Storage:** Cloudinary (for instant memory-buffer audio streaming)
*   **AI Integration:** Grok AI

---

## 🚀 Getting Started

To run the project locally, you will need to boot up both the backend API and the frontend client.

### 1. Start the Backend API
```bash
cd apps/api
npm install
# Ensure you have your .env file configured with DATABASE_URL, CLOUDINARY credentials, etc.
npm run dev
```
*The API will start locally on `http://localhost:5000`*

### 2. Start the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The Digital Twin map will be available at `http://localhost:3000`*

---

## 🎯 The Problem We Solve
Currently, authorizing a railway maintenance "block" requires a staggering amount of phone calls, physical paper trails, and radio miscommunications. If a train is on an intercept path, the results can be catastrophic. 

**BlockTrain** completely digitizes this workflow. By visually locking the track on a centralized map and automatically firing SMS and Voice alerts to the exact workers stationed at that track, we remove human error from the equation and prioritize human lives.
