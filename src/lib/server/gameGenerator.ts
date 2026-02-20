// --- REFACTORED GAME GENERATOR ---

// --- TYPES ---

export interface ModuleConfig {
    id: string;
    type: 'WIRES' | 'BUTTON' | 'KEYPAD' | 'SIMON' | 'KNOB' | 'LOGIC';
    data: any; // Visuals
    rules: any; // Solution logic
}

export interface ManualPage {
    title: string;
    content: string; // HTML
}

export interface GameConfig {
    seed: string;
    timeLimit: number;
    serialNumber: string;
    batteries: number;
    ports: string[];
    modules: ModuleConfig[];
    manual: ManualPage[];
}

export interface GameOptions {
    mode: 'RANDOM' | 'MANUAL';
    moduleCount: number;
    selectedModules: string[];
}

// --- SEEDER ---

class Seeder {
    private state: number;
    constructor(seed: string) {
        let h = 0xdeadbeef;
        for(let i = 0; i < seed.length; i++)
            h = Math.imul(h ^ seed.charCodeAt(i), 2654435761);
        this.state = (h ^ h >>> 16) >>> 0;
    }

    next(): number {
        this.state = Math.imul(this.state, 1664525) + 1013904223 | 0;
        return ((this.state >>> 0) / 4294967296);
    }

    choice<T>(arr: T[]): T {
        return arr[Math.floor(this.next() * arr.length)];
    }
    
