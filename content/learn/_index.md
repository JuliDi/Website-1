+++
title = "Introduction"
template = "learn-section.html"
+++

## Installation

### Linux

### macOS

### Windows

Hint: Always select the "Add to PATH variable option in the installers", so the required libraries and binaries are found when compiling FutureSDR programs.
To avoid performance issues and warnings (like "FutureSDR: WARN - SoapyVOLKConverters: no VOLK config file found. Run volk_profile for best performance"), please run: `volk_profile` on your command line.

Base dependencies:
- [Rust](https://www.rust-lang.org/tools/install)
- Visual Studio 2019 C++ Community Edition

For `soapy` feature:
- [PhotosSDR](https://downloads.myriadrf.org/builds/PothosSDR/) for pre-built SDR drivers. Add the path with the DLLs to your `PATH` variable.
- [bindgen dependencies](https://rust-lang.github.io/rust-bindgen/requirements.html#windows)
- [package config lite](https://sourceforge.net/projects/pkgconfiglite/)
