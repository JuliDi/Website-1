+++
title = "Generic Blocks for Rapid Prototyping"
template = "article.html"
+++

FutureSDR misses basically all blocks at this stage. Fortunately, people started [contributing](https://github.com/FutureSDR/FutureSDR/pull/10) some of them, including blocks to add or multiply a stream with a constant. This block was implemented in way so that it was generic over the arithmetic operation. Thinking a bit further about the concept, we realized that it can be extended to arbitrary operations, creating blocks that are generic over function closures.

Meet our new blocks: *Source, FiniteSource, Apply, Combine, Split*, and *Filter*, all of which are generic over mutable closures. This can come in handy to quickly hack something together. Let me give you some examples.

### Sources

Need a constant source that produces 123 as `u32`?

```rust
use futuresdr::blocks::Source;

let _ = Source::new(|| 123u32);
```

The *Source* block is generic over `FnMut() -> A`. It recognizes the output type (in this case `u32`) and creates the appropriate stream output.

Need a source that iterates again and again over a range or vector?

```rust
let mut v = (0..10).cycle();
let _ = Source::new(move || v.next().unwrap());
```

<!-- more -->

Notice, how this closure is mutable (i.e., has state). One could just as well create a counter or implement a signal source that keeps the current phase as state, etc.

```rust
let mut i = 0u32;
let _ = Source::new(move || { i += 1; i });
```

Sometimes, the function signature and, hence, the data type of the output might not be obvious. In this  case, we can be more explicit:

```rust
let mut i = 0u32;
let _ = Source::new(move || -> u32 { i += 1; i });
```

Now, what about a finite source? One could, of course, add a *Head* block after the source and terminate after a given number of items. But this might not be ideal for all use cases. So we added a *FiniteSource* that returns `Option<A>` and stops once the closure returns `None`.

A vector source that terminates, once it outputted all items would be:

```rust
use futuresdr::blocks::FiniteSource;

let mut v = vec![1, 2, 3].into_iter();
let _ = FiniteSource::new(move || v.next());
```

### Apply, Combine, Split

A similar concept can be realized for simple operations on streams. Need a block that constrains an `f32` in an interval between -1 and 1?

```rust
use futuresdr::blocks::Apply;

let _ = Apply::new(|x: &f32| x.clamp(-1.0, 1.0));
```

Need a block that adds 42 to a `u32` and returns the result as `f32`?

```rust
let _ = Apply::new(|x: &u32| *x as f32 + 42.0);
```

The *Apply* block is generic over `FnMut(&A) -> B`, i.e., any mutable closure that gets a reference to an item of type `A` in the input buffer and produces an item of type `B` that will be written to the output buffer.

Since input and output types can be different, we can implement a block that computes the magnitude of a complex number, for example.

```rust
let _ = Apply::new(|x: &Complex<f32>| x.norm());
```

Note that the closure, again, is mutable and can have state. This means, we could very easily implement an IIR filter.

```rust
let state = 0f32;
let alpha = 0.1;
let _ = Apply::new(move |x: &f32| -> f32 { state = state * alpha + (1.0 - alpha) * *x; state  } );
```

The *Combine* and *Split* blocks are conceptually similar, just that they are for functions with two inputs and outputs, respectively.
*Combine* is generic over *FnMut(&A, &B) -> C* to implement, for example, a block that adds two streams.
*Split* is generic over *FnMut(&A) -> (B, C)* to implement, for example, a block that splits a complex number in real and imaginary parts.
Examples for these blocks can be found in the corresponding [integration tests](https://github.com/FutureSDR/FutureSDR/tree/master/tests).

### Filter

A similar concepts is used in the *Filter* block, which relaxes the fixed in--out relationship of the *Apply* block.

It is generic over `FnMut(&A) -> Option<B>` and allows filtering the input stream. If the closure returns `Some(B)`, the value is written in the output buffer; if the closure returns `None`, nothing is written to the output buffer.

A stateless block that only copies even numbers would be:

```rust
use futuresdr::blocks::Filter;
let _ = Filter::new(|i: &u32| -> Option<u32> {
    if *i % 2 == 0 {
        Some(*i)
    } else {
        None
    }
});
```

A stateful block that only copies every other sample could look like this:

```rust
let mut output = false;
let _ = Filter::new(move |i: &u32| -> Option<u32> {
    output = !output;
    if output {
        Some(*i)
    } else {
        None
    }
});
```

### Conclusion

I think these blocks are nice to quickly hack something together and can make up for a quite a few missing blocks.
Performance-wise, there might be drawbacks. The compiler would have to be really smart to figure out that it could use SIMD instructions when adding streams, for example.

Still, we think that these blocks show the bright side of using Rust. While it would be possible to implement similar blocks in other languages and other SDR frameworks, function closures and iterators are really fun with Rust.

We hope you give them a try :-)
