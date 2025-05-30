import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
	reactStrictMode: true,
	// output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
	webpack: (config) => {
		config.watchOptions = {
			poll: 1000,
			aggregateTimeout: 300,
			ignored: ["**/node_modules", "**/.git"],
			followSymlinks: true,
		};
		return config;
	},
	experimental: {
		webpackBuildWorker: true,
	},
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

export default nextConfig;
