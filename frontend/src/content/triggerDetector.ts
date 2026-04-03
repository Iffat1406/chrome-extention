export class TriggerDetector {
  private buffer = "";
  private textBuffer = "";  // Track all text for pattern detection

  onKeydown(
    e: KeyboardEvent,
    cb: (ctx: string) => void,
    onTextChange?: (text: string) => void
  ) {
    // Ctrl+Space trigger
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      cb(this.buffer.slice(-100)); // send last 100 chars as context
      return;
    }

    if (e.key === "Backspace") {
      this.buffer = this.buffer.slice(0, -1);
      this.textBuffer = this.textBuffer.slice(0, -1);
      return;
    }

    if (e.key === "Enter") {
      // Record the full line when user presses Enter
      if (onTextChange && this.buffer.length > 5) {
        onTextChange(this.buffer.trim());
      }
      this.buffer = "";
      this.textBuffer = "";
      return;
    }

    if (e.key.length === 1) {
      this.buffer += e.key;
      this.textBuffer += e.key;

      // Shortcut trigger: detect "/word " pattern
      const match = this.buffer.match(/\/(\w+)\s$/);
      if (match) {
        cb(match[1]); // pass shortcut word
        this.buffer = "";
      }

      // Track patterns after spaces (learning opportunity)
      if (e.key === " " && this.buffer.length > 5) {
        const words = this.buffer.trim().split(/\s+/);
        if (words.length >= 2) {
          const lastWord = words[words.length - 2]; // Get word before space
          if (lastWord.length > 3 && onTextChange) {
            // Could be a pattern candidate
            onTextChange(lastWord);
          }
        }
      }
    }
  }

  reset() {
    this.buffer = "";
    this.textBuffer = "";
  }
}