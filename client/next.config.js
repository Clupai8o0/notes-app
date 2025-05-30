/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,
	async redirects() {
		return [
			// Main page redirects
			{
				source: "/app",
				destination: "/",
				permanent: true,
			},
			{
				source: "/home",
				destination: "/",
				permanent: true,
			},
			{
				source: "/dashboard",
				destination: "/",
				permanent: true,
			},
			// Auth page redirects
			{
				source: "/auth",
				destination: "/auth/login",
				permanent: true,
			},
			{
				source: "/signin",
				destination: "/auth/login",
				permanent: true,
			},
			{
				source: "/signup",
				destination: "/auth/register",
				permanent: true,
			},
			{
				source: "/register",
				destination: "/auth/register",
				permanent: true,
			},
			{
				source: "/login",
				destination: "/auth/login",
				permanent: true,
			},
		];
	},
};

module.exports = nextConfig