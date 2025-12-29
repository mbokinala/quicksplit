import { useAuthActions } from "@convex-dev/auth/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type SignInVariant = "card" | "inline";

interface SignInProps {
    variant?: SignInVariant;
}

export function SignIn({ variant = "card" }: SignInProps) {
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signIn" | { phone: string }>("signIn");
    const codeFormRef = useRef<HTMLFormElement>(null);

    const content =
        step === "signIn" ? (
            <form
                className="space-y-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    const form = event.currentTarget;
                    const formData = new FormData(form);
                    void signIn("phone-otp", formData).then(() => {
                        form.reset();
                        setStep({ phone: formData.get("phone") as string });
                    });
                }}
            >
                <FieldSet>
                    <Field>
                        <FieldLabel htmlFor="phone">Phone number</FieldLabel>
                        <FieldContent>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="(555) 123-4567"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                required
                            />
                        </FieldContent>
                    </Field>
                </FieldSet>
                <Button type="submit" className="w-full">
                    Send code
                </Button>
            </form>
        ) : (
            <form
                ref={codeFormRef}
                className="space-y-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    void signIn("phone-otp", formData);
                }}
            >
                <FieldSet>
                    <Field>
                        <FieldLabel htmlFor="code">Verification code</FieldLabel>
                        <FieldContent>
                            <Input
                                id="code"
                                name="code"
                                placeholder="123456"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                required
                            />
                        </FieldContent>
                    </Field>
                </FieldSet>
                <Input name="phone" value={step.phone} type="hidden" />
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" className="w-full">
                        Continue
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                            codeFormRef.current?.reset();
                            setStep("signIn");
                        }}
                    >
                        Use different number
                    </Button>
                </div>
            </form>
        );

    if (variant === "inline") {
        return <div className="space-y-3">{content}</div>;
    }

    return (
        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>{step === "signIn" ? "Sign in" : "Enter code"}</CardTitle>
            </CardHeader>
            <CardContent>{content}</CardContent>
        </Card>
    );
}
