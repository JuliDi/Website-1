+++
title = "Full ZigBee SDR Receiver in the Browser"
template = "article.html"
+++

Some months ago, we showed a complete SDR waterfall plot running in the browser.
It interfaced an RTL-SDR from within the browser, using cross-compiled drivers.
In short, this requires compiling the driver to WebAssembly (Wasm) using [Emscripten](https://emscripten.org/) and a [shim](https://github.com/luigifcruz/webusb-libusb) that maps libusb to WebUSB calls.

Signal processing was implemented with FutureSDR.
It even supported [wgpu](https://github.com/gfx-rs/wgpu) [custom buffers](https://github.com/FutureSDR/FutureSDR/tree/master/src/runtime/buffer/wgpu) for platform-independent GPU acceleration.
Wgpu is really awesome.
It supports all major platforms, using their native backends: Linux/Android (&rarr; Vulkan), Windows (&rarr; DX12), macOS/iOS (&rarr; Metal), and Wasm (&rarr; WebGPU).


<blockquote class="twitter-tweet tw-align-center"><p lang="en" dir="ltr">FutureSDR + WebUSB + WebGPU + WebGL :-) Have an RTL-SDR and Chrome Unstable, you can give this a try: <a href="https://t.co/zmj2iQ031t">https://t.co/zmj2iQ031t</a> (need to enable unsafe WebGPU flag). <a href="https://t.co/tKaxgGAFmO">pic.twitter.com/tKaxgGAFmO</a></p>&mdash; Bastian Bloessl (@bastibl) <a href="https://twitter.com/bastibl/status/1471820778022871045?ref_src=twsrc%5Etfw">December 17, 2021</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> 


What was missing was a real, non-trivial SDR application.
We were curious what is possible, so we developed a ZigBee receiver and cross-compiled it to Wasm.
Furthermore, since the RTL-SDR doesn't work in the 2.4GHz band and doesn't provide the required bandwidth, we cross-compiled the driver of the [HackRF](https://greatscottgadgets.com/hackrf/) in a similar fashion.

To test the receiver, we generated ZigBee frames with [Scapy](https://scapy.net/) and sent them using an [ATUSB IEEE 802.15.4 USB Adapter](http://shop.sysmocom.de/products/atusb).

```python
import time
from scapy.all import *

# linux: include/uapi/linux/if_ether.h
ETH_P_IEEE802154 = 0x00f6

i = 0
while True:
    fcf = Dot15d4FCS()
    data = Dot15d4Data(dest_panid=0x47d0, dest_addr=0x0000, src_panid=0x47d0, src_addr=0xee64)
    frame_data = fcf/data/f"FutureSDR {i}"
    frame_data.show()
    sendp(frame_data, iface='monitor0', type=ETH_P_IEEE802154)
    time.sleep(0.4)
    i += 1
```

Turns out, this actually works and the 4Msps of the ZigBee receiver can be processed in real-time in the browser.
We [host a demo](https://www.fleark.de/zigbee/) on our website, which is hard-coded to ZigBee channel 26 @ 2.48GHz.
The receiver is, however, also part of the [examples](https://github.com/FutureSDR/FutureSDR/tree/master/examples/zigbee).
It works just as well as native binary outside the browser, using [SoapySDR](https://github.com/pothosware/SoapySDR) to interface the hardware.

At the moment, the FutureSDR receiver only uses one thread that is, however, separate from the HackRF RX thread, spawned by the driver.
Compiling in release mode, FutureSDR uses around 20% CPU on an Intel i7-8700K.
See the demo video here:

<blockquote class="twitter-tweet tw-align-center"><p lang="en" dir="ltr">You always wanted a full SDR ZigBee receiver in a browser? Me neither. Anyway :-)<a href="https://t.co/2J6qeVdUqO">https://t.co/2J6qeVdUqO</a></p>&mdash; Bastian Bloessl (@bastibl) <a href="https://twitter.com/bastibl/status/1496399211851661313?ref_src=twsrc%5Etfw">February 23, 2022</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script> 

And as usual, everything just works on the phone.
This is not an Android application with cross-compiled drivers.
It runs the whole ZigBee receiver in the Google Chrome browser that is shipped with my phone.
Really fascinating what is possible in the browser these days...

{{ figure(images=[['phone.jpg', 100, 'Phone Setup', 700]]) }}

If you have ideas for cool applications, feel free to reply to one of the Twitter threads :-)
