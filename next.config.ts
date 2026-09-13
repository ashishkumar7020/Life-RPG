import type { NextConfig } from "next";

// Fail before bundling if a privileged credential is mistakenly put in a public variable.
for (const publicKey of [
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
]) {
  if (publicKey && !publicKey.startsWith("sb_publishable_")) {
    let role: unknown;
    try {
      role = JSON.parse(
        Buffer.from(publicKey.split(".")[1] || "", "base64url").toString()
      ).role;
    } catch {
      // Invalid keys are rejected below.
    }

    if (role !== "anon") {
      throw new Error(
        "NEXT_PUBLIC Supabase credentials must be a publishable key or a legacy anon key. Never use a privileged key."
      );
    }
  }
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
