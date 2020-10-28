+++
title = "Slab Buffers"
template = "article.html"
+++

Buffers are at the heart of every SDR runtime.
GNU Radio, for example, is famous for its [double-mapped circular buffers](https://www.gnuradio.org/blog/2017-01-05-buffers/).
In short, they use the [MMU](https://en.wikipedia.org/wiki/Memory_management_unit) to map the same memory twice, back-to-back in the virtual address space of the process.
This arrangement allows to implement a ring buffer on-top that always presents the available read/write space as consecutive memory, similar to a C array.
The figure below shows how a buffer, consisting of physical memory areas A and B, would be mapped.

{{ figure(images=[['double-mapped-buffer.svg', 100, 'Double-Mapped Circular Buffer', 700]]) }}

Using these buffers, blocks can assume that data is always in linear, consecutive memory.
In contrast to normal circular buffers, they do not have to care about wrapping.
This simplifies DSP implementations, in particular, for algorithms that consider multiple samples to produce output (e.g., a FIR filter).
Furthermore, samples in linear memory allow using vectorized instructions (provided by SIMD extensions), which can make a big difference [1, 2].

Given these advantages, double-mapped circular buffers were also adopted by FutureSDR.
(There is now also a [separate crate](https://github.com/FutureSDR/vmcircbuffer) for them, in case you want to roll your own SDR application without a framework or runtime.)
These buffers work well for Linux, Android, Windows, and macOS.
FutureSDR, however, also targets platforms that do not allow memory mapping (WebAssembly/WASM) or do not have a MMU in the, first place.

<!-- more -->

## Slab

For this reason, we introduced an alternate buffer implementation that works with pre-allocated, normal memory.
With custom buffers -- as supported by FutureSDR -- this is [easily possible](https://github.com/FutureSDR/FutureSDR/blob/master/src/runtime/buffer/slab.rs).
We allocate buffer memory once and keep it around for the duration of the flowgraph to avoid continuous reallocation.
This borrows ideas from a [Slab allocator](https://en.wikipedia.org/wiki/Slab_allocation), which is why we refer to these buffers as *Slab buffers*.

For every stream edge in the flowgraph, FutureSDR allocates, by default, two buffers.
This implements double-buffering, i.e., the upstream block can write into one buffer, while the downstream block reads from the other.
Everything is, however, configurable per stream connection (i.e., buffer size and number of buffers).

``` rust
fg.connect_stream(src, "out", cpy, "in")?; // default buffer for architecture
fg.connect_stream_with_type(src, "out", snk, "in", Slab::new())?;
fg.connect_stream_with_type(src, "out", snk, "in", Slab::with_size(4096))?;
fg.connect_stream_with_type(src, "out", snk, "in", Slab::with_buffers(3))?; // triple-buffering
```

## Red Slab

A straightforward implementation of a Slab buffer suffers from the issue mentioned above, i.e., we have to deal with transitions between buffers.
Consider, for example, a FIR filter with 16 taps, which needs 16 samples to calculate an output sample.
What should it do, if there are only 15 samples left in a Slab buffer?
If it doesn't consume, the flowgraph stalls forever.
So, should it copy the remaining samples to another, internal buffer and wait for the next full Slab buffer?
This leads to non-trivial logic that each block would have to implement.

Apart from that, the block does not even know that it reads from a Slab buffer.
And this is by design.
Since the runtime can be extended with arbitrary buffers, block implementations have to be independent from buffers.
But that would also mean that the block would always have to trigger the copying, even for the double-mapped buffers, which would not require this logic.

It is clear that blocks cannot solve this problem.
Instead, it has to be handled by the buffer implementation in the runtime.
For our Slab implementation, we used a little trick:
Slab buffers are, by default, not filled completely.
At the start of the buffer, there is a configurable number of reserved items that are skipped when the buffer is filled.

Now, when a block consumes items from the Slab buffer and leaves only up to `reserved_items`, the runtime waits for the next buffer and copies the remaining samples in its reserved area.
This is possible with rather simple logic, does not require shifting items in the target buffer, and puts samples in consecutive memory.
For our 16-tap FIR filter, we would have to reserve at least 15 items to make sure that it can always proceed.
When 15 samples are left, the buffer will copy them over in the reserved area of the following buffer.
We couldn't do it more efficient in the block, even if it knew about the Slab buffers.

{{ figure(images=[['slab.svg', 100, 'Red Slab', 700]]) }}

Since the approach borrows some ideas from the [red zone](https://en.wikipedia.org/wiki/Red_zone_(computing)) of a function stack, which allows using parts of the stack as scratch space, we call it *Red Slab*.

Note that we only talk about input buffers.
For output buffers it is much simpler.
Just switch to the next Slab buffer, even if it is not filled to the last sample.

## Performance

We conducted preliminary performance measurements of the different buffer implementations.
The details can be derived from the measurement scripts and flowgraphs [in the repository](https://github.com/FutureSDR/FutureSDR/tree/master/perf/buffer_rand).
In short, the measurements consider three schedulers: a single-threaded scheduler (Smol-1), a multi-threaded scheduler (Smol-N), an optimized, multi-threaded schedulers (Flow) that polls blocks in their natural order (upstream to downstream).
We make six CPU cores available to the process and use six worker threads for the multi-threaded schedulers.
The flowgraph consists of six independent subflows, each with a source that streams 200e6 32-bit floats into the flowgraph and #Stages (x-axis) number of copy blocks, each copying a random number samples (uniformly distributed in [1; 512]) in each call to work.
The Slab buffers have a reserved space of 128 items.

{{ figure(images=[['buffer.svg', 100, 'Execution Time of Flowgraphs', 700]]) }}

In the beginning, I found it surprising that the Slab buffers are faster than their circular counterpart.
But there are two arguments in favor of Slab:

- The expensive operations are the ones that have to be synchronized. For Slab, this is pushing buffers back-and-forth. But this only happens, if the buffer is full. The circular buffer, in turn, advances read/write pointers for every small chunk of samples.

- Slab always forwards full buffers with 16k samples (minus the 128 reserved). So if a block has data, it is likely that it has many samples available. A circular buffer is always called, even if the upstream just produced a few samples. Therefore, there might be iterations through the subflowgraph, where only, say, two samples are propagated.

Note, GNU Radio also got a [Slab-like buffer implementation](https://wiki.gnuradio.org/index.php/CustomBuffers#Single_Mapped_Buffer_Abstraction) in v3.10, which they refer to as *single-mapped buffers*.
Compared to the FutureSDR implementation, there seem to be some drawbacks:
- GNU Radio uses only one buffer, i.e., no double-/triple-buffering.
- Since they use only one buffer, they have to move all samples, when copying over samples from the end.

Overall, it appears that this is harder to get right, requires a complex API, and is not as efficient as it could be.

Feel free to reach out on [Twitter](https://twitter.com/FutureSDR) or [Discord](https://discord.com/invite/vCz29eDbGP/), if you have any feedback!

## References

{{ bib(keys=["west2015accelerating", "rondeau2013simd"]) }}
