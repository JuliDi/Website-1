+++
title = "Introduction"
template = "learn-section.html"
+++

## Installation

### Linux

#### Ubuntu 20.04 LTS
On a fresh Ubuntu 20.04 LTS you need to install Git, Curl and Rust to start working with the FutureSDR code.

`sudo apt update`

`sudo apt install git curl -y`

`curl https://sh.rustup.rs -sSf | sh  # Install with default settings`

Reload bash to make rust and cargo available on the commandline:

`. ~/.bashrc`

Clone the FutureSDR repository:

`git clone https://github.com/FutureSDR/FutureSDR.git`

FutureSDR can be used without any SDR devices, but for a lot of fun stuff you need SDR devices.
FutureSDR is based on SoapySDR, a Vendor and platform neutral SDR support library.
Install it with the following command:

`sudo apt install libclang-dev libsoapysdr-dev libsoapysdr-doc soapysdr-tools -y`

Now, most of the examples should already compile.

##### Device specific requirements
Depending on your SDR hardware, you might need to install additional dependencies:

###### RTL-SDR
You might want to install rtl-sdr  tools and dev libraries for experimenting with your RTL-SDR device.
This is not necessarily required, but helpful for debugging, testing etc:

`sudo apt install librtlsdr-dev rtl-sdr -y`

###### BladeRF
Installation instructions for BladeRF SDR can be taken from [Nuand's wiki](https://github.com/Nuand/bladeRF/wiki/Getting-started%3A-Linux#Easy_installation_for_Ubuntu_The_bladeRF_PPA)

Install the BladeRF libraries from the Nuand PPA:

`sudo add-apt-repository ppa:nuandllc/bladerf -y # Add Nuand BladeRF PPA`

`sudo apt update`

`sudo apt install libbladerf-dev bladerf -y`

Download and upgrade firmware and FPGA images:

`sudo apt install bladerf-firmware-fx3 bladerf-fpga-hostedx115 -y # E.g. for BladeRF 1.0 with 115 KLE`

`bladeRF-cli --flash-firmware /usr/share/Nuand/bladeRF/bladeRF_fw.img # Flash Firmware from repository`

`bladeRF-cli --flash-fpga /usr/share/Nuand/bladeRF/hostedx115.rbf # Flash FPGA from repository`

If your projects require extension boards (e.g. for receiving FM radio) , they have to be enabled first. E.g.:

`bladeRF-cli --exec "xb 200 enable"`

Check the bBladeRF functionality with the integrated CLI:

`bladeRF-cli -p`


### macOS
Feel free to contribute, if you own a Mac.

### Windows

Hint: Always select the "Add to PATH variable option in the installers", so the required libraries and binaries are found when compiling FutureSDR programs.
To avoid performance issues and warnings (like "FutureSDR: WARN - SoapyVOLKConverters: no VOLK config file found. Run volk_profile for best performance"), please run: `volk_profile` on your command line.

Base dependencies:
- [Rust](https://www.rust-lang.org/tools/install)
- Visual Studio 2022 C++ Community Edition

For `soapy` feature:
- [PhotosSDR](https://downloads.myriadrf.org/builds/PothosSDR/) for pre-built SDR drivers. Add the path with the DLLs to your `PATH` variable.
- [bindgen dependencies](https://rust-lang.github.io/rust-bindgen/requirements.html#windows)
- [SDRUno](https://www.sdrplay.com/sdruno/) contains the SDRPlay API required to open e.g. RTL-SDR devices
<!-- - [package config lite](https://sourceforge.net/projects/pkgconfiglite/) -->
