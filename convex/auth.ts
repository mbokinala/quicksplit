import { convexAuth } from "@convex-dev/auth/server";
import { PhoneOTP } from "./PhoneOTP";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PhoneOTP],
});
