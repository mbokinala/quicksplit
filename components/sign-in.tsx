// TODO: make this actually look good and use shadcn components

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function SignIn() {
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signIn" | { phone: string }>("signIn");
    return step === "signIn" ? (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                void signIn("phone-otp", formData).then(() =>
                    setStep({ phone: formData.get("phone") as string })
                );
            }}
        >
            <input name="phone" placeholder="Phone" type="text" />
            <button type="submit">Send code</button>
        </form>
    ) : (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                void signIn("phone-otp", formData);
            }}
        >
            <input name="code" placeholder="Code" type="text" />
            <input name="phone" value={step.phone} type="hidden" />
            <button type="submit">Continue</button>
            <button type="button" onClick={() => setStep("signIn")}>
                Cancel
            </button>
        </form>
    );
}