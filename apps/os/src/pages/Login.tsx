import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { signInWithGoogle, isLocalDevBypass } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (isLocalDevBypass) {
      navigate("/", { replace: true });
    }
  }, [isLocalDevBypass, navigate]);

  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in error:", error);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 mesh-gradient">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center space-y-12 max-w-sm w-full"
      >
        <div className="flex flex-col items-center gap-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 glow-primary animate-float"
          >
            <Zap className="h-9 w-9 text-primary" />
          </motion.div>
          <div>
            <h1 className="text-5xl font-display tracking-tight text-foreground">Ardeno OS</h1>
            <p className="text-sm text-muted-foreground mt-2">
              The brain behind Ardeno Studio
            </p>
          </div>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm tracking-wide glow-primary"
        >
          {isSigningIn ? "Signing in..." : "Sign in with Google"}
        </Button>

        <p className="text-xs text-muted-foreground">
          Internal access only · Unauthorized access denied
        </p>
      </motion.div>
    </div>
  );
}
