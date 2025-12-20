// bun-env.d.ts
/// <reference types="bun-types" />

declare module "*.html" {
  const content: string;
  export default content;
}

declare module "*.svg" {
  import * as React from "react";
  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >;
  const src: string;
  export default src;
}

// Env variables type definition
declare namespace NodeJS {
  interface ProcessEnv extends Record<string, string | undefined> {
    NODE_ENV: "development" | "production" | "test";
    PORT?: string;
  }
}
