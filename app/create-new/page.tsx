"use client";

import SessionCreationModal from "../main/component/MainContent/create-new-component/SessionCreationModal";
import { useRouter } from "next/navigation";

export default function CreateSessionPage() {
  const router = useRouter();

  return (
    <SessionCreationModal
      isOpen={true}
      onClose={() => router.push("/main")}
    />
  );
}