/**
 * React Native compatible URL parameter utilities
 * 
 * URLSearchParams is not fully supported in React Native,
 * so we provide compatible alternatives.
 */

export class URLSearchParamsPolyfill {
  private params: Record<string, string> = {};

  constructor(init?: Record<string, string> | string) {
    if (typeof init === 'string') {
      // Parse existing query string
      if (init.startsWith('?')) {
        init = init.slice(1);
      }
      init.split('&').forEach(pair => {
        const [key, value] = pair.split('=');
        if (key && value) {
          this.params[decodeURIComponent(key)] = decodeURIComponent(value);
        }
      });
    } else if (init) {
      this.params = { ...init };
    }
  }

  append(name: string, value: string): void {
    this.params[name] = value;
  }

  set(name: string, value: string): void {
    this.params[name] = value;
  }

  get(name: string): string | null {
    return this.params[name] || null;
  }

  has(name: string): boolean {
    return name in this.params;
  }

  delete(name: string): void {
    delete this.params[name];
  }

  toString(): string {
    return Object.entries(this.params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
  }
}

/**
 * Build a query string from an object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined | null>): string {
  const validParams: Record<string, string> = {};
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      validParams[key] = String(value);
    }
  });

  return new URLSearchParamsPolyfill(validParams).toString();
}

/**
 * Append query string to URL
 */
export function appendQueryString(url: string, params: Record<string, string | number | boolean | undefined | null>): string {
  const queryString = buildQueryString(params);
  if (!queryString) return url;
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${queryString}`;
}