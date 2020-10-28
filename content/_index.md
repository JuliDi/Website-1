+++
title = "FutureSDR"
+++

# Welcome

{{ yt(id="G9SBruN9V-I") }}

## Features

An experimental asynchronous SDR runtime for heterogeneous architectures that
is:

* **Extensible**: custom buffers (supporting accelerators like GPUs and FPGAs)
  and custom schedulers (optimized for your application).

* **Asynchronous**: solving long-standing issues around IO, blocking, and
  timers.

* **Portable**: Linux, Windows, Mac, WASM, Android, and prime support for
  embedded platforms through a REST API and web-based GUIs.

* **Fast**: SDR go brrr!

## Overview

FutureSDR supports *Blocks* with synchronous or asynchronous implementations for
stream-based or message-based data processing. Blocks can be combined to a
*Flowgraph* and launched on a *Runtime* that is driven by a *Scheduler*. It
includes:

* Single and multi-threaded schedulers, including examples for
  application-specific implementations.
* Portable GPU acceleration using the Vulkan API (supports Linux, Windows,
  Android, ...).
* User space DMA driver for Xilinx Zynq to interface FPGAs.
