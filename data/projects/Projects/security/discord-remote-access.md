---
title: Discord Remote Access
description: A Discord-based remote access tool written in C for educational cybersecurity research.
---

## Overview

**Discord Remote Access** is a proof-of-concept remote access tool that uses the Discord API as its command-and-control (C2) channel. Written entirely in C, it demonstrates how common communication platforms can be repurposed for remote system management.

**GitHub:** [voidReq/discordRemoteAccess](https://github.com/voidReq/discordRemoteAccess)

> **Disclaimer:** This was created purely for educational purposes. It has never been deployed on unauthorized systems, and never will be. All tokens in commit history are expired.

## Tech Stack

- **Language:** C
- **Protocol:** Discord Bot API (WebSocket + REST)
- **Platform:** Windows (Visual Studio project)

## Architecture

The tool operates as a lightweight C executable that:

1. **Authenticates** with Discord's bot API using a token
2. **Listens** for commands in a designated Discord channel
3. **Executes** received commands on the host system
4. **Reports** output back through the Discord channel

This approach leverages Discord's encrypted infrastructure as the transport layer, making traffic blend in with normal Discord usage.

## Key Features

- Pure C implementation — minimal dependencies, small binary footprint
- Uses Discord as a covert C2 channel
- Demonstrates real-world social engineering attack vectors
- Educational tool for understanding remote access trojans (RATs) and their detection

## Security Research Value

This project illustrates several cybersecurity concepts:

- **Covert channels** — hiding C2 traffic in normal platform communication
- **Detection challenges** — why monitoring outbound connections to known services is important
- **API abuse** — how platform APIs can be weaponized
