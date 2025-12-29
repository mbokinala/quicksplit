import { Phone } from "@convex-dev/auth/providers/Phone";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";
import { sendSMS } from "@/lib/send-sms";

export const PhoneOTP = Phone({
    id: "phone-otp",
    apiKey: process.env.SMS_API_KEY,
    maxAge: 60 * 15, // 15 minutes
    async generateVerificationToken() {
        const random: RandomReader = {
            read(bytes) {
                crypto.getRandomValues(bytes);
            },
        };

        const alphabet = "0123456789";
        const length = 8;
        return generateRandomString(random, alphabet, length);
    },
    async sendVerificationRequest({ identifier: phone, provider, token }) {
        if (!provider.apiKey) {
            throw new Error("SMS API key not set");
        }

        await sendSMS(phone, token, provider.apiKey);
    },
});