// Meta Pixel (Facebook Pixel) type definitions
interface Window {
  fbq: (...args: any[]) => void;
}

declare function fbq(...args: any[]): void;
