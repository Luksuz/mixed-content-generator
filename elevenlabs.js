import { ElevenLabsClient } from "elevenlabs";

const client = new ElevenLabsClient({ apiKey: "sk_a0e038480eabda70a1f6e0305ebd4b6659f9b88a820a1f0b" }); // <-- Use the *exact* key here
try {
  const audio = await client.textToSpeech.convert("UgBBYS2sOqTuMpoF3BR0", { // <-- Use the voice ID from your server logs
      output_format: "mp3_44100_128",
      text: "Test.",
      model_id: "eleven_multilingual_v2"
  });
  console.log("Success:", audio);
} catch (e) {
  console.error("Error with standalone script:", e);
}