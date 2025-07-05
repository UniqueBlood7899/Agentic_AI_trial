import { ShellTool } from './shell';

export interface XdotAction {
  type: 'click' | 'type' | 'key' | 'move';
  x?: number;
  y?: number;
  text?: string;
  key?: string;
}

export class XdotTool {
  private shell: ShellTool;

  constructor() {
    this.shell = new ShellTool();
  }

  async execute(action: XdotAction): Promise<any> {
    let command = 'xdotool ';

    switch (action.type) {
      case 'click':
        if (!action.x || !action.y) throw new Error('x and y coordinates required for click');
        command += `mousemove ${action.x} ${action.y} click 1`;
        break;

      case 'type':
        if (!action.text) throw new Error('text required for type action');
        command += `type "${action.text.replace(/"/g, '\\"')}"`;
        break;

      case 'key':
        if (!action.key) throw new Error('key required for key action');
        command += `key ${action.key}`;
        break;

      case 'move':
        if (!action.x || !action.y) throw new Error('x and y coordinates required for move');
        command += `mousemove ${action.x} ${action.y}`;
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }

    const result = await this.shell.execute(command);
    return {
      success: result.exitCode === 0,
      output: result.stdout,
      error: result.stderr
    };
  }

  async getScreenshot(): Promise<string> {
    const result = await this.shell.execute('import -window root /tmp/screenshot.png && base64 /tmp/screenshot.png');
    return result.stdout;
  }
}
