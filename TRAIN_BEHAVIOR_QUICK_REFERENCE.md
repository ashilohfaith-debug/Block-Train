# Train Behavior Rules - Quick Reference Guide

Visual, easy-to-follow guide for the railway corridor rule system.

---

## RULE PRIORITY FLOWCHART

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TRAIN FRAME UPDATE SEQUENCE (Every 30ms)                 │
└─────────────────────────────────────────────────────────────────────────────┘

                                    START
                                      ↓
                    ┌─────────────────────────────────┐
                    │  UPDATE TRAIN X POSITION        │
                    │  x += direction × speed         │
                    │  (Rule LO-001: Handle wrapping) │
                    └──────────────┬──────────────────┘
                                   ↓
                    ┌─────────────────────────────────┐
                    │  SCAN FOR FORWARD COLLISION     │
                    │  (Rule CD-001: 600px ahead)     │
                    │  trainAhead = ?                 │
                    └──────────────┬──────────────────┘
                                   ↓
                ┌──────────────────────────────────────────────┐
                │              YES                    NO        │
                ↓                                      ↓
    ┌─────────────────────────────┐    ┌──────────────────────┐
    │ Collision Risk > 50%?        │    │ Calculate zone      │
    │ (Rule CD-001)                │    │ speed limits        │
    └──────────┬───────────────────┘    │ (Rule SM-003)       │
               ↓                        └──────────────────────┘
    ┌──────────────────────────┐                ↓
    │ Apply Graduated          │    ┌─────────────────────────┐
    │ Response (Rule SP-001)    │    │  SCAN FOR REAR TRAIN   │
    │ • >600px: 100% speed     │    │  (Rule CD-002: 800px)  │
    │ • 300px: 70% speed       │    │  trainBehind = ?       │
    │ • 100px: 50% speed       │    └────────────┬────────────┘
    │ • 0px: 30% speed         │                 ↓
    └──────────┬───────────────┘    ┌─────────────────────────┐
               ↓                     │ Faster train behind?    │
    ┌──────────────────────────┐    │ (Rule SP-004)           │
    │ Risk > 70% AND           │    └────────────┬────────────┘
    │ Distance < 200px?        │                 ↓
    │ (Try lane change)        │    ┌────────────────────────────┐
    └──────────┬───────────────┘    │ Check spacing:            │
               ↓                     │ minSpacing =              │
    ┌──────────────────────────┐    │ 300 + (speed × 3)        │
    │ Safe lane available?     │    │ (Rule SP-004)            │
    │ (Rule TL-001)            │    └────────────┬─────────────┘
    └──────────┬───────────────┘                 ↓
        YES ↙  ↖ NO                ┌────────────────────────────┐
           ↓    ↓                  │ Spacing OK?               │
    Change Lane  Emergency Brake   │ if (actual < minimum)     │
    (Rule TL-002)  (Rule EM-001)   │   → Slow down (×0.85)    │
           ↓         ↓             └────────────┬─────────────┘
           └────┬────┘                         ↓
                ↓                   ┌──────────────────────────┐
    ┌─────────────────────────┐    │ STATION ARRIVAL CHECK    │
    │ CHECK STATION ARRIVAL   │    │ (Rule SA-001:            │
    │ (Rule SA-001)           │    │  <400px distance)        │
    │ In detection zone?      │    │ atStation = ?            │
    └──────────┬──────────────┘    └────────────┬─────────────┘
               ↓                                 ↓
    ┌──────────────────────────────┐  ┌──────────────────────────┐
    │ YES: Try allocate platform   │  │ NO: Continue normal ops  │
    │ (Rule SA-002, SA-003)        │  │                          │
    │ platform = ?                 │  │ Apply speed control:     │
    └──────────┬───────────────────┘  │ • Acceleration (SM-002)  │
               ↓                       │ • Deceleration (SM-004)  │
    ┌──────────────────────────────┐  │ • Zone limits (SM-003)   │
    │ Platform available?          │  └──────────┬───────────────┘
    └──────────┬───────────────────┘             ↓
        YES ↙  ↖ NO                   ┌──────────────────────┐
           ↓    ↓                     │ ADD TO QUEUE         │
        Dock   Wait in queue          │ (Rule WQ-001)        │
        Train  (Rule WQ-001)          │ Calculate position   │
           ↓    ↓                     └──────────┬───────────┘
           └────┬────────────────────────────────┘
                ↓
    ┌─────────────────────────────────┐
    │ UPDATE ALERT STATE              │
    │ GREEN/YELLOW/RED/CRITICAL       │
    │ (Based on collision risk)       │
    └──────────┬──────────────────────┘
               ↓
    ┌─────────────────────────────────┐
    │ TRIGGER REACT RE-RENDER         │
    │ (Batch all position updates)    │
    └──────────┬──────────────────────┘
               ↓
            REPEAT
            (Every 30ms)
