import { LandingPageClient } from '../components/landing-page-client';
import { randomSessionId } from '../lib/session';

export default function LandingPage() {
  return <LandingPageClient suggestedSessionId={randomSessionId()} />;
}
