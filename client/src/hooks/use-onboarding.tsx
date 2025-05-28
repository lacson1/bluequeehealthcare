import { useState, useEffect } from "react";

interface OnboardingState {
  hasCompletedTour: boolean;
  lastLoginDate: string | null;
  tourVersion: string;
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
        
        // Show tour if:
        // 1. User hasn't completed tour
        // 2. Tour version has been updated
        // 3. User hasn't logged in for more than 30 days (refresher)
        const shouldShowTour = 
          !onboardingData.hasCompletedTour ||
          onboardingData.tourVersion !== CURRENT_TOUR_VERSION ||
          (onboardingData.lastLoginDate && 
           isMoreThan30DaysAgo(onboardingData.lastLoginDate));

        if (shouldShowTour) {
          setShowTour(true);
          if (!onboardingData.hasCompletedTour) {
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
    const existing = stored ? JSON.parse(stored) : {};
    const updated = {
      ...existing,
      lastLoginDate: new Date().toDateString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const completeTour = () => {
    const onboardingData: OnboardingState = {
      hasCompletedTour: true,
      lastLoginDate: new Date().toDateString(),
      tourVersion: CURRENT_TOUR_VERSION
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(onboardingData));
    setShowTour(false);
    setIsNewUser(false);
  };

  const startTour = () => {
    setShowTour(true);
  };

  const skipTour = () => {
    setShowTour(false);
  };

  return {
    showTour,
    isNewUser,
    completeTour,
    startTour,
    skipTour
  };
}