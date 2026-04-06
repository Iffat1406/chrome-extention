export class TriggerDetector {
  private lastTrigger = 0;

  /**
   * Detect trigger key press (Enter, Space, Tab)
   * Debounced to avoid spam
   */
  onKeydown(event: KeyboardEvent, callback?: (text: string) => void) {
    const now = Date.now();
    if (now - this.lastTrigger < 200) return; // 200ms debounce

    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLDivElement;
    const text = (target as HTMLInputElement | HTMLTextAreaElement).value || (target as HTMLDivElement).innerText || "";

    // Trigger on Enter key for potentially completing thoughts
    if (event.key === "Enter" && callback) {
      this.lastTrigger = now;
      callback(text);
    }
  }
}
