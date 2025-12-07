/// <reference types="astro/client" />

declare module 'remark-copy-linked-files' {
  import type { RemarkPlugin } from '@astrojs/markdown-remark';
  
  export interface Options {
    destinationDir?: string;
    keepOriginalName?: boolean;
    filter?: (url: string) => boolean;
    url?: (url: string) => string;
  }
  
  const remarkCopyLinkedFiles: RemarkPlugin<[Options?]>;
  export default remarkCopyLinkedFiles;
}
