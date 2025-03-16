function runCompiler() {
    const expr = document.getElementById('expression').value.trim();
    if (!expr) {
        alert("Please enter an arithmetic expression.");
        return;
    }
    try {
        const tokenizer = new Tokenizer(expr);
        const tokens = tokenizer.tokenize();
        displayTokens(tokens); // ✅ Shows token position

        const parser = new Parser(tokens);
        const treeData = parser.parse();
        visualize(treeData);
        showParsingSteps(parser.steps);
        // showParsingRules(parser.rulesUsed); // ✅ Now correctly displays all rules
    } catch (error) {
        alert(error.message);
    }
}

class Tokenizer {
    constructor(input) {
        this.input = input;
        this.tokens = [];
        this.position = 0;
    }

    tokenize() {
        const tokenRegex = /\d+|\+|\-|\*|\/|\(|\)/g;
        let match;
        while ((match = tokenRegex.exec(this.input)) !== null) {
            const tokenValue = match[0];
            let type = this.getTokenType(tokenValue);
            this.tokens.push({ value: tokenValue, type, position: match.index + 1 }); // ✅ Fixed Position Issue
        }
        return this.tokens;
    }

    getTokenType(token) {
        if (/^\d+$/.test(token)) return "NUMBER";
        if (token === "+") return "PLUS";
        if (token === "-") return "MINUS";
        if (token === "*") return "TIMES";
        if (token === "/") return "DIVIDE";
        if (token === "(") return "LPAREN";
        if (token === ")") return "RPAREN";
        return "UNKNOWN";
    }
}