```

---

## SPEED CONTROL DECISION TREE

```
                           START: Train Speed Update
                                    ↓
                    ┌───────────────────────────────┐
                    │ Current Speed Check           │
                    │ Is train docked at station?   │
                    └───────────┬────────┬──────────┘
                            YES ↙        ↖ NO
                              ↓          ↓
                    ┌─────────────────────────┐
                    │ Check departure time    │
                    │ stoppingTime elapsed?   │
                    └───────────┬────────┬───┘
                            YES ↙        ↖ NO
                              ↓          │
                         ┌──────────┐    │
                         │ DEPART   │    │
                         │ Station  │    │
                         └──────────┘    │
                                         ↓
                            ┌───────────────────────────┐
                            │ GET EFFECTIVE MAX SPEED   │
                            │ (Rule SM-001)             │
                            │ • Small: 180px/frame      │
                            │ • Medium: 160px/frame     │
                            │ • Express: 140px/frame    │
                            │ • Freight: 120px/frame    │
                            └─────────┬─────────────────┘
                                      ↓
                            ┌───────────────────────────┐
                            │ CHECK ZONE LIMITS         │
                            │ (Rule SM-003)             │
                            │ • Station approach: 40%   │
                            │ • Switchyard: 60%         │
                            │ • Crossover: 70%          │
                            │ • Slow zone: varies       │
                            └─────────┬─────────────────┘
                                      ↓
                            ┌───────────────────────────┐
                            │ CHECK FRONT COLLISION     │
                            │ (Rule CD-001)             │
                            │ trainAhead detected?      │
                            └─────────┬────────┬────────┘
                                  YES ↙        ↖ NO
                                    ↓          │
                    ┌───────────────────────┐  │
                    │ Apply Graduated       │  │
                    │ Response (SP-001)     │  │
                    │ • >600px: 100%        │  │
                    │ • 300px: 70%          │  │
                    │ • 100px: 50%          │  │
                    │ • <0px: 30%           │  │
                    └──────────┬────────────┘  │
                               ↓               │
                    ┌──────────────────────────┐
                    │ CHECK REAR TRAIN         │
                    │ (Rule CD-002, SP-004)    │
                    │ trainBehind faster?      │
                    └──────────┬─────────┬─────┘
                           YES ↙         ↖ NO
                             ↓           │
                    ┌──────────────────┐ │
                    │ Check spacing:   │ │
                    │ minSpace =       │ │
                    │ 300+(speed×3)    │ │
                    │ if <, slow down  │ │
                    │ (×0.85)          │ │
                    └────────┬─────────┘ │
                             ↓           │
                    ┌──────────────────────────┐
                    │ CALCULATE TARGET SPEED  │
                    │ = MIN of all limits     │
                    │ (effective speed cap)   │
                    └────────┬────────────────┘
                             ↓
                    ┌──────────────────────────┐
                    │ CURRENT SPEED vs TARGET │
                    └─────────┬────────┬───────┘
                         LO ↙         ↖ HI
                           ↓          ↓
                    ┌──────────┐ ┌──────────┐
                    │ACCELERATE│ │DECELERATE│
                    │ +5 px/f² │ │ ×0.95    │
                    │(SM-002)  │ │(SM-004)  │
                    └────┬─────┘ └────┬─────┘
                         ↓            ↓
                    ┌───────────────────────┐
                    │ CLAMP SPEED           │
                    │ speed = MAX(0,        │
                    │         MIN(speed,    │
                    │             maxSpeed))│
                    └──────────┬────────────┘
                               ↓
                            DONE
