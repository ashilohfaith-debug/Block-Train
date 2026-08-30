<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=timeGradient&height=250&section=header&text=BlockTrain&fontSize=80&desc=Next-Gen%20Railway%20Digital%20Twin%20%26%20Dispatch&descSize=20&descAlignY=70" width="100%" alt="BlockTrain Header" />
</div>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" />
  <img src="https://img.shields.io/badge/Grok_AI-Integration-FF4500?style=for-the-badge" />
</p>

<br>

<blockquote align="center">
  <strong>Replacing archaic paper-based track approvals with a live, interactive map, automated AI path optimization, and instantaneous voice/SMS dispatch protocols.</strong>
</blockquote>

<br>

## 🚀 The Core Vision
Currently, authorizing a railway maintenance "block" requires a staggering amount of phone calls, physical paper trails, and radio miscommunications. If a train is on an intercept path, the results can be catastrophic. **BlockTrain** completely digitizes this workflow to remove human error and prioritize human lives.

<br>

## ✨ Platform Features

<table>
  <tr>
    <td width="50%">
      <h3>🗺️ Live Digital Twin</h3>
      <p>A beautifully rendered, fully interactive SVG map of the railway network. Visualizes active trains, maintenance blocks (yellow hazard zones), and station platforms in real-time.</p>
    </td>
    <td width="50%">
      <h3>🚂 Physics-Based Kinematics</h3>
      <p>Trains move smoothly across the network using custom mathematical physics hooks, preventing instant teleportation and providing a realistic simulation of network traffic.</p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🎙️ Emergency Voice Dispatch</h3>
      <p>Click any track to schedule a block and record live emergency audio. Instantly triggers native SMS protocols to blast the custom text and Cloudinary audio link to field workers.</p>
    </td>
    <td width="50%">
      <h3>🧠 AI-Powered Rerouting</h3>
      <p>Integrated with Grok AI to analyze blocked tracks, calculate ripple effects, and automatically suggest optimized routing paths to minimize delays.</p>
    </td>
  </tr>
</table>

<br>

## 🏗️ Enterprise Architecture

Our backend employs a strict **Domain-Driven Design (DDD)**, cleanly structured into highly scalable feature modules.

> 📂 `modules/blocks` — Maintenance scheduling logic <br>
> 📂 `modules/dispatch` — Native SMS, telecom, and Cloudinary media <br>
> 📂 `modules/workers` — Personnel and department routing <br>
> 📂 `modules/chatbot` — Grok AI analytics and prompting <br>
> 📂 `modules/optimization` — Railway pathfinding and kinematic scheduling

<br>

## 🛠️ Getting Started

### 1. Boot the API Server
```bash
cd apps/api
npm install
npm run dev
```
> *API mounts on `http://localhost:5000`*

### 2. Launch the Digital Twin
```bash
cd frontend
npm install
npm run dev
```
> *Map & Dispatch UI available at `http://localhost:3000`*

<br>

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=timeGradient&height=100&section=footer" width="100%" alt="Footer" />
</div>
