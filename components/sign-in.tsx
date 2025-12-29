"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldContent, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Format phone number as user types: (XXX) XXX-XXXX
function formatPhoneNumber(value: string): string {
    const cleaned = value.replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (!match) return value;

    const [, area, prefix, line] = match;
    if (line) return `(${area}) ${prefix}-${line}`;
    if (prefix) return `(${area}) ${prefix}`;
    if (area) return `(${area}`;
    return "";
}

// Convert formatted phone to E.164 format: +1XXXXXXXXXX
function toE164(formattedPhone: string): string {
    const cleaned = formattedPhone.replace(/\D/g, "");
    return `+1${cleaned}`;
}

// Extract user-friendly error message from error object
function getErrorMessage(err: any): string | null {
    // Try to extract the validation error message
    if (err?.message) {
        // Look for validation_error detail
        const match = err.message.match(/"message":"([^"]+)"/);
        if (match) {
            return match[1];
        }

        // If it's a simple string message without JSON, use it
        if (!err.message.includes("Request ID:") && !err.message.includes("{")) {
            return err.message;
        }
    }

    return null;
}

type SignInVariant = "card" | "inline";

interface SignInProps {
    variant?: SignInVariant;
}

export function SignIn({ variant = "card" }: SignInProps) {
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signIn" | { phone: string }>("signIn");
    const [phoneInput, setPhoneInput] = useState("");
    const [error, setError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const phoneFormRef = useRef<HTMLFormElement>(null);
    const codeFormRef = useRef<HTMLFormElement>(null);

    const content =
        step === "signIn" ? (
            <form
                ref={phoneFormRef}
                className="space-y-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    setError("");
                    setIsSubmitting(true);
                    const e164Phone = toE164(phoneInput);
                    const formattedPhone = phoneInput;
                    const formData = new FormData();
                    formData.set("phone", e164Phone);
                    setPhoneInput("");
                    void signIn("phone-otp", formData)
                        .then(() => {
                            setStep({ phone: e164Phone });
                            setIsSubmitting(false);
                        })
                        .catch((err) => {
                            setIsSubmitting(false);
                            setPhoneInput(formattedPhone);
                            const errorMessage = getErrorMessage(err);
                            setError(
                                errorMessage || "Invalid phone number. Please check and try again."
                            );
                        });
                }}
            >
                <FieldSet>
                    <Field>
                        <FieldLabel htmlFor="phone">Phone number (US)</FieldLabel>
                        <FieldContent>
                            <Input
                                id="phone"
                                name="phone"
                                value={phoneInput}
                                onChange={(e) => {
                                    const formatted = formatPhoneNumber(e.target.value);
                                    setPhoneInput(formatted);
                                    if (error) setError("");
                                }}
                                placeholder="(555) 123-4567"
                                type="tel"
                                inputMode="tel"
                                autoComplete="tel"
                                required
                                minLength={14}
                                maxLength={14}
                            />
                        </FieldContent>
                    </Field>
                </FieldSet>
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        {error}
                    </div>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send code"}
                </Button>
            </form>
        ) : (
            <form
                ref={codeFormRef}
                className="space-y-4"
                onSubmit={(event) => {
                    event.preventDefault();
                    setError("");
                    setIsSubmitting(true);
                    const formData = new FormData(event.currentTarget);
                    void signIn("phone-otp", formData)
                        .then(() => {
                            setIsSubmitting(false);
                        })
                        .catch((err) => {
                            setIsSubmitting(false);
                            const errorMessage = getErrorMessage(err);
                            setError(
                                errorMessage || "Invalid code. Please check and try again."
                            );
                        });
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
                                onChange={() => {
                                    if (error) setError("");
                                }}
                                required
                            />
                        </FieldContent>
                    </Field>
                </FieldSet>
                <Input name="phone" value={step.phone} type="hidden" />
                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                        {error}
                    </div>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Verifying..." : "Continue"}
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                            codeFormRef.current?.reset();
                            setPhoneInput("");
                            setError("");
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
