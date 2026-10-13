export function isSpeechSupported() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}
function spokenNumber(number) {
    return Array.from(number)
        .filter((character) => character !== "-")
        .join(" ");
}
export function speakTicket(ticket, queueName) {
    if (!isSpeechSupported())
        return;
    const utterance = new SpeechSynthesisUtterance(`Nomor ${spokenNumber(ticket.number)}, silakan menuju ${queueName}`);
    utterance.lang = "id-ID";
    window.speechSynthesis.speak(utterance);
}
export function stopSpeech() {
    if (isSpeechSupported())
        window.speechSynthesis.cancel();
}
