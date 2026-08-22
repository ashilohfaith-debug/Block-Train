# Railway Network Data: Chengalpattu to Chennai Central

This document contains the 15 selected stations along the Chengalpattu → Chennai Central corridor, organized from South to North, along with their actual geographic coordinates (Latitude and Longitude) and their actual number of operational platforms.

## Stations List

| #  | Station Code | Station Name | Type | Latitude | Longitude | Actual Platforms |
|:---|:---|:---|:---|:---|:---|:---|
| 1 | CGL | Chengalpattu Junction | Major | 12.6934 | 79.9756 | 8 |
| 2 | SKL | Singaperumal Koil | Minor | 12.7600 | 80.0040 | 5 |
| 3 | MMNK | Maraimalai Nagar | Minor | 12.7904 | 80.0223 | 3 |
| 4 | GI | Guduvancheri | Minor | 12.8398 | 80.0601 | 4 |
| 5 | VDR | Vandalur | Minor | 12.8931 | 80.0864 | 3 |
| 6 | PRGL | Perungalathur | Minor | 12.9056 | 80.0950 | 3 |
| 7 | TBM | Tambaram | Major | 12.9249 | 80.1100 | 9 |
| 8 | CMP | Chromepet | Minor | 12.9525 | 80.1416 | 4 |
| 9 | PV | Pallavaram | Minor | 12.9691 | 80.1481 | 5 |
| 10 | STM | St. Thomas Mount | Minor | 12.9944 | 80.1989 | 5 |
| 11 | GDY | Guindy | Major | 13.0076 | 80.2115 | 4 |
| 12 | MBM | Mambalam | Minor | 13.0401 | 80.2312 | 4 |
| 13 | NBK | Nungambakkam | Minor | 13.0617 | 80.2452 | 4 |
| 14 | MS | Chennai Egmore | Major | 13.0784 | 80.2610 | 11 |
| 15 | MAS | Chennai Central | Major | 13.0827 | 80.2707 | 17 |

## Notes for the Digital Twin
* **Major Stations (CGL, TBM, GDY, MS, MAS):** These will be rendered as large bounding boxes (zones) where the tracks split into their respective numerous platforms.
* **Minor Stations:** These will be rendered as standard nodes on the mainline track, displaying their 2 to 4 platform configurations.
* **Platform Constraints:** Since the backend optimization engine will treat each platform as a separate limited resource, knowing that Tambaram has 8 platforms but Mambalam only has 4 is critical for generating realistic train diversion logic during a maintenance block.
