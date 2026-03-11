---
title: T-Watch Evil Portal
description: An evil portal (captive portal attack) application built for the LILYGO T-Watch S3 smartwatch for security research and education.
---

## Overview

**T-Watch Evil Portal** is a captive portal attack application designed for the LILYGO T-Watch S3 smartwatch. It creates a rogue WiFi access point with a fake login page, demonstrating how captive portal phishing attacks work on a wearable, concealable device.

**GitHub:** [voidReq/T-Watch_Evil_Portal](https://github.com/voidReq/T-Watch_Evil_Portal)

> **Disclaimer:** Purely built for educational purposes. Never deployed in public.

## Tech Stack

- **Hardware:** LILYGO T-Watch S3
- **Languages:** C++ (Arduino), HTML/CSS (captive portal page)
- **Platform:** Arduino/PlatformIO

## How It Works

1. **Access Point Creation** — The watch creates a WiFi network with a configurable SSID (default: `GoogleFree`)
2. **Captive Portal** — When a device connects, it is redirected to a fake login page at `192.168.1.1`
3. **Credential Capture** — Submitted credentials are logged and stored
4. **Data Retrieval** — Captured data is accessible at `192.168.1.1/info.txt`

## Technical Details

- **Default SSID:** `GoogleFree`
- **Portal IP:** `192.168.1.1`
- **Credential Log:** `192.168.1.1/info.txt`
- **Compatibility:** Support varies depending on how individual phones handle captive portal detection

## Security Research Value

This project demonstrates several important attack concepts:

- **Rogue access points** — How attackers create fake WiFi networks to lure victims
- **Captive portal abuse** — Exploiting the auto-redirect mechanism phones use for WiFi login pages
- **Social engineering** — Using believable SSIDs (like "GoogleFree") to increase connection rates
- **Wearable attack platforms** — How small, concealable devices can be used for wireless attacks
- **Defense awareness** — Why you should never enter credentials on unfamiliar WiFi login pages
