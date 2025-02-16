declare module "hono" {
  interface ContextVariableMap {
    port: number;
    hostname: string;
    privateUrl: string;
    generateApiUrl: string;
    varDir: string;
    rtmpApiUrl: string;
    rtmpStreamPort: string;
    rtmpUdpRange: string;
  }
}
