export default class ColorLogger {
  // Styles
  static reset = "\x1b[0m";
  static bright = "\x1b[1m";
  static dim = "\x1b[2m";
  static italic = "\x1b[3m";
  static underscore = "\x1b[4m";
  static blink = "\x1b[5m";
  static reverse = "\x1b[7m";
  static hidden = "\x1b[8m";

  // Colors
  static colors: { [key: string]: string } = {
    // Standard colors
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",

    // Bright colors
    brightBlack: "\x1b[90m",
    brightRed: "\x1b[91m",
    brightGreen: "\x1b[92m",
    brightYellow: "\x1b[93m",
    brightBlue: "\x1b[94m",
    brightMagenta: "\x1b[95m",
    brightCyan: "\x1b[96m",
    brightWhite: "\x1b[97m",

    // Extended colors
    orange: "\x1b[38;2;255;165;0m",
    purple: "\x1b[38;2;128;0;128m",
    pink: "\x1b[38;2;255;192;203m",
    brown: "\x1b[38;2;165;42;42m",
    lightGray: "\x1b[38;2;211;211;211m",
    darkGray: "\x1b[38;2;169;169;169m",
    lightRed: "\x1b[38;2;255;99;71m",
    lightGreen: "\x1b[38;2;144;238;144m",
    lightBlue: "\x1b[38;2;173;216;230m",
    lightCyan: "\x1b[38;2;224;255;255m",
    lightMagenta: "\x1b[38;2;255;182;193m",
    lightYellow: "\x1b[38;2;255;255;224m",
    lightWhite: "\x1b[38;2;245;245;245m",
    darkRed: "\x1b[38;2;139;0;0m",
    darkGreen: "\x1b[38;2;0;100;0m",
    darkBlue: "\x1b[38;2;0;0;139m",
    darkCyan: "\x1b[38;2;0;139;139m",
    darkMagenta: "\x1b[38;2;139;0;139m",
    darkYellow: "\x1b[38;2;139;139;0m",
    darkWhite: "\x1b[38;2;245;245;245m",
    gold: "\x1b[38;2;255;215;0m",
    silver: "\x1b[38;2;192;192;192m",
    coral: "\x1b[38;2;255;127;80m",
    teal: "\x1b[38;2;0;128;128m",
    navy: "\x1b[38;2;0;0;128m",
    violet: "\x1b[38;2;238;130;238m",
    indigo: "\x1b[38;2;75;0;130m",
    khaki: "\x1b[38;2;240;230;140m",
    plum: "\x1b[38;2;221;160;221m",
    orchid: "\x1b[38;2;218;112;214m",
    lavender: "\x1b[38;2;230;230;250m",
    salmon: "\x1b[38;2;250;128;114m",
    chocolate: "\x1b[38;2;210;105;30m",
    maroon: "\x1b[38;2;128;0;0m",
    crimson: "\x1b[38;2;220;20;60m",
    lime: "\x1b[38;2;0;255;0m",
    olive: "\x1b[38;2;128;128;0m",
    aqua: "\x1b[38;2;0;255;255m",
    fuchsia: "\x1b[38;2;255;0;255m",
    wheat: "\x1b[38;2;245;222;179m",
    skyBlue: "\x1b[38;2;135;206;235m",
    moccasin: "\x1b[38;2;255;228;181m",
    slateBlue: "\x1b[38;2;106;90;205m",
    peru: "\x1b[38;2;205;133;63m",
    tomato: "\x1b[38;2;255;99;71m",
    sienna: "\x1b[38;2;160;82;45m",
    mintCream: "\x1b[38;2;245;255;250m",
    royalBlue: "\x1b[38;2;65;105;225m",
    rosyBrown: "\x1b[38;2;188;143;143m",
    springGreen: "\x1b[38;2;0;255;127m",
    steelBlue: "\x1b[38;2;70;130;180m",
    turquoise: "\x1b[38;2;64;224;208m",
    seaGreen: "\x1b[38;2;46;139;87m",
    midnightBlue: "\x1b[38;2;25;25;112m",
    mediumVioletRed: "\x1b[38;2;199;21;133m",
    mediumOrchid: "\x1b[38;2;186;85;211m",
    mediumPurple: "\x1b[38;2;147;112;219m",
    mediumSeaGreen: "\x1b[38;2;60;179;113m",
    mediumSlateBlue: "\x1b[38;2;123;104;238m",
    mediumSpringGreen: "\x1b[38;2;0;250;154m",
    mediumTurquoise: "\x1b[38;2;72;209;204m",
    darkOliveGreen: "\x1b[38;2;85;107;47m",
    darkOrange: "\x1b[38;2;255;140;0m",
    darkOrchid: "\x1b[38;2;153;50;204m",
    darkSalmon: "\x1b[38;2;233;150;122m",
    darkSeaGreen: "\x1b[38;2;143;188;143m",
    darkSlateBlue: "\x1b[38;2;72;61;139m",
    darkSlateGray: "\x1b[38;2;47;79;79m",
    darkTurquoise: "\x1b[38;2;0;206;209m",
    darkViolet: "\x1b[38;2;148;0;211m",
    fireBrick: "\x1b[38;2;178;34;34m",
    forestGreen: "\x1b[38;2;34;139;34m",
    ghostWhite: "\x1b[38;2;248;248;255m",
    honeyDew: "\x1b[38;2;240;255;240m",
    hotPink: "\x1b[38;2;255;105;180m",
    indianRed: "\x1b[38;2;205;92;92m",
    lightCoral: "\x1b[38;2;240;128;128m",
    lightSalmon: "\x1b[38;2;255;160;122m",
    lightSeaGreen: "\x1b[38;2;32;178;170m",
    lightSkyBlue: "\x1b[38;2;135;206;250m",
    lightSlateGray: "\x1b[38;2;119;136;153m",
    lightSteelBlue: "\x1b[38;2;176;196;222m",
  };

  static styles: { [key: string]: string } = {
    bright: ColorLogger.bright,
    dim: ColorLogger.dim,
    underscore: ColorLogger.underscore,
    blink: ColorLogger.blink,
    reverse: ColorLogger.reverse,
    hidden: ColorLogger.hidden,
    italic: ColorLogger.italic
  };

  static log(...messages: [string, string?, string?][]) {
    const formattedMessages = messages.map(([text, color = "", style = ""]) => {
      const colorCode = ColorLogger.colors[color] || "";
      const styleCode = style && ColorLogger.styles[style] ? ColorLogger.styles[style] : "";
      return `${styleCode}${colorCode}${text}${ColorLogger.reset}`;
    });
    console.log(formattedMessages.join(' '));
  }
}
