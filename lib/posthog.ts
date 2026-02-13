import posthog from 'posthog-js'

export const initPostHog = () => {
  if (typeof window === 'undefined') return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: 'https://app.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false, // we will handle manually
  })
}

export default posthog
