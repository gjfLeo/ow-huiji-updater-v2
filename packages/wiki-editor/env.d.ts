declare module "bun" {
  interface Env {
    HUIJI_AUTH_KEY: string;
    HUIJI_USERNAME: string;
    HUIJI_PASSWORD: string;
    HUIJI_DEVELOPER_USERNAME: string;
    HUIJI_DEVELOPER_PASSWORD: string;
  }
}