```

---

## COLLISION AVOIDANCE RESPONSE MATRIX

```
╔════════════════════════════════════════════════════════════════════════════╗
║                    COLLISION RISK RESPONSE MATRIX                          ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  DISTANCE    │  RISK %  │  RESPONSE            │  RULE   │  VISUAL         ║
║  ─────────────┼──────────┼─────────────────────┼─────────┼────────────────  ║
║  > 600px      │    0-10%  │  Continue normal    │ CD-001  │  🟢 GREEN       ║
║               │           │  operations         │         │                 ║
║  ─────────────┼──────────┼─────────────────────┼─────────┼────────────────  ║
║  300-600px    │   10-40%  │  Reduce to 70%     │ SP-001  │  🟡 YELLOW      ║
║               │           │  speed              │ Level 1 │  Caution        ║
║               │           │  Increase detection │         │                 ║
║  ─────────────┼──────────┼─────────────────────┼─────────┼────────────────  ║
║  100-300px    │   40-70%  │  Reduce to 50%     │ SP-001  │  🟠 ORANGE      ║
║               │           │  speed              │ Level 2 │  Alert          ║
║               │           │  Sound warning      │         │  (Blink)        ║
║  ─────────────┼──────────┼─────────────────────┼─────────┼────────────────  ║
║  50-100px     │   70-90%  │  Reduce to 30%     │ SP-001  │  🔴 RED         ║
║               │           │  speed              │ Level 3 │  Urgent         ║
║               │           │  Try lane change    │ TL-002  │  (Flash)        ║
║  ─────────────┼──────────┼─────────────────────┼─────────┼────────────────  ║
║  0-50px       │   90-100% │  EMERGENCY BRAKE   │EM-001   │  ⚫ CRITICAL    ║
║               │           │  speed = 10%       │ TL-002  │  (Pulsing Red)  ║
║               │           │  Force lane change │         │                 ║
║               │           │  If still critical:│         │                 ║
║               │           │  Emergency backup  │EM-002   │                 ║
║  ─────────────┴──────────┴─────────────────────┴─────────┴────────────────  ║
║                                                                              ║
║  DECISION LOGIC:                                                            ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  IF (riskLevel > 50% AND safeToChangeLane) THEN attemptLaneChange()        ║
║  ELSE IF (riskLevel > 70%) THEN emergencyBrake()                           ║
║  ELSE IF (riskLevel > 40%) THEN applyGraduatedResponse(distance)           ║
║                                                                              ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## STATION DOCKING SEQUENCE

```
                         STATION APPROACH
                              ↓
                    ┌──────────────────────┐
                    │ Detection Zone Entry │
                    │ (400px before)       │
                    │ (Rule SA-001)        │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ Speed Reduction      │
                    │ to 40% max           │
                    │ (Rule SM-003)        │
                    └──────────┬───────────┘
                               ↓
                    ┌──────────────────────┐
                    │ Platform Allocation  │
                    │ (Rule SA-002)        │
                    │ Select available PF  │
                    └──────┬───────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │         Platform Available?          │
        └──────────┬────────────────┬──────────┘
           YES ↙    ↖ NO
             ↓       ↓
    ┌────────────────┐    ┌─────────────────┐
    │ TARGET Y to PF │    │ Add to queue    │
    │ Decelerate to  │    │ (Rule WQ-001)   │
    │ 20% speed      │    │ Wait behind     │
    │ (Rule SA-003)  │    │ others          │
    └────────┬───────┘    └────────┬────────┘
             ↓                     ↓
    ┌──────────────────┐   ┌──────────────────┐
    │ Train fully      │   │ When ahead train │
    │ stopped at PF    │   │ departs:         │
    │ (Rule SA-003)    │   │ Reactivate this  │
    │ (Rule SA-003)    │   │ sequence         │
    └────────┬─────────┘   └────────┬─────────┘
             ↓             └────────┬─────────┘
    ┌──────────────────┐            ↓
    │ DOCKED STATE     │
    │ ───────────────  │
    │ • Doors close    │
    │ • Passengers     │
    │   board/alight   │
    │ • Waiting time:  │
    │   15-20 sec      │
    │ (Rule SA-004)    │
    │ • Update count   │
    │   every 3 sec    │
    │ (Rule SA-005)    │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ Check Departure  │
    │ Clearance        │
    │ (Rule SA-006)    │
    │ • Doors closed?  │
    │ • Next station   │
    │   valid?         │
    │ • No collision   │
    │   ahead?         │
    └────────┬─────────┘
             ↓
    ┌──────────────────┐
    │ DEPART STATION   │
    │ Speed up to      │
    │ cruising speed   │
    └──────────────────┘
```

---

## LANE CHANGE DECISION TREE

