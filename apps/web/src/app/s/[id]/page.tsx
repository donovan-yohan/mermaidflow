import { notFound } from 'next/navigation';
import { SessionWorkspace } from '../../../components/session-workspace';
import { isValidSessionId } from '../../../lib/session';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!isValidSessionId(id)) {
    notFound();
  }

  return <SessionWorkspace sessionId={id} />;
}