    range(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    
    bool(): boolean {
        return this.next() > 0.5;
    }
}

// --- GLOBAL RULES INTERFACE ---

interface GlobalRules {
    wires: {
        activeRules: { text: string, check: (w: string[]) => boolean, action: { text: string, index: number } }[];
    };
    simon: {
        mapping: Record<string, string>;
        hasVowel: boolean;
    };
    knob: {
        patterns: Record<string, string>; // Position -> Pattern (12 bits)
    };
    logic: {
        condA: { text: string, val: boolean };
        condB: { text: string, val: boolean };
    };
    // Button rules are static but we include them symbolically if needed. 
    // Actually Button manual logic is static so no dynamic "rules" needed to be passed except manual generation text.
    // But manual text is static for Button too!
}


// --- MAIN GENERATOR ---

export function generateGame(seed: string, timeLimit: number, options: GameOptions = { mode: 'RANDOM', moduleCount: 5, selectedModules: [] }): GameConfig {
    const rng = new Seeder(seed);
    
    // 1. Generate Global Props
    const serialNumber = [
        rng.choice(['A','B','C','D','E','F','X','Y','Z']),
        rng.choice(['K','L','M','N','P','Q','R']),
        rng.range(0, 9),
        rng.choice(['G','H','J','T','V','W']),
        rng.range(0, 9),
        rng.range(0, 9)
    ].join('');
    
    const batteries = rng.range(0, 4);
    const availablePorts = ['RCA', 'RJ-45', 'DVI-D', 'Równoległy', 'Szeregowy'];
    const ports: string[] = [];
    const numPorts = rng.range(0, 3);
    for(let i=0; i<numPorts; i++) {
        ports.push(rng.choice(availablePorts));
    }
    
    const globalProps = { serialNumber, batteries, ports };

    // 2. Calculate Global Rules (The "Manual" Logic)
    const rules = calculateGlobalRules(rng, globalProps);
    
    // 3. Generate Manual (Always contains all pages)
    const manual = generateManual(rng, rules);

    // 4. Generate Modules
    const modules: ModuleConfig[] = [];
    const AVAILABLE_MODULES = ['WIRES', 'BUTTON', 'SIMON', 'KNOB', 'LOGIC'];

    if (options.mode === 'MANUAL') {
        for (const type of options.selectedModules) {
             let mod: ModuleConfig | null = null;
            switch(type) {
                case 'WIRES': mod = generateWires(rng, modules.length, globalProps, rules); break;
                case 'BUTTON': mod = generateButton(rng, modules.length, globalProps, rules); break;
                case 'SIMON': mod = generateSimon(rng, modules.length, globalProps, rules); break;
                case 'KNOB': mod = generateKnob(rng, modules.length, globalProps, rules); break;
                case 'LOGIC': mod = generateLogic(rng, modules.length, globalProps, rules); break;
            }
            if (mod) modules.push(mod);
        }
    } else {
        const count = Math.max(3, options.moduleCount); 
        for (let i = 0; i < count; i++) {
            const type = rng.choice(AVAILABLE_MODULES);
            let mod: ModuleConfig | null = null;
             switch(type) {
                case 'WIRES': mod = generateWires(rng, modules.length, globalProps, rules); break;
                case 'BUTTON': mod = generateButton(rng, modules.length, globalProps, rules); break;
                case 'SIMON': mod = generateSimon(rng, modules.length, globalProps, rules); break;
                case 'KNOB': mod = generateKnob(rng, modules.length, globalProps, rules); break;
                case 'LOGIC': mod = generateLogic(rng, modules.length, globalProps, rules); break;
            }
            if (mod) modules.push(mod);
        }
    }

    // Fallback if empty
    if (modules.length === 0) {
         modules.push(generateWires(rng, 0, globalProps, rules));
    }

    return {
        seed,
        timeLimit,
        ...globalProps,
        modules,
        manual
    };
}

// --- RULE CALCULATION ---

function calculateGlobalRules(rng: Seeder, props: { serialNumber: string, batteries: number, ports: string[] }): GlobalRules {
    // WIRES RULES
    const lastDigit = parseInt(props.serialNumber.slice(-1));
    const isOdd = lastDigit % 2 !== 0;
    const hasParallel = props.ports.includes('Równoległy');
    const batteryCount = props.batteries;
    
    // (Old logic removed)

    const wireRuleDefinitions = [
        { id: 'odd_serial', text: "jeżeli ostatnia cyfra numeru seryjnego jest nieparzysta", check: () => isOdd, action: { text: "przetnij drugi przewód", index: 1 } },
        { id: 'parallel_port', text: "jeżeli urządzenie posiada port Równoległy", check: () => hasParallel, action: { text: "przetnij ostatni przewód", index: 3 } },
        { id: 'bat_gt_2', text: "jeżeli liczba ogniw zasilających przekracza 2", check: () => batteryCount > 2, action: { text: "przetnij trzeci przewód", index: 2 } },
        { id: 'no_yellow', text: "jeżeli nie występuje żaden przewód żółty", check: (w: string[]) => !w.includes('żółty'), action: { text: "przetnij pierwszy przewód", index: 0 } },
        { id: 'last_red', text: "jeżeli ostatni przewód jest koloru czerwonego", check: (w: string[]) => w[w.length-1] === 'czerwony', action: { text: "przetnij czwarty przewód", index: 3 } },
        { id: 'more_1_blue', text: "jeżeli występuje więcej niż jeden przewód niebieski", check: (w: string[]) => w.filter(c => c === 'niebieski').length > 1, action: { text: "przetnij ostatni niebieski przewód", index: -1 } }
    ];

    // Shuffle and pick 3
    const shuffledWireRules = [...wireRuleDefinitions].sort(() => rng.next() - 0.5);
    const selectedWireRules = shuffledWireRules.slice(0, 3);
    
    // SIMON RULES
    const vowels = ['A','E','I','O','U','Y'];
    const hasVowel = props.serialNumber.split('').some(c => vowels.includes(c));
    const usageVowel = { 'czerwony': 'niebieski', 'niebieski': 'czerwony', 'zielony': 'żółty', 'żółty': 'zielony' };
    const usageNoVowel = { 'czerwony': 'niebieski', 'niebieski': 'żółty', 'zielony': 'zielony', 'żółty': 'czerwony' };
    const simonMapping = hasVowel ? usageVowel : usageNoVowel;

    // KNOB RULES
    const KNOB_POSITIONS = ['GÓRA', 'DÓŁ', 'LEWO', 'PRAWO'];
    const knobPatterns: Record<string, string> = {};
    for (const pos of KNOB_POSITIONS) {
        let pat = "";
        for(let i=0; i<12; i++) pat += rng.choice(['0', '1']);
        knobPatterns[pos] = pat;
    }

    // LOGIC RULES
    const logicConditions = [
        { text: "Baterii > 1", val: props.batteries > 1 },
        { text: "Serial parzysty", val: parseInt(props.serialNumber.slice(-1)) % 2 === 0 },
        { text: "Port Równoległy obecny", val: props.ports.includes('Równoległy') },
        { text: "Brak portów", val: props.ports.length === 0 },
        { text: "Serial zawiera 'A'", val: props.serialNumber.includes('A') },
        { text: "Więcej niż 2 baterie", val: props.batteries > 2 }
    ];
    const condA = rng.choice(logicConditions);
    let condB = rng.choice(logicConditions);
    while(condB === condA) condB = rng.choice(logicConditions);

    return {
        wires: {
            activeRules: selectedWireRules.map(r => ({
                text: r.text,
                check: r.check,
                action: r.action
            })) as any
        },
        simon: {
            mapping: simonMapping,
            hasVowel
        },
        knob: {
            patterns: knobPatterns
        },
        logic: {
            condA,
            condB
        }
    };
}

// --- MANUAL GENERATION ---

function generateManual(rng: Seeder, rules: GlobalRules): ManualPage[] {
    const pages: ManualPage[] = [];

    // 1. WIRES MANUAL
    let wiresHtml = `
    <h3 class="text-xl font-bold mb-4 uppercase border-b-2 border-black pb-2">MODUŁ Przewodowy (Wires)</h3>
    <div class="font-mono text-sm space-y-4">
        <p class="font-bold">PROCEDURA OPERACYJNA (PRIORYTETOWA):</p>
        <ul class="list-none space-y-2 pl-2 border-l-4 border-stone-800">
    `;
    rules.wires.activeRules.forEach((rule: any, i: number) => {
        wiresHtml += `
            <li>
                <span class="font-bold uppercase">KROK ${i+1}: </span> 
                ${rule.text}, <span class="text-stone-700 font-bold">${rule.action.text}</span>.
            </li>
        `;
    });
    wiresHtml += `
            <li>
                <span class="font-bold uppercase">W PRZECIWNYM RAZIE: </span>
                Procedura domyślna: zneutralizuj pierwszy przewód.
            </li>
        </ul>
    </div>`;
    pages.push({ title: 'Okablowanie', content: wiresHtml });

    // 2. BUTTON MANUAL (Static Text)
    const buttonHtml = `
    <h3 class="text-xl font-bold mb-4 uppercase border-b-2 border-black pb-2">MODUŁ Przycisk (Button)</h3>
    <div class="font-mono text-sm space-y-4">
        <p>Postępuj zgodnie z poniższymi wytycznymi w kolejności (Od góry do dołu).</p>
        <ul class="list-decimal pl-5 space-y-1">
            <li>Jeżeli przycisk jest <strong>Niebieski</strong> i ma etykietę "<strong>PRZERWIJ</strong>", przytrzymaj go.</li>
            <li>Jeżeli jest więcej niż <strong>1 bateria</strong> i etykieta to "<strong>DETONUJ</strong>", naciśnij i puść natychmiast.</li>
            <li>Jeżeli przycisk jest <strong>Biały</strong> i w numerze seryjnym występuje cyfra "<strong>1</strong>", przytrzymaj go.</li>
            <li>Jeżeli jest więcej niż <strong>2 baterie</strong> i wykryto port <strong>RCA</strong>, naciśnij i puść natychmiast.</li>
            <li>Jeżeli przycisk jest <strong>Żółty</strong>, przytrzymaj go.</li>
            <li>Jeżeli przycisk jest <strong>Czerwony</strong> i ma etykietę "<strong>TRZYMAJ</strong>", naciśnij i puść natychmiast.</li>
            <li>W każdym innym przypadku: <strong>przytrzymaj przycisk</strong>.</li>
        </ul>
        <div class="border-t border-black mt-4 pt-2">
            <p class="font-bold mb-2">PROCEDURA ZWALNIANIA PRZYCISKU:</p>
            <ul class="list-disc pl-5 mt-2">
                <li><strong>Niebieski pasek</strong>: cyfra <strong>4</strong>.</li>
                <li><strong>Biały pasek</strong>: cyfra <strong>1</strong>.</li>
                <li><strong>Żółty pasek</strong>: cyfra <strong>5</strong>.</li>
                <li><strong>Czerwony pasek</strong>: cyfra <strong>1</strong>.</li>
        </div>
    </div>`;
    pages.push({ title: 'Przycisk', content: buttonHtml });

    // SIMON MANUAL with fixed colors and inline styles for safety
    const simonHtml = `
    <h3 class="text-xl font-bold mb-4 uppercase border-b-2 border-black pb-2">MODUŁ Symulacja (Simon)</h3>
    <div class="font-mono text-sm space-y-4">
        <p>Mapowanie zależy od występowania <strong>SAMOGŁOSKI</strong> w Numerze Seryjnym (A, E, I, O, U, Y).</p>
        <table class="w-full border-collapse border border-black text-xs text-center mb-4 text-black" style="color: black;">
            <thead>
                <tr style="background-color: black; color: white;">
                    <th class="p-1 border border-white" style="color: white !important;">Błysk Diody</th>
                    <th class="p-1 border border-white" style="color: white !important;">Serial z SAMOGŁOSKĄ</th>
                    <th class="p-1 border border-white" style="color: white !important;">BRAK Samogłoski</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="p-1 border border-black font-bold text-red-600 bg-red-100" style="background-color: #fee2e2; color: #dc2626;">CZERWONY</td>
                    <td class="p-1 border border-black">Naciśnij NIEBIESKI</td>
                    <td class="p-1 border border-black">Naciśnij NIEBIESKI</td>
                </tr>
                <tr>
                    <td class="p-1 border border-black font-bold text-blue-600 bg-blue-100" style="background-color: #dbeafe; color: #2563eb;">NIEBIESKI</td>
                    <td class="p-1 border border-black">Naciśnij CZERWONY</td>
                    <td class="p-1 border border-black">Naciśnij ŻÓŁTY</td>
                </tr>
                <tr>
                    <td class="p-1 border border-black font-bold text-green-600 bg-green-100" style="background-color: #dcfce7; color: #16a34a;">ZIELONY</td>
                    <td class="p-1 border border-black">Naciśnij ŻÓŁTY</td>
                    <td class="p-1 border border-black">Naciśnij ZIELONY</td>
                </tr>
                <tr>
                    <td class="p-1 border border-black font-bold text-yellow-600 bg-yellow-100" style="background-color: #fef9c3; color: #ca8a04;">ŻÓŁTY</td>
                    <td class="p-1 border border-black">Naciśnij ZIELONY</td>
                    <td class="p-1 border border-black">Naciśnij CZERWONY</td>
                </tr>
            </tbody>
        </table>
    </div>`;
    pages.push({ title: 'Symulacja', content: simonHtml });

    // 4. KNOB MANUAL
    let knobHtml = `
    <h3 class="text-xl font-bold mb-4 uppercase border-b-2 border-black pb-2">MODUŁ Pokrętło (Knob)</h3>
    <div class="font-mono text-sm space-y-4">
        <p>Ustaw pokrętło zgodnie z układem diod.</p>
        <div class="grid grid-cols-2 gap-4">
    `;
    const KNOB_POSITIONS = ['GÓRA', 'DÓŁ', 'LEWO', 'PRAWO'];
    for (const pos of KNOB_POSITIONS) {
        const pat = rules.knob.patterns[pos];
        const row1 = pat.slice(0, 6).replace(/1/g, 'X').replace(/0/g, '.');
        const row2 = pat.slice(6, 12).replace(/1/g, 'X').replace(/0/g, '.');
        knobHtml += `
            <div class="border border-black p-2 text-center">
                <div class="font-bold mb-1">${pos}</div>
                <div class="font-mono tracking-widest bg-black text-green-500 p-1 text-xs">
                    ${row1}<br>${row2}
                </div>
            </div>`;
    }
    knobHtml += `</div></div>`;
    pages.push({ title: 'Pokrętło', content: knobHtml });

    // 5. LOGIC MANUAL
    const logicHtml = `
    <h3 class="text-xl font-bold mb-4 uppercase border-b-2 border-black pb-2">MODUŁ Logika (Logic)</h3>
    <div class="font-mono text-sm space-y-4">
        <p>Spełnij warunek logiczny.</p>
        <div class="border border-black p-2 mt-2">
            <p class="font-bold underline mb-2">Definicje Zmiennych:</p>
            <ul class="list-disc pl-5 space-y-1">
                <li><strong>A</strong>: ${rules.logic.condA.text}</li>
                <li><strong>B</strong>: ${rules.logic.condB.text}</li>
            </ul>
        </div>
        <div class="border border-black p-2 mt-2 bg-stone-200">
             <p class="font-bold underline mb-1">Operatory:</p>
             <ul class="list-none text-xs grid grid-cols-3 gap-2">
                 <li><strong>AND</strong>: Prawda gdy obie.</li>
                 <li><strong>OR</strong>: Prawda gdy jedna.</li>
                 <li><strong>XOR</strong>: Prawda gdy różna.</li>
             </ul>
        </div>
    </div>`;
    pages.push({ title: 'Logika', content: logicHtml });

    return pages;
}

// --- MODULE GENERATORS ---

function generateWires(rng: Seeder, index: number, props: { serialNumber: string, batteries: number, ports: string[] }, rules: GlobalRules): ModuleConfig {
    const wireCount = 4;
    const wires: string[] = [];
    const colorOpts = ['czerwony', 'niebieski', 'żółty', 'biały', 'czarny'];
    for(let i=0; i<wireCount; i++) wires.push(rng.choice(colorOpts));

    let targetIndex = -1;
    // Iterate active rules to find match
    for(const rule of rules.wires.activeRules) {
        if(rule.check(wires)) {
             targetIndex = rule.action.index;
             if(targetIndex === -1) { // Dynamic index handling (last blue)
                 targetIndex = wires.lastIndexOf('niebieski');
             }
             break;
        }
    }
    // Default
    if (targetIndex === -1) targetIndex = 0;

    return {
        id: `wires-${index}`,
        type: 'WIRES',
        data: { wires },
        rules: { validIndices: [targetIndex] }
    };
}

function generateButton(rng: Seeder, index: number, props: { serialNumber: string, batteries: number, ports: string[] }, rules: GlobalRules): ModuleConfig {
    const BUTTON_COLORS = ['czerwony', 'niebieski', 'żółty', 'biały'];
    const BUTTON_LABELS = ['PRZERWIJ', 'DETONUJ', 'TRZYMAJ', 'DOCIŚNIJ'];
    const STRIP_COLORS = ['niebieski', 'biały', 'żółty', 'czerwony'];

    const color = rng.choice(BUTTON_COLORS);
    const label = rng.choice(BUTTON_LABELS);
    const stripColor = rng.choice(STRIP_COLORS);

    let action = 'HOLD';
    if (color === 'niebieski' && label === 'PRZERWIJ') action = 'HOLD';
    else if (props.batteries > 1 && label === 'DETONUJ') action = 'TAP';
    else if (color === 'biały' && props.serialNumber.includes('1')) action = 'HOLD';
    else if (props.batteries > 2 && props.ports.includes('RCA')) action = 'TAP';
    else if (color === 'żółty') action = 'HOLD';
    else if (color === 'czerwony' && label === 'TRZYMAJ') action = 'TAP';
    else action = 'HOLD';

    const releaseDigits: Record<string, number> = {
        'niebieski': 4, 'biały': 1, 'żółty': 5, 'czerwony': 1
    };
    
    return {
        id: `button-${index}`,
        type: 'BUTTON',
        data: { color, label, stripColor },
        rules: { action, releaseDigit: releaseDigits[stripColor] }
    };
}

function generateSimon(rng: Seeder, index: number, props: { serialNumber: string, batteries: number, ports: string[] }, rules: GlobalRules): ModuleConfig {
    const length = rng.range(3, 5);
    const sequence: string[] = [];
    const colors = ['czerwony', 'niebieski', 'zielony', 'żółty'];
    for(let i=0; i<length; i++) sequence.push(rng.choice(colors));
    
    const expectedInput = sequence.map(c => rules.simon.mapping[c]);
    
    return {
        id: `simon-${index}`,
        type: 'SIMON',
        data: { sequence },
        rules: { expectedInput }
    };
}

function generateKnob(rng: Seeder, index: number, props: { serialNumber: string, batteries: number, ports: string[] }, rules: GlobalRules): ModuleConfig {
    const KNOB_POSITIONS = ['GÓRA', 'DÓŁ', 'LEWO', 'PRAWO'];
    const targetPosition = rng.choice(KNOB_POSITIONS);
    const displayedPattern = rules.knob.patterns[targetPosition];
    
    return {
        id: `knob-${index}`,
        type: 'KNOB',
        data: { leds: displayedPattern, currentRotation: rng.choice(KNOB_POSITIONS) },
        rules: { correctPosition: targetPosition }
    };
}

function generateLogic(rng: Seeder, index: number, props: { serialNumber: string, batteries: number, ports: string[] }, rules: GlobalRules): ModuleConfig {
    const ops = ['AND', 'OR', 'XOR'];
    const op1 = rng.choice(ops);
    const op2 = rng.choice(ops);
    const opMain = rng.choice(ops);
    
    const expression = `(P ${op1} A) ${opMain} (Q ${op2} B)`;
    const valA = rules.logic.condA.val;
    const valB = rules.logic.condB.val;
    
    // Eval helper
    const evalOp = (a: boolean, b: boolean, op: string) => {
        if (op === 'AND') return a && b;
        if (op === 'OR') return a || b;
        if (op === 'XOR') return a !== b;
        return false;
    };
    
    const validPairs: { p: boolean, q: boolean }[] = [];
    
    for (const p of [false, true]) {
        for (const q of [false, true]) {
            if (evalOp(evalOp(p, valA, op1), evalOp(q, valB, op2), opMain)) {
                validPairs.push({ p, q });
            }
        }
    }

    // If no solution exists for any P/Q, try again
    if (validPairs.length === 0) return generateLogic(rng, index, props, rules);

    return {
        id: `logic-${index}`,
        type: 'LOGIC',
        data: { expression },
        rules: { validPairs }
    };
}
