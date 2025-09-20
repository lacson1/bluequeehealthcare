import { useState, useEffect } from "react";

interface OnboardingState {
  hasCompletedTour: boolean;
  lastLoginDate: string | null;
  tourVersion: string;
  hasSeenTour: boolean;
  skipTourPermanently: boolean;
}

export function useOnboarding(userId: number, userRole: string) {
  const [showTour, setShowTour] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const CURRENT_TOUR_VERSION = "1.0";
  const STORAGE_KEY = `onboarding_${userId}`;

  useEffect(() => {
    const checkOnboardingStatus = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const today = new Date().toDateString();
        
        if (!stored) {
          // Completely new user
          setIsNewUser(true);
          setShowTour(true);
          return;
        }

        const onboardingData: OnboardingState = JSON.parse(stored);
        
        // Show tour only if:
        // 1. User hasn't seen tour AND hasn't permanently skipped it
        // 2. Tour version has been updated (only if they haven't permanently skipped)
        const shouldShowTour = 
          (!onboardingData.hasSeenTour && !onboardingData.skipTourPermanently) ||
          (!onboardingData.skipTourPermanently && onboardingData.tourVersion !== CURRENT_TOUR_VERSION);

        if (shouldShowTour) {
          setShowTour(true);
          if (!onboardingData.hasSeenTour) {
            setIsNewUser(true);
          }
        }

        // Update last login date
        updateLastLogin();
        
      } catch (error) {
        console.log('Error checking onboarding status, showing tour for safety');
        setIsNewUser(true);
        setShowTour(true);
      }
    };

    checkOnboardingStatus();
  }, [userId, STORAGE_KEY]);

  const isMoreThan30DaysAgo = (dateString: string): boolean => {
    const lastLogin = new Date(dateString);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return lastLogin < thirtyDaysAgo;
  };

  const updateLastLogin = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : {
      hasCompletedTour: false,
      hasSeenTour: false,
      tourVersion: CURRENT_TOUR_VERSION,
      skipTourPermanently: false
    };
    const updated: OnboardingState = {
      ...existing,
      lastLoginDate: new Date().toDateString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const completeTour = () => {
    const onboardingData: OnboardingState = {
      hasCompletedTour: true,
      hasSeenTour: true,
      lastLoginDate: new Date().toDateString(),
      tourVersion: CURRENT_TOUR_VERSION,
      skipTourPermanently: false
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingData));
    setShowTour(false);
    setIsNewUser(false);
  };

  const startTour = () => {
    setShowTour(true);
  };

  const skipTour = () => {
    // When user clicks "Don't show again", permanently skip the tour
    const onboardingData: OnboardingState = {
      hasCompletedTour: false,
      hasSeenTour: true,
      lastLoginDate: new Date().toDateString(),
      tourVersion: CURRENT_TOUR_VERSION,
      skipTourPermanently: true
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingData));
    setShowTour(false);
    setIsNewUser(false);
  };

  const restartTour = () => {
    // Allow users to restart the tour manually
    const onboardingData: OnboardingState = {
      hasCompletedTour: false,
      hasSeenTour: false,
      lastLoginDate: new Date().toDateString(),
      tourVersion: CURRENT_TOUR_VERSION,
      skipTourPermanently: false
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingData));
    setShowTour(true);
    setIsNewUser(false);
  };

  return {
    showTour,
    isNewUser,
    completeTour,
    startTour,
    skipTour,
    restartTour
  };
}