import { withOpenNext } from "@opennext/cf";

const nextConfig = {
  reactStrictMode: false,
  experimental: {
    optimizeCss: true
  }
};

export default withOpenNext(nextConfig);
