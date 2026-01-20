"use client"
import React from 'react';
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import Image from 'next/image';
import LoadingScreen from '../LoadingScreen';


const SignInPage = () => {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = React.useState(false);
const handleNavigate = (path: string) => {
  setIsNavigating(true);
  router.push(path);
};


  // 2. Updated login handler
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Step A: Sign in with Firebase Popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Step B: Check if user exists in Firestore, if not, create them
      // This is the "Kid" info/metadata you wanted to save
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // Always lowercase email for consistency with webhook matching
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email?.toLowerCase() || user.email,
          plan: "free",
          isPro: false,
          usedSessions: 0,
          createdAt: serverTimestamp(),
          mascot: "normal", // Set your default mascot here
        });
      } else {
        // Update email to lowercase if it exists (for existing users)
        const existingData = userSnap.data();
        if (existingData.email && existingData.email !== existingData.email.toLowerCase()) {
          await updateDoc(userRef, {
            email: existingData.email.toLowerCase(),
          });
        }
      }

      // Step C: Redirect to the main page
      router.push('/main');
    } catch (error) {
      console.error("Firebase Login Error:", error);
      alert("Failed to sign in with Google.");
    }
  };

  if (isNavigating) return <LoadingScreen />;

  return (
  <div className="flex min-h-screen">
      {/* Left side image */}
<div className="w-1/2 relative min-h-screen [@media(max-width:770px)]:hidden">
  <div className="relative w-full h-full">
  <Image
    src="/Gemini_Generated_Image_raxn1fraxn1fraxn.png"
    alt="Owl in night"
    fill
    className="object-cover"
  />
</div>

</div>


      {/* Right side form */}
      <div className="flex flex-col w-full md:w-1/2 justify-center items-center p-10 bg-[#F8F9FB]">
        <div className="max-w-sm w-full text-center">
          <h1 className="text-3xl font-extrabold mb-2 text-[#1B3358]">
            Sign in / Sign up
          </h1>
          <p className="text-sm text-gray-600 mb-8 mt-4">
            We'll sign you in or create an account if you don't have one yet
          </p>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-3 w-full py-4 bg-[#1B3358] text-white rounded-full font-bold cursor-pointer shadow-lg hover:bg-[#152645] transition-all duration-300 hover:shadow-xl active:scale-95"
          >
<div className="relative w-6 h-6">
  <Image
    src="/icons8-google.svg"
    alt="Google"
    fill
    className="object-contain"
  />
</div>
            Continue with Google
          </button>

          {/* Terms */}
          <p className="text-xs text-gray-400 uppercase mt-6">
            By signing up or signing in, you agree to our{" "}
            <button onClick={() => handleNavigate("/terms-and-conditions")} className="underline">
              Terms
            </button>{" "}
            and{" "}
            <button onClick={() => handleNavigate("/privacy-policy")} className="underline">
              Privacy Policy
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
