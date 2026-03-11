---
title: SmartGrid IoT
description: IoT smart grid cybersecurity testbed built during a CCI internship at VMI, simulating power grid control and monitoring via MQTT.
---

## Overview

**SmartGrid_IoT** is an IoT-based smart grid simulation testbed created during a CCI (Commonwealth Cyber Initiative) High School Internship at VMI (Virginia Military Institute). The project models a small-scale power grid with generators, houses, and monitoring systems, all controllable through MQTT messaging servers.

**GitHub:** [voidReq/SmartGrid_IoT](https://github.com/voidReq/SmartGrid_IoT)

## Tech Stack

- **Language:** C++ (Arduino)
- **Hardware:** NodeMCU ESP8266, INA219 power monitors, relays, solar panel, water generator
- **Protocol:** MQTT (Message Queuing Telemetry Transport)
- **Platform:** Arduino IDE

## System Architecture

![SmartGrid IoT System Diagram](/projects/smartgrid-diagram.png)

The testbed consists of three main layers:

### Power Generation
- A **water generator** and **solar panel** feed into a 12V battery
- Relays controlled via MQTT can toggle each generator on/off independently
- Voltage sensors report real-time readings to MQTT topics (`vmi/solar/voltage`, `vmi/water/voltage`)

### Power Distribution
- The battery output is regulated from 12V down to 5V using power regulators
- A central power board distributes power to simulated "houses"
- Each house has a **fan** and **light**, individually controllable via MQTT relays

### Monitoring & Control
- **INA219 modules** measure current, wattage, and voltage per house
- All diagnostics are published to dedicated MQTT topics
- The system supports full remote control of all components

## MQTT Topic Map

```
# Reading Values
vmi/house1/current_mA    # House 1 current draw
vmi/house1/wattage_mW    # House 1 power consumption
vmi/house1/voltage        # House 1 voltage
vmi/house2/current_mA    # House 2 current draw
vmi/house2/wattage_mW    # House 2 power consumption
vmi/house2/voltage        # House 2 voltage
vmi/solar/voltage         # Solar panel voltage
vmi/water/voltage         # Water generator voltage

# Control Commands (0 = off, 1 = on)
vmi/house1/light          # Toggle house 1 light
vmi/house1/fan            # Toggle house 1 fan
vmi/house2/light          # Toggle house 2 light
vmi/house2/fan            # Toggle house 2 fan
vmi/water/toggle          # 0/1 for water, 2/3 for solar
```