function displayTokens(tokens) {
    const tokenBody = document.getElementById("token-body");
    tokenBody.innerHTML = ""; // Clear previous tokens

    tokens.forEach(token => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${token.value}</td><td>${token.type}</td><td>${token.position}</td>`; // ✅ Fixed Position Display
        tokenBody.appendChild(row);
    });
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens.map(t => t.value);
        this.position = 0;
        this.steps = [];
        this.rulesUsed = new Set();
    }

    peek() {
        return this.tokens[this.position] || null;
    }

    consume(expectedToken) {
        if (this.peek() === expectedToken) {
            this.position++;
        } else {
            throw new Error(`Expected '${expectedToken}' but found '${this.peek()}'`);
        }
    }

    parseExpression() {
        this.steps.push("expression -> term");
        this.rulesUsed.add("expression → term | expression '+' term | expression '-' term");
        let node = this.parseTerm();
        while (this.peek() === '+' || this.peek() === '-') {
            const op = this.peek();
            this.consume(op);
            this.steps.push(`expression -> expression ${op} term`);
            this.rulesUsed.add(`expression → expression ${op} term`);
            node = {name: op, children: [node, this.parseTerm()]};
        }
        return node;
    }

    parseTerm() {
        this.steps.push("term -> factor");
        this.rulesUsed.add("term → factor | term '*' factor | term '/' factor");
        let node = this.parseFactor();
        while (this.peek() === '*' || this.peek() === '/') {
            const op = this.peek();
            this.consume(op);
            this.steps.push(`term -> term ${op} factor`);
            this.rulesUsed.add(`term → term ${op} factor`);
            node = {name: op, children: [node, this.parseFactor()]};
        }
        return node;
    }

    parseFactor() {
        if (/\d+/.test(this.peek())) {
            const num = this.peek();
            this.consume(num);
            this.steps.push(`factor -> NUMBER (${num})`);
            this.rulesUsed.add("factor → NUMBER | '(' expression ')'");
            return {name: num, children: []};
        } else if (this.peek() === '(') {
            this.consume('(');
            this.steps.push("factor -> LPAREN expression RPAREN");
            this.rulesUsed.add("factor → '(' expression ')'");
            const node = this.parseExpression();
            this.consume(')');
            return node;
        } else {
            throw new Error('Unexpected token: ' + this.peek());
        }
    }

    parse() {
        return this.parseExpression();
    }
}

function visualize(treeData) {
    document.getElementById("tree").innerHTML = "";

    const width = 800, height = 400;
    const svg = d3.select("#tree").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(50,50)");

    const root = d3.hierarchy(treeData);
    const treeLayout = d3.tree().size([700, 300]);
    treeLayout(root);

    svg.selectAll(".link")
        .data(root.links())
        .enter().append("path")
        .attr("class", "link")
        .attr("d", d3.linkVertical()
            .x(d => d.x)
            .y(d => d.y));

    const node = svg.selectAll(".node")
        .data(root.descendants())
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle").attr("r", 12);
    node.append("text")
        .attr("dy", 4)
        .attr("y", d => d.children ? -18 : 18)
        .style("text-anchor", "middle")
        .text(d => d.data.name);
}

// ✅ Fixed: Parsing Steps Now Display Correctly
// function showParsingSteps(steps) {
//     const stepsDiv = document.getElementById('parsing-steps');
//     stepsDiv.innerHTML = "<h3>📜 Parsing Steps</h3>";
//     steps.forEach(step => {
//         const p = document.createElement("p");
//         p.textContent = step;
//         stepsDiv.appendChild(p);
//     });
// }


// function showParsingSteps(steps) {
//     const stepsDiv = document.getElementById('parsing-steps');
//     stepsDiv.innerHTML = "<h3>📜 Parsing Steps</h3>";

//     if (steps.length === 0) {
//         stepsDiv.innerHTML += "<p>No parsing steps generated.</p>";
//         return;
//     }

//     const list = document.createElement("div");

//     steps.forEach((step, index) => {
//         const stepElement = document.createElement("div");
//         stepElement.classList.add("parsing-step");
//         stepElement.innerHTML = `<strong>Step ${index + 1}:</strong> ${step}`;
//         list.appendChild(stepElement);
//     });

//     stepsDiv.appendChild(list);
// }


function showParsingSteps(steps, expression) {
    const stepsDiv = document.getElementById('parsing-steps');
    stepsDiv.innerHTML = `<h3>📜 Parsing Steps for: <span style="color:#ffcc00;">"${expression}"</span></h3>`;

    if (steps.length === 0) {
        stepsDiv.innerHTML += "<p>No parsing steps generated.</p>";
        return;
    }

    const list = document.createElement("div");

    steps.forEach((step, index) => {
        const readableStep = convertStepToEnglish(step); // Convert to simple explanation
        const stepElement = document.createElement("div");
        stepElement.classList.add("parsing-step");
        stepElement.innerHTML = `<span class="step-number">Step ${index + 1}:</span> <span class="step-text">${readableStep}</span>`;
        list.appendChild(stepElement);
    });

    stepsDiv.appendChild(list);
}

// Function to make parsing steps easier to understand
function convertStepToEnglish(step) {
    if (step.includes("expression -> term")) {
        return "Breaking the expression down into a term.";
    } else if (step.includes("term -> factor")) {
        return "A term consists of a single factor.";
    } else if (step.includes("factor -> NUMBER")) {
        return "Encountered a number.";
    } else if (step.includes("factor -> LPAREN expression RPAREN")) {
        return "Processing parentheses first.";
    } else if (step.includes("expression -> expression + term")) {
        return "Found '+', adding another term.";
    } else if (step.includes("expression -> expression - term")) {
        return "Found '-', subtracting another term.";
    } else if (step.includes("term -> term * factor")) {
        return "Multiplication detected, handling it next.";
    } else if (step.includes("term -> term / factor")) {
        return "Division detected, handling it next.";
    }
    return step; // Default case if no match is found
}



// ✅ Fixed: Now Displays All Applied Parsing Rules
// function showParsingRules(rules) {
//     const rulesDiv = document.getElementById('parsing-rules');
//     rulesDiv.innerHTML = "<h3>📌 Applied Parsing Rules</h3>";

//     // Convert set to array and format each rule in a list
//     if (rules.size === 0) {
//         rulesDiv.innerHTML += "<p>No rules applied.</p>";
//     } else {
//         rules.forEach(rule => {
//             const p = document.createElement("p");
//             p.textContent = `• ${rule}`;
//             rulesDiv.appendChild(p);
//         });
//     }
// }
