"use client";
import React from "react";
import MainContent from "./component/MainContent/MainContent";
import { useHomepageData, Recommendation } from "../hooks/useHomepageData"; 
import LoadingScreen from "../LoadingScreen";

const Homepage = () => {
    const {
        session,
        status,
        sessions,
        isLoading, // <--- This is key
        usedSessions,
        isFirebaseLoading, // <--- And this
        FREE_SESSION_LIMIT,
        router,
        handleSignOut,
        handleDeleteAccount,
        handleChangeName, 
        handleDeleteAllSessions,
        handleCreateNew, 
        mascot,               
        setMascot,            
        handleChangeMascot,
        setShowSettings,
    } = useHomepageData(); 

    const userid = session?.user.id;
    const userEmail = session?.user.email;

    // 1. AUTH GUARD: Only wait for auth if NOT authenticated and no cached data
    if (status === "loading" && !userid) {
        return <LoadingScreen />;
    }

    if (status === "unauthenticated" && !userid) {
        return null;
    }

    // 2. SHOW CACHED DATA IMMEDIATELY - don't wait for Firebase
    // Firebase updates happen in background
    if (!sessions) {
        return <LoadingScreen />;
    }

    return (
        <div className="w-full animate-in fade-in duration-500">
            <MainContent
                session={session}
                sessions={sessions as any}
                handleCreateNew={handleCreateNew}
                setShowSettings={setShowSettings}
                router={router}
                mascot={mascot}
                userid={userid}
                usedSessions={usedSessions}
                FREE_SESSION_LIMIT={FREE_SESSION_LIMIT}
                userEmail={userEmail || undefined}
                isFirebaseLoading={isFirebaseLoading}
                setMascot={setMascot}
                handleChangeMascot={handleChangeMascot}
                handleSignOut={handleSignOut}  
                handleDeleteAccount={handleDeleteAccount}
                handleChangeName={handleChangeName} 
                handleDeleteAllSessions={handleDeleteAllSessions}
            />
        </div>
    );
};

export default Homepage;