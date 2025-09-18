/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,

  /**
   * If you have the ESLint configured for your project, you can keep this rule enabled.
   *
   * @see https://nextjs.org/docs/basic-features/eslint
   */
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

export default config;
