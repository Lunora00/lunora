"use client";

import { useRouter, useParams } from "next/navigation";
import { useAuth as useSession } from "../../hooks/useAuth";
import PracticeSheet from "./components/PracticeSheet";
import { useAllSessions } from "../../hooks/useAllSessions";

export default function SubjectPracticeSheetClient() {
  const router = useRouter();
  const params = useParams();

  const subject = params.subject as string | undefined;


  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const {
    topics,
    resetSessionForTraining,
    deleteSession,
    deleteSubjectSessions
  } = useAllSessions(userId);

  if (!subject) {
    return <div>Invalid subject</div>;
  }

  
  
  const sessions =
    topics?.filter(
      (t) => t.subject === subject
    ) ?? [];

  return (
    <PracticeSheet
      subject={subject}
      sessions={sessions}
      onClose={() => router.push("/my-library")}
      resetSessionForTraining={resetSessionForTraining as any}
      deleteSession={deleteSession}
      deleteSubjectSessions={deleteSubjectSessions}
    />
  );
}
