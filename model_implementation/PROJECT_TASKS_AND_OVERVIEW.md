# Project Action Items & Technical Overview

## 1. Action Items & Checklist

- [ ] **Station Data Excel Sheet:** Fill out the Excel sheet with station data, assigning 30 seconds dwell time for normal stations and 60 seconds for the 4 junction stations (Tambaram and Egmore).
- [ ] **Database Schema (Postgres or other):** Create child tables in the database for each restricting variable between stations:
  - Signal status/events
  - Level crossing gate openings
  - Track maintenance
  - Engineering maintenance
  - Traction maintenance
- [ ] **Timestamp Tables & Simulation:** Generate timestamp tables for signals and gate openings, and simulate maintenance schedules using Python random number generation.
- [ ] **Model Building (Linear Regression + Softmax):** Build and run the linear regression model using the simulated data, then apply softmax to classify outputs as 0 or 1.
- [ ] **Scenario Simulations:** Simulate 7–8 scenarios in Python, storing predicted and actual arrival data for model training and validation.
- [ ] **Study Material:** Watch the first 4 videos (approx. 4 hours) of the MIT deep learning playlist by Ramakrishnan (shared 2 months ago).
- [ ] **Dataset Preparation for Colab:** Prepare two sets of data in Excel (CSV/TSV format for Google Colab compatibility).
- [ ] **Presentation (PPT) Preparation:** Prepare the PPT with visual representations of equations; take screenshots from Ramakrishnan's MIT video as referenced visuals with proper credits.
- [ ] **Manual Formulation Rule:** Do not AI-generate the PPT; write out equations manually and represent them visually.
- [ ] **Lab Session:** Conduct a lab session tomorrow to continue working on the project.
- [ ] **Variable Exploration:** Check the railway website for additional variables beyond those discussed.

---

## 2. Project Overview

- **Objective:** The project involves predicting train arrival times across a simulated A-to-Z railway network using machine learning.
- **Data Source:** Currently using simulated data; real-time data can be integrated once the model is approved.
- **Network Layout:**
  - 26 stations in total.
  - 4 junction stations (including Tambaram and Egmore) and 22 normal stations.
  - Baseline travel time from Station A to Station Z (under zero disruptions) is approximately **2 hours**.

---

## 3. Data Structure

### Core Station Table
- `serial_number`: Integer ID / Sequence
- `station_name`: Name of the station
- `average_dwell_time`: 30 seconds for normal stations, 60 seconds for junction stations
- `distance_between_stations`: Distance from previous station (in km)

### Child / Sub-Tables for Restricting Variables (Between Station Pairs)
- **Signal Events:** (e.g., 3 times/hour = 48 times/day)
- **Railway Level Crossing Gate Openings:** (e.g., 2 times/hour = 72 times/day with timestamps)
- **Track Maintenance:** Track-level maintenance windows and statuses
- **Engineering Maintenance:** Civil/P-Way maintenance schedules
- **Traction Maintenance:** OHE / Electrical maintenance activities

### Data Specifications
- Timestamp tables generated for all signal and gate events.
- Data export formats for Google Colab: **CSV** or **TSV** (comma-separated or tab-separated).
- Footprint is lightweight and manageable: 26 stations $\times$ ~5 parameters; standard 16GB RAM in Google Colab is more than sufficient.

---

## 4. ML Model Approach

### Base Model: Linear Regression
- Formulation:
  $$y = M \cdot x + C$$
  where $M$ = weights (slope matrix), $C$ = bias (constant vector).
- The model adjusts weights and biases to minimize error between predicted and actual arrival times.
- **Reward/Penalty Adjustment:** Multiply by $\pm 0.2$ based on whether the output error is positive or negative.

### Classification Layer
- **Softmax Function:** Applied after linear regression to convert numerical outputs to probabilities ($0$ to $1$ scale).
- **Classification Threshold:** $\sim 0.65$ threshold for binary classification.

### Training & Simulation Flow
- **Training vs. Validation:** The first set of simulated scenarios serves as training data; the remaining sets are used for validation.
- **Accident / Incident Simulation:** 
  - Use Python's random number generator to simulate accidents at random track positions (e.g., if random number $= 63$, accident at track point 63).
  - Simulate $\sim 3$ accidents/day.
- **Data Modality:** Purely tabular / numerical data — no computer vision, satellite imagery, or NLP tokenization required.

---

## 5. Department Coordination & System Logic

### Current Problem
- Three core departments: **Traction (TRD)**, **Signaling (S&T)**, and **Engineering (Civil)** currently operate in silos with poor inter-department communication.

### Automated Algorithmic Coordination
- The algorithm coordinates their schedules to eliminate conflicts with train movements:
  - *Example:* If a train passes at 08:42, the traction team is dispatched after 08:35 and the engineering team after 08:45.
  - Signals can be delayed by 2 minutes to allow trains to pass safely.
- **Priority System:** Four priority tiers (**Critical**, **High**, **Medium**, **Low**) are used to arbitrate conflicts between departments needing the same track segment.
- **Emergency / Accident Protocol:** When an accident scenario occurs:
  - A critical alarm is immediately triggered.
  - All three maintenance teams are automatically dispatched simultaneously without requiring manual inter-department phone calls or coordination.
