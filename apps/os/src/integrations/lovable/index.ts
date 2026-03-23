// Replaced proprietary Lovable auth with native Supabase OAuth for Vercel production
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
      // Use native Supabase OAuth instead of proprietary lovable auth module
      const result = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: opts?.redirect_uri || window.location.origin,
          queryParams: {
            ...opts?.extraParams,
          },
        },
      });
      
      return result;
    },
  },
};