```
                    Train Speed OK?
                    Safe to change lanes?
                         ↓
              ┌────────────────────────┐
              │ Between Stations?      │
              │ (Rule TL-001)          │
              │ Allowed zone check     │
              └────────┬───────────────┘
                       ↓
                YES?  NO?
                  ↓    ↓
            ┌─────┐ CONTINUE
            │     │  IN LANE
            ↓     └──────────
      ┌──────────────────────┐
      │ Collision Risk?      │
      │ (Rule TL-002)        │
      │ trainAhead OR        │
      │ trainBehind?         │
      └────────┬──────────────┘
               ↓
        YES? (Forced)   NO? (Voluntary)
          ↓              ↓
      ┌────────────┐  ┌─────────────────┐
      │Emergency   │  │Overtaking       │
      │Lane Change │  │Opportunity      │
      │(TL-002)    │  │(TL-001)         │
      └────┬───────┘  └────────┬────────┘
           ↓                   ↓
      ┌────────────────────────────────┐
      │ Find Available Lane             │
      │ (Rule TL-004)                   │
      │ Check no trains in target lane  │
      │ within 400px                    │
      └────────┬─────────────────────────┘
               ↓
          AVAILABLE?
           ↙      ↖
         YES       NO
          ↓        ↓
      ┌──────┐   ABORT
      │Start │   Lane Change
      │Lane  │   Remain in
      │Change│   current lane
      │      │
      │Smooth
      │cosine
      │interp.
      │over
      │3 sec
      │(TL-001)
      └──────┘
        ↓
    LANE SHIFT
    COMPLETE
```

---

## QUEUE MANAGEMENT AT STATION

```
STATION WITH LIMITED PLATFORMS
        ↓
┌───────────────────────┐
│  Total Platforms: 6   │
│  Available: 1, 3, 5   │
│  Occupied: 2, 4, 6    │
└───────┬───────────────┘
        ↓
INCOMING TRAINS
│
├─ T001 (Express) - Distance: 150px
│  → Allocate Platform 1
│  → Dock immediately
│  → Stopping time: 20 sec (Rule SA-004)
│
├─ T002 (Suburban) - Distance: 450px  
│  → In detection zone
│  → Allocate Platform 3
│  → Dock immediately
│  → Stopping time: 15 sec
│
├─ T003 (Freight) - Distance: 900px
│  → Approaching detection zone
│  → No platform available
│  → Queue Position: 1
│  → Target Position: ~200px before station
│  → Estimated wait: 25 sec + departure time
│  → (Rule WQ-001, WQ-002)
│  → Speed: Reduced to 50%
│
├─ T004 (Suburban) - Distance: 1100px
│  → Far approach
│  → Queue Position: 2
│  → Target Position: ~400px before station
│  → Estimated wait: 50+ sec
│  → (Rule WQ-001)
│  → Speed: Normal (until entering detection)
│
└─ T005 (Express) - Distance: 1300px
   → Queue Position: 3
   → Can skip queue? (Rule WQ-003)
   → Delay < 5 min? → YES
   → Queue length < 3? → NO (3 waiting)
   → Cannot skip ahead
   → Must wait

TIMELINE:
─────────────────────────────────────────────
0s:   T001, T002 arrive and dock
15s:  T002 departs
20s:  T001 departs → Platform 2 freed
20s:  T003 allocated Platform 4
20s:  T003 starts docking
      Speed: Decelerate to 20%
22s:  T003 fully stopped at Platform 4
23s:  T004 in detection zone
23s:  Allocate Platform 6 (freed)
25s:  T004 docking
30s:  T003 passengers complete, ready to depart
32s:  T003 departs → Queue clears slightly
      T005 can advance into queue
40s:  T004 departs
```

---

## PRIORITY-BASED YIELDING

```
SCENARIO: Faster Express train (T100) approaching slower Suburban (T200)

Train States:
─────────────
T200 (Suburban):
  • Current speed: 140 px/frame
  • Priority level: 2 (low)
  • Position: 500px before station

T100 (Express):
  • Current speed: 160 px/frame
  • Priority level: 3 (medium)
  • Position: 200px behind T200 (400px total behind station)
  • Closing speed: 20 px/frame

Decision Logic (Rule PR-002):
─────────────────────────────
1. Detect: trainBehind.priority (3) > currentTrain.priority (2)
   → T200 should YIELD

2. Speed differential: 20 px/frame
   → Force slow down

3. Apply yielding:
   T200.speed *= 0.80  (reduce to 112 px/frame)
   T200.yieldingTo = "T100"

4. Result:
   • T100 catching up faster: 160 - 112 = 48 px/frame closing speed
   • Distance: 400px
   • Time to overtake: ~8 seconds
   • Overtaking happens in safe zone (between stations)
   
5. After overtake:
   T200.yieldingTo = null
   T200.speed gradually returns to 140 px/frame

VISUAL FEEDBACK:
───────────────
T200 Alert State: YELLOW
  • Blink intensity increases as T100 approaches
  • Visual indicator shows "Being passed by Priority Train"
  
T100 Alert State: GREEN
  • Continues normal operations
  • No braking needed
  • Successfully overtakes in queue
```

