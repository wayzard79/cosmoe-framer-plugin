import React, { useState, useEffect, useRef } from "react";
import { LogIn, UserPlus, MessageCircleMore, Globe, ChevronLeft, Loader, X } from "lucide-react";
import { signIn, signUp, signOut, getCurrentUser, AuthUser, getFavorites, saveFavorites } from "./supabaseClient";
import { supabase } from "./supabaseClient";

// Props interface
interface UserProfileScreensProps {
  isLoggedIn: boolean;
  user: AuthUser | null;
  onSignIn: (user: AuthUser) => void;
  onSignOut: () => void;
  onScreenChange?: (screen: string) => void;
  onClose?: () => void;
  onFavoritesChanged?: (favorites: string[]) => void;
}

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.5 3.5L12.5 6.5M11.5 2.5L13.5 4.5L5 13H2V10L10.5 1.5C10.7626 1.23735 11.1187 1.0875 11.4904 1.08386C11.8621 1.08022 12.2217 1.22304 12.49 1.48L14.5 3.5C14.7626 3.76265 14.9125 4.11874 14.9161 4.49043C14.9198 4.86212 14.777 5.2217 14.52 5.49L6 14" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// Main component
export function UserProfileScreens({ isLoggedIn, user, onSignIn, onSignOut, onScreenChange, onClose, onFavoritesChanged }: UserProfileScreensProps) {
  // Screen states: "guest", "login", "signup", "account"
  const [currentScreen, setCurrentScreen] = useState(isLoggedIn ? "account" : "guest");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Profile and license data
  const [profileData, setProfileData] = useState<any>(null);
  const [licenseData, setLicenseData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  
  // Refs for form inputs
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);
  const signupEmailRef = useRef<HTMLInputElement>(null);
  const signupPasswordRef = useRef<HTMLInputElement>(null);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.body.dataset.framerTheme === "dark";
      setIsDarkMode(isDark);
    };
    
    // Initial check
    checkDarkMode();
    
    // Create a MutationObserver to watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-framer-theme') {
          checkDarkMode();
        }
      });
    });
    
    // Start observing
    observer.observe(document.body, { attributes: true });
    
    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  // Change screen and notify parent component
  const changeScreen = (screen: string) => {
    setCurrentScreen(screen);
    setFormError("");
    setSuccessMessage("");
    console.log("Changing screen to:", screen);
    if (onScreenChange) onScreenChange(screen);
  };

  // Fetch user profile and license data when logged in
  useEffect(() => {
    if (isLoggedIn && user && currentScreen === "account") {
      fetchUserData();
    }
  }, [isLoggedIn, user, currentScreen]);

  // Fetch user profile and license data
  const fetchUserData = async () => {
    try {
      setDataLoading(true);
      
      if (!user) {
        throw new Error("No user data available");
      }
      
      // Get user email
      const email = user.email;
      
      if (!email) {
        throw new Error("No email available");
      }
      
      // Fetch customer profile
      const { data: profileData, error: profileError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('email', email)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
        // Continue even with error to try getting license data
      } else {
        setProfileData(profileData);
      }
      
      // Get license data if license_key is available from profile
      if (profileData?.license_key) {
        const { data: licenseData, error: licenseError } = await supabase
          .from('licenses')
          .select('*')
          .eq('key', profileData.license_key)
          .single();
          
        if (licenseError) {
          console.error("Error fetching license:", licenseError);
        } else {
          setLicenseData(licenseData);
        }
      } else {
        // Try to get license by user_id
        const { data: licenseData, error: licenseError } = await supabase
          .from('licenses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (licenseError) {
          console.error("Error fetching license by user_id:", licenseError);
        } else {
          setLicenseData(licenseData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch (e) {
      console.error("Error formatting date:", e);
      return dateString;
    }
  };

  // Handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    
    const email = loginEmailRef.current?.value || "";
    const password = loginPasswordRef.current?.value || "";
    
    if (!email || !password) {
      setFormError("Please enter both email and password");
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        setFormError(error.message || "Failed to sign in");
        return;
      }
      
      if (data?.user) {
        setSuccessMessage("Signed in successfully!");
        
        // Get the user's favorites from Supabase - using force refresh to ensure we get server data
        const favorites = await getFavorites(data.user.id, true);
        if (onFavoritesChanged) {
          onFavoritesChanged(favorites);
        }
        
        onSignIn(data.user);
        changeScreen("account");
      }
    } catch (err: any) {
      setFormError(err.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    
    const email = signupEmailRef.current?.value || "";
    const password = signupPasswordRef.current?.value || "";
    
    if (!email || !password) {
      setFormError("Please enter both email and password");
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await signUp(email, password);
      
      if (error) {
        setFormError(error.message || "Failed to create account");
        return;
      }
      
      // If sign up was successful
      setSuccessMessage("Account created! Please check your email to verify your account.");
      
      // Check if user needs email verification or was auto-confirmed
      if (data?.user && !data.user.email_confirmed_at) {
        // User needs email verification
        setSuccessMessage("Please check your email to verify your account before signing in.");
      } else if (data?.user) {
        // User was auto-confirmed
        // Get local favorites to initialize the user's favorites
        const localFavorites = await getFavorites();
        
        // Save them to Supabase
        if (localFavorites.length > 0) {
          await saveFavorites(localFavorites, data.user.id);
        }
        
        onSignIn(data.user);
        changeScreen("account");
      }
    } catch (err: any) {
      setFormError(err.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    setLoading(true);
    
    try {
      const { error } = await signOut();
      
      if (error) {
        setFormError(error.message || "Failed to sign out");
        return;
      }
      
      // Clear user data
      onSignOut();
      changeScreen("guest");
      
      // Get local favorites after sign out
      const localFavorites = await getFavorites();
      if (onFavoritesChanged) {
        onFavoritesChanged(localFavorites);
      }
    } catch (err: any) {
      setFormError(err.message || "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Toggle license key visibility
  const toggleLicenseKeyVisibility = () => {
    setShowLicenseKey(!showLicenseKey);
  };

  // Format license ID based on visibility setting
  const formatLicenseId = (id: string) => {
    if (!id) return "";

    // Show full license key if toggle is on
    if (showLicenseKey) {
      return id;
    }

    // Otherwise show masked version
    if (id.includes("-")) {
      const parts = id.split("-");
      const prefix = parts[0];
      return `${prefix}-${"*".repeat(8)}`;
    }
    return id.length > 8 ? `${id.substring(0, 4)}${"*".repeat(8)}` : id;
  };

  // Guest screen
  const GuestScreen = () => (
    <div className="profile-screen-container">
      <div className="back-button-container">
        <button className="back-button" onClick={() => onClose && onClose()}>
          <ChevronLeft size={12} /> Back to home
        </button>
      </div>
      
      <div className="button-list">
        <button 
          className="action-button" 
          onClick={() => changeScreen("login")}
        >
          Log in
          <LogIn size={16} />
        </button>
        
        <button 
          className="action-button" 
          onClick={() => changeScreen("signup")}
        >
          Create an account
          <UserPlus size={16} />
        </button>
        
        <button 
          className="action-button" 
          onClick={() => window.open("mailto:contact@cosmoe.io")}
        >
          Contact us
          <MessageCircleMore size={16} />
        </button>
        
        <button 
          className="action-button" 
          onClick={() => window.open("https://cosmoe.io")}
        >
          Go to website
          <Globe size={16} />
        </button>
      </div>
      
      <div className="legal-links">
        <button 
          className="legal-button" 
          onClick={() => window.open("https://www.cosmoeui.com/company/privacy-policy")}
        >
          Privacy policy
        </button>
        
        <button 
          className="legal-button" 
          onClick={() => window.open("https://www.cosmoeui.com/company/terms-of-service")}
        >
          Terms and conditions
        </button>
      </div>
    </div>
  );

  // Login screen
  const LoginScreen = () => (
    <div className="profile-screen-container">
      <div className="back-button-container">
        <button className="back-button" onClick={() => changeScreen("guest")}>
          <ChevronLeft size={12} /> Back to menu
        </button>
      </div>
      
      <div className="centered-content">
        <img 
          src="https://framerusercontent.com/images/rGYlod10Ij1bzVvxCAAGxFLStw.png" 
          alt="Cosmoe Logo" 
          className="logo-image"
          width="40"
          height="40"
        />
        <h2 className="form-title">Log in to Cosmoe</h2>
        
        {formError && (
          <div className="form-error">
            {formError}
          </div>
        )}
        
        {successMessage && (
          <div className="form-success">
            {successMessage}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSignIn}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            ref={loginEmailRef}
            required
          />
          
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            ref={loginPasswordRef}
            required
          />
          
          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="spinner" /> Logging in...
              </>
            ) : (
              "Log in"
            )}
          </button>
          
          <div className="link-row">
            <button 
              type="button" 
              className="text-link"
              onClick={() => window.open("https://cosmoe.io/forgot-password")}
            >
              Forgot password?
            </button>
            
            <button 
              type="button" 
              className="text-link"
              onClick={() => changeScreen("signup")}
            >
              Create an account
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Signup screen
  const SignupScreen = () => (
    <div className="profile-screen-container">
      <div className="back-button-container">
        <button className="back-button" onClick={() => changeScreen("guest")}>
          <ChevronLeft size={12} /> Back to menu
        </button>
      </div>
      
      <div className="centered-content">
        <img 
          src="https://framerusercontent.com/images/rGYlod10Ij1bzVvxCAAGxFLStw.png" 
          alt="Cosmoe Logo" 
          className="logo-image"
          width="40"
          height="40"
        />
        <h2 className="form-title">Create an account with Cosmoe</h2>
        
        {formError && (
          <div className="form-error">
            {formError}
          </div>
        )}
        
        {successMessage && (
          <div className="form-success">
            {successMessage}
          </div>
        )}
        
        <form className="auth-form" onSubmit={handleSignUp}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            ref={signupEmailRef}
            required
          />
          
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            ref={signupPasswordRef}
            required
            minLength={6}
          />
          
          <div className="info-box">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path d="M8 14.6667C11.6819 14.6667 14.6667 11.6819 14.6667 8.00004C14.6667 4.31814 11.6819 1.33337 8 1.33337C4.3181 1.33337 1.33333 4.31814 1.33333 8.00004C1.33333 11.6819 4.3181 14.6667 8 14.6667Z" stroke="#4B91F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 5.33337V8.00004" stroke="#4B91F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 10.6666H8.00667" stroke="#4B91F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ width: '100%' }}>
              <strong>Important:</strong> If you've already purchased a Cosmoe UI license, please use the same email address to ensure your benefits are linked correctly.
            </div>
          </div>
          
          <button
            type="submit"
            className="primary-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader size={16} className="spinner" /> Creating account...
              </>
            ) : (
              "Sign up"
            )}
          </button>
          
          <button 
            type="button" 
            className="text-link-center"
            onClick={() => changeScreen("login")}
          >
            Log in instead
          </button>
        </form>
      </div>
    </div>
  );

  // Render Personal Information section
  const renderPersonalInfo = () => {
    if (!profileData) return null;
    
    return (
      <div style={{
        backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
        borderRadius: 8,
        padding: 24,
        border: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
        marginBottom: "20px",
      }}>
        <h2 style={{
          margin: 0,
          marginBottom: "24px",
          fontSize: "20px",
          fontWeight: 600,
          color: isDarkMode ? "#F9FAFB" : "#111827",
        }}>
          Personal Information
        </h2>

        <div style={{ paddingBottom: "2px" }}>
          {/* First Name */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontWeight: 500,
              marginBottom: "6px",
            }}>
              First Name
            </div>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#E5E7EB" : "#111827",
              wordBreak: "break-word",
            }}>
              {profileData?.first_name || ""}
            </div>
          </div>

          {/* Last Name */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontWeight: 500,
              marginBottom: "6px",
            }}>
              Last Name
            </div>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#E5E7EB" : "#111827",
              wordBreak: "break-word",
            }}>
              {profileData?.last_name || ""}
            </div>
          </div>

          {/* Email Address */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontWeight: 500,
              marginBottom: "6px",
            }}>
              Email Address
            </div>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#E5E7EB" : "#111827",
              wordBreak: "break-word",
            }}>
              {profileData?.email || ""}
            </div>
          </div>

          {/* Username */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontWeight: 500,
              marginBottom: "6px",
            }}>
              Username
            </div>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#E5E7EB" : "#111827",
              wordBreak: "break-word",
            }}>
              {profileData?.username || ""}
            </div>
          </div>

          {/* Role */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontWeight: 500,
              marginBottom: "6px",
            }}>
              Role
            </div>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#E5E7EB" : "#111827",
              wordBreak: "break-word",
              textTransform: "capitalize",
            }}>
              {profileData?.role || "Member"}
            </div>
          </div>

          {/* Member Since */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "0",
          }}>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#9CA3AF" : "#6B7280",
              fontWeight: 500,
              marginBottom: "6px",
            }}>
              Member Since
            </div>
            <div style={{
              fontSize: "16px",
              color: isDarkMode ? "#E5E7EB" : "#111827",
              wordBreak: "break-word",
            }}>
              {formatDate(profileData?.created_at) || ""}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render License Information section
  const renderLicenseInfo = () => {
    if (!licenseData) return null;
    
    // Determine license status display
    const licenseStatus = licenseData.status || "active";
    const expiresAt = licenseData.expires_at ? new Date(licenseData.expires_at) : null;
    const isExpired = expiresAt && expiresAt < new Date();
    const displayStatus = isExpired ? "expired" : licenseStatus;
    
    // Determine license type from plan_type in profile
    const licenseType = profileData?.plan_type || "PRO";
    
    // Format dates
    const validTill = expiresAt ? formatDate(licenseData.expires_at) : "N/A";
    
    return (
      <div style={{
        backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
        borderRadius: 8,
        padding: 24,
        border: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
        marginBottom: "20px",
      }}>
        <h2 style={{
          margin: 0,
          marginBottom: "24px",
          fontSize: "20px",
          fontWeight: 600,
          color: isDarkMode ? "#F9FAFB" : "#111827",
        }}>
          License details
        </h2>
        
        {/* Status */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "20px",
        }}>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#9CA3AF" : "#6B7280",
            fontWeight: 500,
            marginBottom: "6px",
          }}>
            Current status
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span style={{
              backgroundColor: isDarkMode 
                ? (licenseType === "PRO" ? "#1E3A8A" : "#065F46") 
                : (licenseType === "PRO" ? "#E8F5FE" : "#E9F7EE"),
              color: isDarkMode 
                ? (licenseType === "PRO" ? "#93C5FD" : "#A7F3D0") 
                : (licenseType === "PRO" ? "#007AFF" : "#00A67E"),
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: 500,
              marginRight: "8px",
            }}>
              {licenseType}
            </span>
            <span style={{
              fontSize: "14px",
              color: isDarkMode 
                ? (displayStatus === "active" ? "#D1FAE5" : "#9CA3AF") 
                : (displayStatus === "active" ? "#059669" : "#6B7280"),
              backgroundColor: "transparent",
            }}>
              {displayStatus === "active" ? "Active" : (displayStatus === "expired" ? "Expired" : "Inactive")}
            </span>
          </div>
        </div>
        
        {/* License ID */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "20px",
        }}>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#9CA3AF" : "#6B7280",
            fontWeight: 500,
            marginBottom: "6px",
          }}>
            License ID
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
          }}>
            <div style={{
              fontSize: "14px",
              color: isDarkMode ? "#E5E7EB" : "#111827",
              fontFamily: "monospace",
              marginRight: "8px",
            }}>
              {formatLicenseId(licenseData.key)}
            </div>
            
            {/* Show/Hide toggle button */}
            <button
              onClick={toggleLicenseKeyVisibility}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px",
                borderRadius: "4px",
                color: isDarkMode ? "#9CA3AF" : "#6B7280",
              }}
              title={showLicenseKey ? "Hide license key" : "Show license key"}
            >
              {showLicenseKey ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.88 9.88C9.58 10.19 9.3 10.5 9.14 10.79C8.85 11.33 8.85 11.68 9.14 12.21C9.71 13.36 10.66 13.78 12 13.78C13.34 13.78 14.29 13.36 14.86 12.21C15.15 11.68 15.15 11.33 14.86 10.79C14.7 10.5 14.42 10.19 14.12 9.88" />
                  <path d="M3 3L21 21" />
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19.2667 20 12 20C4.73333 20 1 12 1 12Z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Valid till */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "0",
        }}>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#9CA3AF" : "#6B7280",
            fontWeight: 500,
            marginBottom: "6px",
          }}>
            Valid till
          </div>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#E5E7EB" : "#111827",
            wordBreak: "break-word",
          }}>
            {validTill}
          </div>
        </div>
      </div>
    );
  };
  
  // Render Billing Information section
  const renderBillingInfo = () => {
    if (!licenseData) return null;
    
    // Calculate billing dates
    const createdAt = licenseData.created_at ? new Date(licenseData.created_at) : null;
    const billedFrom = createdAt ? formatDate(licenseData.created_at) : "N/A";
    
    let billedTo = "N/A";
    let nextBillingOn = "N/A";
    
    if (createdAt) {
      const billingEnd = new Date(createdAt);
      billingEnd.setMonth(billingEnd.getMonth() + 1);
      
      const nextBilling = new Date(billingEnd);
      nextBilling.setDate(nextBilling.getDate() + 1);
      
      billedTo = formatDate(billingEnd.toISOString());
      nextBillingOn = formatDate(nextBilling.toISOString());
    }
    
    return (
      <div style={{
        backgroundColor: isDarkMode ? "#1E293B" : "#FFFFFF",
        borderRadius: 8,
        padding: 24,
        border: `1px solid ${isDarkMode ? "#374151" : "#E5E7EB"}`,
        marginBottom: "20px",
      }}>
        <h2 style={{
          margin: 0,
          marginBottom: "24px",
          fontSize: "20px",
          fontWeight: 600,
          color: isDarkMode ? "#F9FAFB" : "#111827",
        }}>
          Billing details
        </h2>
        
        {/* Billed from */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "20px",
        }}>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#9CA3AF" : "#6B7280",
            fontWeight: 500,
            marginBottom: "6px",
          }}>
            Billed from
          </div>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#E5E7EB" : "#111827",
            wordBreak: "break-word",
          }}>
            {billedFrom}
          </div>
        </div>
        
        {/* Billed to */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "20px",
        }}>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#9CA3AF" : "#6B7280",
            fontWeight: 500,
            marginBottom: "6px",
          }}>
            Billed to
          </div>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#E5E7EB" : "#111827",
            wordBreak: "break-word",
          }}>
            {billedTo}
          </div>
        </div>
        
        {/* Next billing on */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          marginBottom: "0",
        }}>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#9CA3AF" : "#6B7280",
            fontWeight: 500,
            marginBottom: "6px",
          }}>
            Next billing on
          </div>
          <div style={{
            fontSize: "16px",
            color: isDarkMode ? "#E5E7EB" : "#111827",
            wordBreak: "break-word",
          }}>
            {nextBillingOn}
          </div>
        </div>
      </div>
    );
  };

  // Account screen with real user data
  const AccountScreen = () => (
    <div className="profile-screen-container">
      <div className="back-button-container">
        <button className="back-button" onClick={() => onClose && onClose()}>
          <ChevronLeft size={12} /> Back to home
        </button>
      </div>
      
      {formError && (
        <div className="form-error" style={{ margin: '16px' }}>
          {formError}
        </div>
      )}
      
      {dataLoading ? (
        <div style={{ 
          padding: "40px 0", 
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            border: `2px solid ${isDarkMode ? "#4B5563" : "#E5E7EB"}`,
            borderTopColor: isDarkMode ? "#60A5FA" : "#0091FF",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }} />
          <div style={{
            fontSize: "14px",
            color: isDarkMode ? "#9CA3AF" : "#6B7280",
          }}>
            Loading user information...
          </div>
        </div>
      ) : (
        <div className="profile-components">
          {/* Personal Info */}
          {renderPersonalInfo()}
          
          {/* License Info */}
          {renderLicenseInfo()}
          
          {/* Billing Info */}
          {renderBillingInfo()}
          
          {/* Extra Action Buttons */}
          <div className="account-actions">
            <div className="button-list">
              <button 
                className="action-button" 
                onClick={() => window.open("mailto:contact@cosmoe.io")}
              >
                Contact us
                <MessageCircleMore size={16} />
              </button>
              
              <button 
                className="action-button" 
                onClick={() => window.open("https://cosmoe.io")}
              >
                Go to website
                <Globe size={16} />
              </button>
            </div>
            
            <div className="legal-links">
              <button 
                className="legal-button" 
                onClick={() => window.open("https://www.cosmoeui.com/company/privacy-policy")}
              >
                Privacy policy
              </button>
              
              <button 
                className="legal-button" 
                onClick={() => window.open("https://www.cosmoeui.com/company/terms-of-service")}
              >
                Terms and conditions
              </button>
            </div>
          </div>
          
          <div className="account-button-container">
            <button 
              className="primary-button"
              onClick={handleSignOut}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader size={16} className="spinner" /> Signing out...
                </>
              ) : (
                "Sign out"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render the current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case "login":
        return <LoginScreen />;
      case "signup":
        return <SignupScreen />;
      case "account":
        return <AccountScreen />;
      case "guest":
      default:
        return <GuestScreen />;
    }
  };

  return renderScreen();
}

export default UserProfileScreens;