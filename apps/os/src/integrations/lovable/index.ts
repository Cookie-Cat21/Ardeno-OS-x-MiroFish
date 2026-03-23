// Stubbed out — @lovable.dev/cloud-auth-js removed for Vercel compatibility.
// Auth is handled directly via Supabase.

export const lovable = {
  auth: {
    signInWithOAuth: async (_provider: "google" | "apple", _opts?: any) => {
      return { error: new Error("Lovable auth is not available in this deployment.") };
    },
  },
};