---

## EMERGENCY RESPONSE CASCADE

```
┌──────────────────────────────────────────────────────────────┐
│              IMMINENT COLLISION DETECTED                     │
│              Distance < 50px, Risk = 95%                     │
│              (Rule EM-001)                                   │
└─────────────┬────────────────────────────────────────────────┘
              ↓
   ┌──────────────────────────────────────────┐
   │ LEVEL 1: EMERGENCY BRAKE (Immediate)     │
   │ ────────────────────────────────────────  │
   │ train.speed = speed × 0.10               │
   │ alertState = 'CRITICAL'                  │
   │ emergencyActive = true                   │
   │ Time: T+0ms                              │
   └──────────────┬───────────────────────────┘
                  ↓
   ┌──────────────────────────────────────────┐
   │ LEVEL 2: ATTEMPT LANE CHANGE (T+200ms)   │
   │ ────────────────────────────────────────  │
   │ if (safeToChangeLane) then:               │
   │   changeLane(targetLane)                 │
   │   speed += 20  (small accel to escape)   │
   │   → Try to create space                  │
   └──────────────┬───────────────────────────┘
                  ↓
        Still Too Close?
         ↙          ↖
       YES           NO
        ↓            ↓
    ┌────────────────────────────────────┐
    │ LEVEL 3: DEADLOCK PREVENTION (T+2s)│
    │ ────────────────────────────────────│
    │ if (timeInDeadlock > 5s) then:      │
    │   reverse train slightly            │
    │   train.speed = -10                 │
    │   Log: DEADLOCK RECOVERY            │
    │   → Create separation for recovery  │
    └────────────┬─────────────────────────┘
                 ↓
    ┌──────────────────────────────────────┐
    │ LEVEL 4: RECOVERY (T+3s)             │
    │ ────────────────────────────────────  │
    │ if (spacing > 600px AND safe) then:  │
    │   emergencyActive = false            │
    │   Resume normal speed control        │
    │   → Back to standard rules           │
    └──────────────┬──────────────────────┘
                   ↓
            NORMAL OPERATIONS
```

---

## SPEED ZONE ENFORCEMENT

```
TRACK LAYOUT WITH SPEED ZONES:

0px      CGL    |══════════════════════════════════════════════|  600px
├─────────┤    Station Approach Zone (400px)    Speed: 40%
                                                   

600px          |═══════════════════════════════════════════════════════|
               │  Inter-station Normal Zone                            │
               │  Speed: 100% (limited by train type)                  │
               └─────────────────────┬──────────────────────────────────

1600px              Switchyard Begins
├────────────────┤  Sprawl offset: 300% for large stations
                 |═══════════════════════════════════════════════════|
                 │  Switchyard Zone (2400px for Chennai Central)  │
                 │  Speed: 60% (curved tracks, interlocking)      │
                 │  Lane changes only in safe sub-zones           │
                 └────────────────────┬──────────────────────────

2600px              Crossover Zone
                 |═════════════════════════════════════════════════════|
                 │  Physical Interlocking (Maraimalai Nagar)         │
                 │  Speed: 70% (diagonal crossing)                    │
                 │  Mandatory lane shift for exit trains             │
                 └────────────────────┬───────────────────────────────

3200px              Exit and approach to Tambaram
                 |═════════════════════════════════════════════════════|
                 │  Inter-station Normal (1600px)                      │
                 │  Speed: 100%                                        │
                 └────────────────────┬────────────────────────────────

4400px              Tambaram Station
                 |═════════════════════════════════════════════════════|
                 │  Station Approach Zone (400px before)           │
                 │  Speed: 40%                                     │
                 │  Switchyard: 60%                                │
                 └────────────────────┬─────────────────────────────

...continues for 15 stations...


SPEED OVERRIDE PRIORITY (Lowest wins):
─────────────────────────────────────────
1. Base speed by train type (highest)
2. Zone speed limit
3. Station approach limit
4. Collision avoidance limit
5. Queue/platform limit (lowest)
```

---

## KEY METRICS & MEASUREMENTS

