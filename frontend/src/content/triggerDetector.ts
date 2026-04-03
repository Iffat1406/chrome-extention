export class TriggerDetector {
  private buffer = "";

  onKeydown(e: KeyboardEvent, cb: (ctx: string) => void) {
    // Ctrl+Space trigger
    if (e.ctrlKey && e.code === "Space") {
      e.preventDefault();
      cb(this.buffer.slice(-100)); // send last 100 chars as context
      return;
    }

    if (e.key === "Backspace") {
      this.buffer = this.buffer.slice(0, -1);
      return;
    }

    if (e.key.length === 1) {
      this.buffer += e.key;

      // Shortcut trigger: detect "/word " pattern
      const match = this.buffer.match(/\/(\w+)\s$/);
      if (match) {
        cb(match[1]); // pass shortcut word
        this.buffer = "";
      }
    }
  }

  reset() { this.buffer = ""; }
}