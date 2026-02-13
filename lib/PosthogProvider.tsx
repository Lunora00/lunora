'use client'

import { useEffect } from "react";
import { initPostHog } from "@/lib/posthog";

export default function PosthogProvider() {
  useEffect(() => {
    initPostHog();
  }, []);

  return null;
}
