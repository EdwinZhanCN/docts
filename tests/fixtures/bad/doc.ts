/**
 * # Ghost reference
 *
 * This module names {@link Ghost} but never imports it. tsc stays green — it
 * ignores `{@link}` entirely — so without docts the reference rots in silence.
 * `docts check` is what turns this red.
 *
 * @module
 */
export {};
