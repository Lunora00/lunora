"use client";

import React, { useEffect, useState, useCallback } from "react";
import AllSessionsList from "./components/AllSessionsList";
import { useHomepageData } from "../hooks/useHomepageData";
import LoadingScreen from "../LoadingScreen";

const AppContainer = () => {
  const {
    session,
    sessions,
    status,
    setShowSettings,
    FREE_SESSION_LIMIT,
    router,
  } = useHomepageData();

  const [isSubjectDetailView, setIsSubjectDetailView] = useState(false);

  const handleFullScreenViewChange = useCallback((isFullScreen: boolean) => {
    setIsSubjectDetailView(isFullScreen);
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  if (status === "loading") {
    return (
      <LoadingScreen />
    );
  }



  return (
    <div className="min-h-screen w-full relative">
      <main className="flex-1 h-screen">
          <AllSessionsList 
            session={session}
            topics={(sessions as any) || []}
            loading={status === "loading"}
            status={status}
            setShowSettings={setShowSettings}
            router={router}
            FREE_SESSION_LIMIT={FREE_SESSION_LIMIT}
            onFullScreenViewChange={handleFullScreenViewChange}
          />
      </main>
    </div>
  );
};

export default AppContainer;