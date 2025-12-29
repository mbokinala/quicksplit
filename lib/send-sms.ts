
import Surge from '@surgeapi/node';

/**
 * 
 * @param to In format +19876543210
 * @param content 
 * @param apiKey 
 */
export async function sendSMS(to: string, content: string, apiKey: string) {
    console.debug("Sending following message to", to, ":");
    console.debug(content);

    const client = new Surge({
        apiKey
    });

    const message = await client.messages.create(process.env.SURGE_ACCOUNT_ID!, {
        to,
        body: content
    })

    console.debug("Sent SMS with ID", message.id)
}