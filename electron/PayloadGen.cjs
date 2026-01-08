/**
 * PayloadGen.js
 * AI-lite engine to convert Natural Language usage to DuckyScript/Keystrokes.
 */

const PayloadGen = {

    /**
     * Convert English intent to DuckyScript
     * @param {string} text - User input (e.g., "open cmd and ping google.com")
     * @returns {string} DuckyScript
     */
    generate(text) {
        if (!text) return '';
        let script = '';
        const lower = text.toLowerCase();

        // 1. "Open Terminal / CMD"
        if (/(open|launch|start).*(cmd|terminal|powershell|command)/i.test(lower)) {
            script += `DELAY 500
GUI r
DELAY 500
STRING ${lower.includes('powershell') ? 'powershell' : 'cmd'}
ENTER
DELAY 1000
`;
        }

        // 2. "Ping [HOST]"
        const pingMatch = lower.match(/ping\s+([a-zA-Z0-9.-]+)/);
        if (pingMatch) {
            // If we didn't open terminal explicitly, assume we need to or user is already there.
            // For safety, let's assume user might want to run this in an open prompt.
            // But if 'open cmd' was not detected, maybe we should autoprefix it? 
            // For now, simple concatenation.
            script += `STRING ping ${pingMatch[1]}
ENTER
`;
        }

        // 3. "Go to [URL]" (Browser)
        const urlMatch = lower.match(/(?:go to|open|visit)\s+(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9]+\.[a-z]+)/);
        if (urlMatch && !lower.includes('terminal') && !lower.includes('cmd')) {
            // Assuming running box
            script += `DELAY 500
GUI r
DELAY 500
STRING ${urlMatch[1]}
ENTER
`;
        }

        // 4. "Type [TEXT]"
        const typeMatch = lower.match(/type\s+(.+)/);
        if (typeMatch) {
            script += `STRING ${typeMatch[1]}
`;
        }

        // 5. "Enter" / "Return"
        if (lower.includes('press enter') || lower.includes('hit enter')) {
            script += `ENTER
`;
        }

        return script.trim();
    }
};

module.exports = PayloadGen;