```
DISTANCE METRICS:
─────────────────
Forward Collision Scan:        600px
Rear Collision Scan:           800px
Station Detection Zone:        400px
Lane Change Safe Zone:         200-1600px (between stations)
Minimum Platform Spacing:      300px + (speed × 3)
Queue Spacing (between trains):200px per position

TIME METRICS (at 30fps frame rate):
──────────────────────────────────
Frame duration:                30ms
Standard station stop:         15 seconds (450 frames)
Express station stop:          20 seconds (600 frames)
Small station stop:            10 seconds (300 frames)
Lane change duration:          3 seconds (90 frames)
Passenger transfer interval:   3 seconds
Emergency brake recovery:      3 seconds minimum
Deadlock timeout:              5 seconds

SPEED METRICS (pixels/frame):
──────────────────────────────
Train type              Max Speed   Acceleration   Emergency Brake
─────────────────────────────────────────────────────────────────
Small (<500 pax)       180 px/f      5 px/f²        to 10% speed
Medium (500-1k pax)    160 px/f      5 px/f²        to 10% speed
Express               140 px/f      5 px/f²        to 10% speed
Freight                120 px/f      5 px/f²        to 10% speed

Braking Factors:
Standard braking:      ×0.95 per frame
Emergency braking:     ×0.10 (immediate)
Cascade braking:       ×0.85 per frame (train following)

PASSENGER METRICS:
──────────────────
Boarding/Alighting per event:  50-150 pax
Event interval:                3 seconds
Max train capacity:            600-1100 pax (varies)
Platform crowding threshold:   >500 waiting
Passenger time bonus:          +2 sec per 100 waiting

QUALITY METRICS:
────────────────
FPS target:                    30 fps (33ms per frame)
Max active trains:             12 simultaneous
Log retention:                 Last 1000 events
Spawn interval:                30-60 seconds
Min speed (crawl):             5 pixels/frame
```

---

## TROUBLESHOOTING SCENARIOS

```
SCENARIO 1: Trains Colliding
──────────────────────────────
Symptom: Two trains overlap visually
Root Cause Options:
  ❌ CD-001 not detecting forward train
  ❌ SP-001 not applying speed reduction
  ❌ Emergency brake (EM-001) not triggering

Check:
  1. Is CD-001 scan distance >= train separation?
  2. Is speed controller applying limits?
  3. Is collision risk > 50%?
  
Fix: Increase scan distance or lower emergency threshold

SCENARIO 2: Train Stuck in Queue
──────────────────────────────────
Symptom: Train not advancing to platform
Root Cause Options:
  ❌ Platform allocation failing (SA-002)
  ❌ Queue update not happening (WQ-001)
  ❌ Platform marked occupied when vacant

Check:
  1. Is platform.occupied flag being updated?
  2. Are dockedAtTime + stoppingTime being compared?
  3. Is canDepart (SA-006) returning false incorrectly?

Fix: Verify platform state transitions in PM-001

SCENARIO 3: Trains Changing Lanes Erratically
───────────────────────────────────────────────
Symptom: Trains zigzagging across tracks
Root Cause Options:
  ❌ TL-001 safety check not working
  ❌ Lane availability being checked incorrectly
  ❌ No rate limiting on lane changes

Check:
  1. Is isSafeLaneChange() checking collision risk?
  2. Are lanes being marked occupied correctly?
  3. Is laneChangeInProgress flag preventing double-changes?

Fix: Add debouncing to lane change requests

SCENARIO 4: Speeds Not Respecting Zones
─────────────────────────────────────────
Symptom: Trains speeding through stations
Root Cause Options:
  ❌ SM-003 zone limits not applied
  ❌ Station approach detection (SA-001) failing
  ❌ effectiveMaxSpeed not being enforced

Check:
  1. Are slowZones defined for all stations?
  2. Is getEffectiveMaxSpeed() being called?
  3. Is actual speed being clamped to effective max?

Fix: Verify speed controller integrates all limits

SCENARIO 5: Platform Starvation
────────────────────────────────
Symptom: One platform always occupied, others empty
Root Cause Options:
  ❌ SA-002 allocating same platform repeatedly
  ❌ Stopping time too long
  ❌ Departure clearance (SA-006) too strict

Check:
  1. Is platform allocation random?
  2. Is stoppingTime reasonable for train type?
  3. Is canDepart() being too conservative?

Fix: Add load balancing to platform allocation
```

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Use With**: TRAIN_BEHAVIOR_RULES.md + TRAIN_RULES_IMPLEMENTATION.js
