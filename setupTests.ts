import "@testing-library/jest-dom";

// Add TextEncoder and TextDecoder polyfills for pg module
global.TextEncoder = global.TextEncoder || require('util').TextEncoder;
global.TextDecoder = global.TextDecoder || require('util').TextDecoder;