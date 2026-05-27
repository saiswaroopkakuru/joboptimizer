/* ==========================================================================
   Sai Swaroop Reddy - AI Copilot & Claude Optimizer Engine
   Manages the JobRight AI Chat Bot and Claude Resume optimization tools.
   ========================================================================== */

// Pre-packaged professional profile context for Sai Swaroop Reddy (fallback if api fails)
const PROFILE_CONTEXT = {
    name: "Sai Swaroop Reddy",
    currentRole: "Software Engineer at HSBC",
    currentScale: "Building fraud detection scoring 1M+ daily transactions with sub-second latency.",
    skills: ["Python", "FastAPI", "Kubernetes", "AWS EKS", "Terraform", "AWS CDK", "Apache Kafka", "Docker", "ArgoCD", "Django", "Flask", "PostgreSQL", "Prometheus", "Grafana", "Splunk"],
    education: "Master of Science (M.S.) in Computer Science from Southern Illinois University Carbondale"
};

let candidateProfile = null;

// Initialize AI Panel components on load
document.addEventListener("DOMContentLoaded", () => {
    initCopilot();
    loadCandidateProfile();
});

async function loadCandidateProfile() {
    try {
        const apiBase = (window.location.protocol === 'file:' || !window.location.host.includes(':8000')) ? 'http://127.0.0.1:8000' : '';
        const selectBase = document.getElementById("select-base-resume");
        const resumeName = selectBase && selectBase.value ? selectBase.value : "Sai_Swaroop_Reddy_Resume_ATS.docx";
        const response = await fetch(`${apiBase}/api/parse-resume?resume=${encodeURIComponent(resumeName)}`);
        if (response.ok) {
            candidateProfile = await response.json();
            window.candidateProfile = candidateProfile;
            console.log("Candidate profile loaded:", candidateProfile);
        }
    } catch (e) {
        console.error("Error loading candidate profile:", e);
    }
}

function initCopilot() {
    const chatForm = document.getElementById("chat-form");
    if (chatForm) {
        chatForm.addEventListener("submit", handleChatSubmit);
    }
    
    // Wire pre-packaged query suggestion buttons
    const suggestBtns = document.querySelectorAll(".suggest-query-btn");
    suggestBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const query = btn.textContent;
            document.getElementById("chat-input").value = query;
            handleChatSubmit(new Event('submit'));
        });
    });

    // Wire Paste Custom Job Optimize Button
    const btnOptimizeCustom = document.getElementById("btn-optimize-custom");
    if (btnOptimizeCustom) {
        btnOptimizeCustom.addEventListener("click", handleCustomJobSubmit);
    }
}

async function handleCustomJobSubmit() {
    const companyInput = document.getElementById("custom-company");
    const titleInput = document.getElementById("custom-title");
    const descInput = document.getElementById("custom-description");
    
    if (!descInput) return;
    
    const companyName = companyInput ? companyInput.value.trim() : "Target Company";
    const jobTitle = titleInput ? titleInput.value.trim() : "Software Engineer";
    const description = descInput.value.trim();
    
    if (!description) {
        if (window.showToast) window.showToast("Please paste a job description first.");
        else alert("Please paste a job description first.");
        return;
    }
    
    if (!candidateProfile) {
        await loadCandidateProfile();
    }
    
    const candidateSkills = (candidateProfile && candidateProfile.skills) || PROFILE_CONTEXT.skills;
    
    const KNOWN_TECH_KEYWORDS = [
        "Python", "FastAPI", "Kubernetes", "AWS EKS", "Terraform", "AWS CDK", "Apache Kafka", "Docker", "ArgoCD", "Django", "Flask", "PostgreSQL", "Prometheus", "Grafana", "Splunk",
        "Java", "Spring Boot", "Go", "Golang", "Rust", "C++", "C#", "TypeScript", "JavaScript", "React", "Angular", "Vue", "Node.js", "Express", "GraphQL", "gRPC", "SQL", "NoSQL",
        "MongoDB", "Redis", "MySQL", "Oracle", "Elasticsearch", "RabbitMQ", "Celery", "AWS", "GCP", "Azure", "CI/CD", "GitHub Actions", "Jenkins", "GitLab CI", "Ansible",
        "Splunk", "Datadog", "Prometheus", "Grafana", "OpenTelemetry", "ELK", "OAuth2", "JWT", "Jira", "Confluence", "Linux", "Bash", "Shell", "Terraform", "Serverless", "Lambdas",
        "S3", "EC2", "DynamoDB", "Athena", "Redshift", "Snowflake"
    ];
    
    const matchedSkills = [];
    const missingSkills = [];
    
    candidateSkills.forEach(skill => {
        const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(description)) {
            matchedSkills.push(skill);
        }
    });
    
    KNOWN_TECH_KEYWORDS.forEach(tech => {
        const escaped = tech.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(description)) {
            const isCandidateHas = candidateSkills.some(cs => cs.toLowerCase() === tech.toLowerCase());
            if (!isCandidateHas && !missingSkills.includes(tech)) {
                missingSkills.push(tech);
            }
        }
    });
    
    const totalSkills = matchedSkills.length + missingSkills.length;
    let matchScore = 75;
    if (totalSkills > 0) {
        matchScore = Math.round((matchedSkills.length / totalSkills) * 100);
    }
    matchScore = Math.max(50, Math.min(98, matchScore));
    
    const job = {
        id: "custom_" + Date.now(),
        company: companyName || "Target Company",
        title: jobTitle || "Software Engineer",
        description: description,
        location: "Remote / Onsite",
        matchScore: matchScore,
        matchedSkills: matchedSkills,
        missingSkills: missingSkills,
        explanation: `Custom optimization computed from pasted job details. ${matchedSkills.length} matching skills, ${missingSkills.length} missing.`
    };
    
    triggerClaudeOptimization(job);
}

// ==========================================================================
// JobRight AI Chatbot Simulator
// ==========================================================================
function handleChatSubmit(e) {
    e.preventDefault();
    const chatInput = document.getElementById("chat-input");
    const query = chatInput.value.trim();
    if (!query) return;

    // Append User Message Bubble
    appendChatMessage("user", "SR", `<p>${query}</p>`);
    chatInput.value = "";

    // Show Bot Typing Indicator
    const typingBubble = appendChatMessage("bot", "JR", `
        <div class="typing-indicator" id="bot-typing">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `);

    // Simulated network processing time
    setTimeout(() => {
        // Remove typing indicator
        if (typingBubble) {
            typingBubble.remove();
        }

        // Generate response based on query keywords
        const botResponse = generateJobRightResponse(query);
        appendChatMessage("bot", "JR", botResponse);
    }, 1000);
}

function appendChatMessage(sender, initials, contentHtml) {
    const container = document.getElementById("chat-messages-container");
    const bubble = document.createElement("div");
    
    let colorClass = "";
    if (sender === "bot") {
        const selectLlmEl = document.getElementById("select-llm");
        const selectedLLM = selectLlmEl ? selectLlmEl.value : "claude";
        const llmInitials = {
            claude: "CL",
            opus: "OP",
            gemini: "GF",
            gemini35: "G3",
            gpt4o: "GI",
            gpt5: "G5",
            deepseek: "D4",
            llama: "L4",
            gemma: "GM"
        };
        const llmColors = {
            claude: "claude-color",
            opus: "opus-color",
            gemini: "gemini-color",
            gemini35: "gemini35-color",
            gpt4o: "gpt-color",
            gpt5: "gpt5-color",
            deepseek: "deepseek-color",
            llama: "llama-color",
            gemma: "gemma-color"
        };
        initials = llmInitials[selectedLLM] || "CL";
        colorClass = llmColors[selectedLLM] || "claude-color";
    }
    
    bubble.className = `chat-bubble ${sender}`;
    
    bubble.innerHTML = `
        <div class="avatar ${colorClass}">${initials}</div>
        <div class="message-content">
            ${contentHtml}
        </div>
    `;
    
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight; // Auto scroll
    return bubble;
}


function generateJobRightResponse(query) {
    const text = query.toLowerCase();
    
    // Check if jobsList is defined
    const jobs = window.jobsList || [];
    let responseHtml = "";

    // Query 1: Python/FastAPI search
    if (text.includes("python") || text.includes("fastapi") || text.includes("flask") || text.includes("django")) {
        const matches = jobs.filter(j => 
            j.title.toLowerCase().includes("python") || 
            j.matchedSkills.some(s => ["python", "fastapi", "django", "flask"].includes(s.toLowerCase()))
        );

        if (matches.length > 0) {
            let listItems = matches.slice(0, 3).map(j => 
                `<li><strong>${j.title}</strong> at ${j.company} (${j.matchScore}% compatibility)</li>`
            ).join("");
            responseHtml = `
                <p>I found <strong>${matches.length}</strong> Python-focused roles in our daily aggregation.</p>
                <p>Here are the top matches for you:</p>
                <ul>${listItems}</ul>
                <p>You can check the <strong>Job Board</strong> panel to view their complete descriptions, or click "AI Optimize" to have the LLM draft your applications.</p>
            `;
        } else {
            responseHtml = `<p>I searched the current feeds for Python roles but didn't find specific ones matching in the last 24h. I recommend clicking "Sync Feeds" at the top to aggregate fresh opportunities.</p>`;
        }
    }
    // Query 2: AWS / Kubernetes / DevOps search
    else if (text.includes("aws") || text.includes("kubernetes") || text.includes("k8s") || text.includes("devops") || text.includes("terraform")) {
        const matches = jobs.filter(j => 
            j.title.toLowerCase().match(/(devops|infrastructure|cloud|kubernetes|sre)/) ||
            j.matchedSkills.some(s => ["aws", "kubernetes", "terraform", "cdk", "argocd"].includes(s.toLowerCase()))
        );

        if (matches.length > 0) {
            let listItems = matches.slice(0, 3).map(j => 
                `<li><strong>${j.title}</strong> at ${j.company} (${j.matchScore}% Match Score)</li>`
            ).join("");
            responseHtml = `
                <p>Yes, cloud infrastructure matches your AWS EKS and Terraform background. I found <strong>${matches.length}</strong> strong matches:</p>
                <ul>${listItems}</ul>
                <p>Would you like me to tell you how to frame your experience at HSBC for these roles? Ask me: <em>"How to frame HSBC experience"</em>.</p>
            `;
        } else {
            responseHtml = `<p>No AWS/Kubernetes specific roles found in the current daily feed. I recommend exploring the Job Board with lower match requirements.</p>`;
        }
    }
    // Query 3: Highest Match
    else if (text.includes("highest") || text.includes("best") || text.includes("top match")) {
        if (jobs.length > 0) {
            // Sort by match
            const best = [...jobs].sort((a, b) => b.matchScore - a.matchScore)[0];
            responseHtml = `
                <p>Your absolute highest compatibility match in today's feed is the <strong>${best.title}</strong> role at <strong>${best.company}</strong> with a score of <strong>${best.matchScore}%</strong>.</p>
                <p><strong>Why it matches:</strong> ${best.explanation}</p>
                <p><strong>Overlapping Tech:</strong> ${best.matchedSkills.slice(0, 5).join(", ")}.</p>
                <p>Go to the Opportunity Board to view this job, or click the "AI Optimize" button on it to begin drafting your resume customizations!</p>
            `;
        } else {
            responseHtml = `<p>There are no jobs currently loaded in the database to score. Please hit the Sync Feeds button!</p>`;
        }
    }
    // Query 4: HSBC framing advice
    else if (text.includes("hsbc") || text.includes("frame") || text.includes("transactions")) {
        responseHtml = `
            <p>To stand out for backend roles, frame your current **HSBC** experience by highlighting scale and reliability. Use these talking points in interviews or cover letters:</p>
            <ul>
                <li><strong>Scale Metric:</strong> Emphasize that your FastAPI and EKS microservices handle <strong>1M+ daily transactions</strong> with sub-second latencies (~12 Transactions Per Second steady-state, peaking much higher). This reads far more professional than raw numbers without context.</li>
                <li><strong>Infrastructure-as-Code:</strong> Detail how you provisioned AWS VPCs, Lambda, and Step Functions using **Terraform** and **AWS CDK**, removing 90% of manual deployment.</li>
                <li><strong>Reliability:</strong> Talk about managing Apache Kafka pipelines and using **Prometheus & Splunk** for anomaly detection and Grafana for monitoring SLA metrics.</li>
            </ul>
        `;
    }
    // Default Fallback
    else {
        responseHtml = `
            <p>I can help you analyze the aggregated job listings from the last 24 hours. Try asking me:</p>
            <ul>
                <li><em>"Show me python developer jobs"</em></li>
                <li><em>"Which AWS opportunities have the highest match?"</em></li>
                <li><em>"How should I describe my HSBC experience?"</em></li>
            </ul>
            <p>You can also use the **Resume Optimizer** tab to generate resume bullets and cover letters for specific job postings.</p>
        `;
    }

    return adaptChatResponse(responseHtml, query);
}

function adaptChatResponse(rawHtml, query) {
    const selectLlmEl = document.getElementById("select-llm");
    const selectedLLM = selectLlmEl ? selectLlmEl.value : "claude";
    const jobs = window.jobsList || [];
    
    if (selectedLLM === "claude") {
        return `
            <div style="font-family: var(--font-body); line-height: 1.6;">
                <p style="color: var(--accent-purple); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Claude 4.7 Sonnet Response</p>
                ${rawHtml}
            </div>
        `;
    }
    
    if (selectedLLM === "opus") {
        return `
            <div style="font-family: var(--font-body); line-height: 1.6;">
                <p style="color: #ea580c; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Claude 4.7 Opus Response</p>
                <div style="border-left: 2px solid #ea580c; padding-left: 12px; margin-top: 5px;">
                    ${rawHtml}
                </div>
            </div>
        `;
    }
    
    if (selectedLLM === "gemini") {
        let conversationalHtml = rawHtml
            .replace("<p>I found", "<p>Aha! I scanned our daily aggregation and found")
            .replace("<p>Yes, cloud infrastructure", "<p>Excellent request! Cloud infrastructure is a perfect fit for your background. Check this out:")
            .replace("<p>Your absolute highest compatibility", "<p>Wow, I found a fantastic top match for you!")
            .replace("<p>To stand out for backend roles", "<p>Hey Sai, here's some tailored advice for framing your HSBC scale:")
            .replace("<p>I can help you analyze", "<p>Hey there! I'm ready to help you analyze our daily jobs database. Go ahead and ask me things like:");

        return `
            <div style="font-family: var(--font-body); line-height: 1.6;">
                <p style="color: var(--accent-blue); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Gemini 3.5 Flash Response</p>
                ${conversationalHtml}
            </div>
        `;
    }
    
    if (selectedLLM === "gemini35") {
        return `
            <div style="font-family: var(--font-body); line-height: 1.6;">
                <p style="color: #2563eb; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Gemini 3.5 Pro Response</p>
                ${rawHtml}
            </div>
        `;
    }
    
    if (selectedLLM === "gpt4o") {
        let structuredHtml = rawHtml
            .replace("<p>Here are the top matches for you:</p>", "<p>Here is the structured breakdown of your top recommendations:</p>");
            
        return `
            <div style="font-family: var(--font-body); line-height: 1.6;">
                <p style="color: var(--accent-emerald); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">GPT-5.5 Instant Response</p>
                <div style="border-left: 2px solid var(--accent-emerald); padding-left: 12px; margin-top: 5px;">
                    ${structuredHtml}
                </div>
            </div>
        `;
    }
    
    if (selectedLLM === "gpt5") {
        let structuredHtml = rawHtml
            .replace("<p>Here are the top matches for you:</p>", "<p>Here is the optimized system recommendation breakdown:</p>");
        return `
            <div style="font-family: var(--font-body); line-height: 1.6;">
                <p style="color: #06b6d4; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">GPT-5.5 Pro Response</p>
                <div style="border-left: 2px solid #06b6d4; padding-left: 12px; margin-top: 5px; background: rgba(6, 182, 212, 0.02); padding: 8px 12px; border-radius: var(--border-radius-sm);">
                    ${structuredHtml}
                </div>
            </div>
        `;
    }
    
    if (selectedLLM === "deepseek") {
        let queryIntent = "General Inquiry";
        const qLower = query.toLowerCase();
        if (qLower.includes("python") || qLower.includes("fastapi")) queryIntent = "Python/Backend Search";
        else if (qLower.includes("aws") || qLower.includes("kubernetes") || qLower.includes("devops")) queryIntent = "Cloud/DevOps Search";
        else if (qLower.includes("highest") || qLower.includes("best")) queryIntent = "Optimal Match Scoring";
        else if (qLower.includes("hsbc")) queryIntent = "HSBC Experience Framing";

        const thoughtProcess = `
            <details open style="margin-bottom: 12px; background: rgba(255, 255, 255, 0.02); padding: 8px 12px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color);">
                <summary style="cursor: pointer; color: var(--accent-purple); font-weight: 600; font-size: 0.75rem; user-select: none;">Thought Process (DeepSeek-V4-Pro)</summary>
                <p style="font-size: 0.72rem; color: var(--text-muted); margin: 6px 0 0 0; line-height: 1.4; font-family: monospace;">
                    &gt; Intent detected: ${queryIntent}<br>
                    &gt; Matching query keywords: "${query.split(' ').slice(0, 4).join(' ')}..."<br>
                    &gt; Cross-referencing against database records (total: ${jobs.length} jobs)<br>
                    &gt; Applying constraints: H-1B, USA, non-staffing, 3+ years experience<br>
                    &gt; Generating formatted telemetry report...
                </p>
            </details>
        `;

        return `
            <div style="font-family: var(--font-body); line-height: 1.6;">
                <p style="color: #2563eb; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">DeepSeek-V4-Pro Response</p>
                ${thoughtProcess}
                ${rawHtml}
            </div>
        `;
    }
    
    if (selectedLLM === "llama") {
        let friendlyHtml = rawHtml
            .replace("<p>I found", "<p>Awesome! Check it out, I found")
            .replace("<p>Yes, cloud infrastructure", "<p>Heck yeah! Your cloud infrastructure and AWS EKS experience looks fantastic. I found these cool roles:")
            .replace("<p>Your absolute highest compatibility", "<p>Boom! Here is your ultimate top match in today's batch:")
            .replace("<p>To stand out for backend roles", "<p>Here's how to crush your backend applications! Use these awesome talking points for HSBC:")
            .replace("<p>I can help you analyze", "<p>Howdy! I'm super excited to help you navigate your job search today! Ask me anything, like:");

        return `
            <div style="font-family: var(--font-body); line-height: 1.6;">
                <p style="color: var(--accent-rose); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Llama 4 Maverick Response</p>
                ${friendlyHtml}
            </div>
        `;
    }
    
    if (selectedLLM === "gemma") {
        return `
            <div style="font-family: var(--font-body); line-height: 1.6;">
                <p style="color: #fbbf24; font-size: 0.72rem; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px;">Gemma 4 Response</p>
                <div style="background: rgba(251, 191, 36, 0.02); padding: 10px; border-radius: var(--border-radius-sm); border: 1px solid rgba(251, 191, 36, 0.1);">
                    ${rawHtml}
                </div>
            </div>
        `;
    }
    
    return rawHtml;
}


// ==========================================================================
// Claude AI Resume Optimizer & Cover Letter Builder
// ==========================================================================

// This function is triggered by clicking "AI Optimize" in the Job detail view
function triggerClaudeOptimization(job) {
    // Store the job globally for the resume editor
    window.currentlyOptimizedJob = job;

    // Update missing skills chips container in the third column
    const missingContainer = document.getElementById("opt-missing-skills-container");
    const generateBtn = document.getElementById("btn-generate-optimized-resume");

    if (missingContainer) {
        missingContainer.innerHTML = "";
        if (job.missingSkills && job.missingSkills.length > 0) {
            job.missingSkills.forEach(skill => {
                const span = document.createElement("span");
                span.className = "chip";
                span.style.borderColor = "rgba(244, 63, 94, 0.3)";
                span.style.background = "rgba(244, 63, 94, 0.05)";
                span.style.color = "#f87171";
                span.textContent = skill;
                missingContainer.appendChild(span);
            });
        } else {
            missingContainer.innerHTML = `<span style="color: var(--accent-emerald); font-size: 0.78rem;">100% Match! No missing skills.</span>`;
        }
    }

    if (generateBtn) {
        generateBtn.removeAttribute("disabled");
        const btnText = generateBtn.querySelector("span");
        if (btnText) {
            btnText.textContent = `Generate ${job.company} Match`;
        }
    }

    const container = document.getElementById("claude-optimizer-container");
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; color:var(--text-secondary);">
            <div class="typing-indicator" style="margin-bottom:12px;">
                <span></span><span></span><span></span>
            </div>
            <p>Claude is analyzing your profile against ${job.company}...</p>
        </div>
    `;

    // Simulated compilation time
    setTimeout(() => {
        renderClaudeOptimizedReport(job);
    }, 800);
}

function renderClaudeOptimizedReport(job) {
    const container = document.getElementById("claude-optimizer-container");
    if (!container) return;

    const selectLlmEl = document.getElementById("select-llm");
    const selectedLLM = selectLlmEl ? selectLlmEl.value : "claude";
    const llmNames = {
        claude: "Claude 4.7 Sonnet",
        opus: "Claude 4.7 Opus",
        gemini: "Gemini 3.5 Flash",
        gemini35: "Gemini 3.5 Pro",
        gpt4o: "GPT-5.5 Instant",
        gpt5: "GPT-5.5 Pro",
        deepseek: "DeepSeek-V4-Pro",
        llama: "Llama 4 Maverick",
        gemma: "Gemma 4 (Google OS)"
    };
    const llmName = llmNames[selectedLLM] || "Claude 4.7 Sonnet";

    // Generate dynamic cover letter text
    const coverLetter = generateCoverLetterText(job);

    // Generate dynamic resume bullets
    const resumeBullets = generateResumeBullets(job);

    // Generate interview prep tips
    const prepTips = generatePrepTips(job);

    container.innerHTML = `
        <div class="claude-results-box">
            <div style="margin-bottom: 18px; padding-bottom: 12px; border-bottom:1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start; gap: 15px;">
                <div>
                    <h5 style="color:var(--accent-purple); font-size:0.75rem; text-transform:uppercase; margin-bottom:4px; letter-spacing:0.5px;">Target Position</h5>
                    <h3 style="font-family:var(--font-heading); font-size:1.15rem; font-weight:700;">${job.title}</h3>
                    <p style="font-size:0.8rem; color:var(--text-secondary);">${job.company} &middot; ${job.location}</p>
                </div>
                <button class="btn btn-outline" style="padding: 6px 12px; font-size: 0.72rem; flex-shrink: 0;" onclick="resetToCustomForm()">Optimize Another</button>
            </div>

            <!-- Tabs selector for output types -->
            <div class="claude-results-tabs">
                <button class="claude-tab-btn active" data-cltab="coverletter">Cover Letter</button>
                <button class="claude-tab-btn" data-cltab="bullets">Resume Bullets</button>
                <button class="claude-tab-btn" data-cltab="prep">Interview Prep</button>
            </div>

            <!-- Tab Panels -->
            <div class="claude-tab-panel active" id="clpanel-coverletter">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span id="clpanel-credit-label" style="font-size:0.7rem; color:var(--text-muted);">DRAFTED BY ${llmName.toUpperCase()}</span>
                    <button class="btn btn-outline" style="padding:4px 10px; font-size:0.72rem;" onclick="copyText('cl-text-letter')">Copy Text</button>
                </div>
                <div class="claude-letter-text" id="cl-text-letter">${coverLetter}</div>
            </div>

            <div class="claude-tab-panel" id="clpanel-bullets">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:0.7rem; color:var(--text-muted);">SUGGESTED EXPERIENCE ADDITIONS</span>
                    <button class="btn btn-outline" style="padding:4px 10px; font-size:0.72rem;" onclick="copyText('cl-text-bullets')">Copy Bullets</button>
                </div>
                <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border-color); border-radius:var(--border-radius-md); padding:16px;" id="cl-text-bullets">
                    <p style="margin-bottom:10px; font-size:0.8rem; color:var(--text-secondary);">Inject these custom key accomplishments into your resume under your HSBC section to rank higher in screening systems:</p>
                    <ul class="claude-bullet-list">
                        ${resumeBullets}
                    </ul>
                </div>
            </div>

            <div class="claude-tab-panel" id="clpanel-prep">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-size:0.7rem; color:var(--text-muted);">PREPARATION CHEAT SHEET</span>
                    <button class="btn btn-outline" style="padding:4px 10px; font-size:0.72rem;" onclick="copyText('cl-text-prep')">Copy Notes</button>
                </div>
                <div style="background:rgba(0,0,0,0.15); border:1px solid var(--border-color); border-radius:var(--border-radius-md); padding:16px;" id="cl-text-prep">
                    <p style="margin-bottom:12px; font-size:0.8rem; color:var(--text-secondary);">Study these talking points to align your technical background with ${job.company}'s requirements:</p>
                    <div style="display:flex; flex-direction:column; gap:12px; font-size:0.8rem; color:var(--text-secondary);">
                        ${prepTips}
                    </div>
                </div>
            </div>
        </div>
    `;

    // Hook tab switches inside report
    const tabBtns = container.querySelectorAll(".claude-tab-btn");
    const tabPanels = container.querySelectorAll(".claude-tab-panel");

    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const target = btn.getAttribute("data-cltab");
            
            tabBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            tabPanels.forEach(p => p.classList.remove("active"));
            document.getElementById(`clpanel-${target}`).classList.add("active");
        });
    });

    window.showToast("Claude optimizer report generated!");
}

function generateCoverLetterText(job) {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // Extract key skills required
    const reqSkills = job.matchedSkills.slice(0, 3).join(", ");
    
    return `Dear Hiring Team,

I am writing to express my strong interest in the ${job.title} position at ${job.company}. With over four years of experience developing high-throughput Python backends and automating cloud platforms, I am eager to apply my technical background to your engineering challenges.

Currently at HSBC, I am part of the backend engineering team supporting a high-performance fraud transaction screening platform. I design and scale asynchronous Python microservices using FastAPI and SQLAlchemy on Amazon EKS. This platform processes over 1,000,000 transactions daily with sub-second response times, requiring robust concurrency patterns and optimized Apache Kafka messaging pipelines.

Your post details a need for expertise in ${reqSkills}. This matches my day-to-day work:
- Backend: Scaling async services and managing message loops with FastAPI and Celery.
- Platform: Writing modular Infrastructure-as-Code via Terraform/AWS CDK to automate multi-account VPCs and EKS.
- Reliability: Streamlining deployment rollouts via ArgoCD and configuring Prometheus observability dashboards.

I hold a Master's degree in Computer Science from Southern Illinois University and am AWS Certified as a Developer and Solutions Architect. I am highly motivated by ${job.company}'s mission and would welcome the opportunity to discuss how my skill set can support your team.

Thank you for your time and consideration.

Sincerely,

Sai Swaroop Reddy
saireddykakuru@gmail.com
LinkedIn: linkedin.com/in/venkatasaiswaroopkakuru`;
}

function generateResumeBullets(job) {
    const company = job.company || "Target Company";
    const title = job.title || "Software Engineer";
    
    const SKILL_CAPITALIZATION = {
        "python": "Python",
        "javascript": "JavaScript",
        "typescript": "TypeScript",
        "sql": "SQL",
        "pl/sql": "PL/SQL",
        "bash": "Bash",
        "yaml": "YAML",
        "groovy": "Groovy",
        "java": "Java",
        "c++": "C++",
        "c#": "C#",
        "go": "Go",
        "golang": "Go",
        "ruby": "Ruby",
        "rust": "Rust",
        "html": "HTML",
        "css": "CSS",
        "php": "PHP",
        "scala": "Scala",
        "kotlin": "Kotlin",
        "swift": "Swift",
        "oop": "OOP",
        "tdd": "TDD",
        "react": "React",
        "react.js": "React.js",
        "angular": "Angular",
        "vue": "Vue.js",
        "jquery": "jQuery",
        "bootstrap": "Bootstrap",
        "fastapi": "FastAPI",
        "fast api": "FastAPI",
        "django": "Django",
        "flask": "Flask",
        "sqlalchemy": "SQLAlchemy",
        "pydantic": "Pydantic",
        "celery": "Celery",
        "restful": "RESTful",
        "rest": "REST",
        "restful apis": "RESTful APIs",
        "graphql": "GraphQL",
        "grpc": "gRPC",
        "soap": "SOAP",
        "xml": "XML",
        "openapi": "OpenAPI",
        "swagger": "Swagger",
        "microservices": "Microservices",
        "aws": "AWS",
        "amazon web services": "Amazon Web Services",
        "gcp": "GCP",
        "google cloud": "Google Cloud",
        "azure": "Azure",
        "terraform": "Terraform",
        "aws cdk": "AWS CDK",
        "cdk": "CDK",
        "pulumi": "Pulumi",
        "cloudformation": "CloudFormation",
        "ansible": "Ansible",
        "iac": "IaC",
        "infrastructure as code": "Infrastructure as Code",
        "ec2": "Amazon EC2",
        "s3": "Amazon S3",
        "lambda": "AWS Lambda",
        "rds": "Amazon RDS",
        "eks": "Amazon EKS",
        "boto3": "Boto3",
        "step functions": "AWS Step Functions",
        "api gateway": "Amazon API Gateway",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "k8s": "Kubernetes",
        "helm": "Helm",
        "istio": "Istio",
        "jenkins": "Jenkins",
        "github actions": "GitHub Actions",
        "gitlab ci/cd": "GitLab CI/CD",
        "argocd": "ArgoCD",
        "codepipeline": "AWS CodePipeline",
        "gitops": "GitOps",
        "ci/cd": "CI/CD",
        "postgresql": "PostgreSQL",
        "postgres": "PostgreSQL",
        "mysql": "MySQL",
        "mongodb": "MongoDB",
        "mongo": "MongoDB",
        "redis": "Redis",
        "oracle": "Oracle",
        "aurora": "Amazon Aurora",
        "kafka": "Apache Kafka",
        "apache kafka": "Apache Kafka",
        "rabbitmq": "RabbitMQ",
        "sqs": "Amazon SQS",
        "sns": "Amazon SNS",
        "caching": "Caching",
        "sql server": "SQL Server",
        "mssql": "MS SQL Server",
        "pytest": "pytest",
        "unittest": "unittest",
        "locust": "Locust",
        "prometheus": "Prometheus",
        "grafana": "Grafana",
        "elk": "ELK Stack",
        "elasticsearch": "Elasticsearch",
        "datadog": "Datadog",
        "splunk": "Splunk",
        "cloudwatch": "Amazon CloudWatch",
        "opentelemetry": "OpenTelemetry",
        "oauth2": "OAuth2",
        "jwt": "JWT",
        "sonarqube": "SonarQube",
        "snyk": "Snyk",
        "trivy": "Trivy",
        "agile": "Agile",
        "scrum": "Scrum",
        "jira": "Jira",
        "git": "Git",
        "linux": "Linux",
        "unix": "Unix"
    };

    // Matched and missing lists
    const matched = job.matchedSkills || [];
    const missing = job.missingSkills || [];
    const allJobSkills = [...missing, ...matched];
    
    // Categorize skills present in the job
    const jobLanguages = allJobSkills.filter(s => 
        ["python", "javascript", "typescript", "java", "go", "golang", "c++", "c#", "ruby", "rust", "sql", "bash"].includes(s.toLowerCase())
    );
    const jobBackend = allJobSkills.filter(s => 
        ["fastapi", "django", "flask", "sqlalchemy", "spring", "spring boot", "node.js", "node", "express", "graphql", "grpc", "restful", "rest", "celery"].includes(s.toLowerCase())
    );
    const jobCloud = allJobSkills.filter(s => 
        ["aws", "gcp", "azure", "terraform", "cdk", "pulumi", "cloudformation", "ansible", "ec2", "s3", "lambda", "rds", "boto3", "step functions", "api gateway"].includes(s.toLowerCase())
    );
    const jobContainers = allJobSkills.filter(s => 
        ["kubernetes", "docker", "helm", "eks", "aks", "gke", "argocd", "gitops", "jenkins", "ci/cd"].includes(s.toLowerCase())
    );
    const jobData = allJobSkills.filter(s => 
        ["postgresql", "mysql", "mongodb", "redis", "oracle", "kafka", "rabbitmq", "sqs", "sns"].includes(s.toLowerCase())
    );
    const jobObs = allJobSkills.filter(s => 
        ["splunk", "prometheus", "grafana", "datadog", "cloudwatch", "opentelemetry", "elk"].includes(s.toLowerCase())
    );

    // Dynamic selection helpers with fallback
    const getBulletSkills = (list, count, fallbackStr) => {
        if (list.length === 0) return fallbackStr;
        const capitalized = list.map(s => {
            const lower = s.toLowerCase().trim();
            if (SKILL_CAPITALIZATION[lower]) {
                return SKILL_CAPITALIZATION[lower];
            } else if (lower.length <= 4) {
                return lower.toUpperCase();
            } else {
                return s.charAt(0).toUpperCase() + s.slice(1);
            }
        });
        // De-duplicate while preserving order
        const unique = [];
        capitalized.forEach(cap => {
            if (!unique.includes(cap)) {
                unique.push(cap);
            }
        });
        return unique.slice(0, count).join(", ");
    };

    const languageStr = getBulletSkills(jobLanguages, 2, "Python");
    const backendStr = getBulletSkills(jobBackend, 2, "FastAPI and Django");
    const cloudStr = getBulletSkills(jobCloud, 2, "AWS");
    const containerStr = getBulletSkills(jobContainers, 2, "Kubernetes");
    const dataStr = getBulletSkills(jobData, 2, "PostgreSQL and Kafka");
    const obsStr = getBulletSkills(jobObs, 2, "Prometheus and Grafana");

    const jobKey = (company) + (title) + (job.id || "");
    const hash = jobKey.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

    const metrics = [
        { pct: "30%", val: "1.2M", time: "15%" },
        { pct: "25%", val: "950K", time: "20%" },
        { pct: "35%", val: "2M", time: "25%" },
        { pct: "40%", val: "1.5M", time: "18%" }
    ];
    const metric = metrics[hash % metrics.length];

    const titleLower = title.toLowerCase();
    let pool = [];
    
    if (titleLower.includes("sre") || titleLower.includes("devops") || titleLower.includes("infrastructure") || titleLower.includes("platform") || titleLower.includes("production")) {
        pool = [
            `<li>Spearheaded platform reliability and scaling initiatives for <strong>HSBC</strong>'s infrastructure, leveraging <strong>${cloudStr}</strong> and Terraform to automate environment provisioning and reduce manual setup overhead by ${metric.pct}.</li>`,
            `<li>Orchestrated highly available containerized deployments using <strong>${containerStr}</strong>, configuring custom autoscaling policies and service meshes to handle peak traffic surges.</li>`,
            `<li>Implemented comprehensive end-to-end monitoring and alerting networks with <strong>${obsStr}</strong>, improving cluster observability and reducing incident MTTR by ${metric.time} for HSBC operations.</li>`,
            `<li>Automated multi-region disaster recovery and failover workflows on <strong>${cloudStr}</strong>, achieving an RTO under 5 minutes.</li>`,
            `<li>Standardized deployment configuration management and security linting across microservices using GitOps pipelines built with <strong>${containerStr}</strong>.</li>`,
            `<li>Tuned cluster compute resource allocation, optimizing <strong>${containerStr}</strong> node utilization and reducing monthly cloud spend by ${metric.pct}.</li>`
        ];
    } else if (titleLower.includes("frontend") || titleLower.includes("ui") || titleLower.includes("react") || titleLower.includes("web") || titleLower.includes("fullstack") || titleLower.includes("full stack")) {
        pool = [
            `<li>Designed and developed responsive, high-performance user interfaces for <strong>HSBC</strong>, utilizing <strong>${languageStr}</strong> to build component-driven frontends with cross-browser fidelity.</li>`,
            `<li>Optimized web application performance, reducing bundle sizes by ${metric.pct} and implementing caching structures to guarantee fluid transitions and sub-second load times.</li>`,
            `<li>Collaborated closely with backend engineering teams to integrate RESTful APIs and set up automated end-to-end testing pipelines for the <strong>${title}</strong> interface.</li>`,
            `<li>Built modular reusable UI component libraries matching modern design tokens, accelerating frontend development velocity by ${metric.time}.</li>`,
            `<li>Integrated state management layers and dynamic client-side caching to reduce server API request load by ${metric.pct}.</li>`,
            `<li>Established comprehensive frontend automated test coverage covering unit and visual regression tests, reducing production UI issues.</li>`
        ];
    } else {
        pool = [
            `<li>Engineered high-throughput backend services in <strong>${languageStr}</strong> using the <strong>${backendStr}</strong> framework for <strong>HSBC</strong>, processing business-critical workflows and optimizing database queries for ${metric.pct} faster response times.</li>`,
            `<li>Architected and deployed cloud-native applications on <strong>${cloudStr}</strong> cloud infrastructure, managing container deployment pipelines using <strong>${containerStr}</strong> to achieve seamless, zero-downtime rollouts.</li>`,
            `<li>Integrated distributed messaging and data layers with <strong>${dataStr}</strong>, designing event-driven architectures to process asynchronous messages and telemetry data reliably.</li>`,
            `<li>Designed RESTful and gRPC APIs with comprehensive security schemas including OAuth2/JWT and integrated end-to-end monitoring using <strong>${obsStr}</strong>.</li>`,
            `<li>Optimized distributed database queries and caching schemas using <strong>${dataStr}</strong>, reducing SQL query search times by ${metric.pct}.</li>`,
            `<li>Refactored legacy workflows into event-driven microservices using <strong>${backendStr}</strong> and <strong>${dataStr}</strong>, scaling the system to support a traffic volume of over ${metric.val}+ requests.</li>`,
            `<li>Configured real-time log analysis and alert triggers with <strong>${obsStr}</strong>, improving system reliability metrics and reducing operational MTTR by ${metric.time}.</li>`,
            `<li>Developed asynchronous worker queues and background job scheduling with <strong>${backendStr}</strong>, resolving thread blocks and optimizing resource usage.</li>`
        ];
    }

    let indices = [];
    let i = 0;
    while (indices.length < 3 && i < pool.length) {
        let idx = (hash + i * 3) % pool.length;
        if (!indices.includes(idx)) {
            indices.push(idx);
        }
        i++;
    }
    const templates = indices.map(idx => pool[idx]);
    return templates.join("\n");
}

function generatePrepTips(job) {
    return `
        <div>
            <strong>1. Asynchronous Concurrency (Python/FastAPI)</strong>
            <p>Be prepared to discuss Python's event loop, async/await mechanics, and how FastAPI utilizes Starlette. Relate this back to how you optimized scoring performance for HSBC transactions.</p>
        </div>
        <div>
            <strong>2. Containerized Scaling & IaC (Kubernetes & Terraform)</strong>
            <p>The role asks for platform automation. Explain how you structure your Terraform modules, handle state files securely, and manage Kubernetes Horizontal Pod Autoscaling (HPA) policies.</p>
        </div>
        <div>
            <strong>3. Distributed Event Streaming (Kafka)</strong>
            <p>They will likely ask about messaging queues. Prep a story explaining your Kafka broker structure at HSBC, consumer groups, partition management, and how you ensured message delivery guarantees.</p>
        </div>
    `;
}

// Copy Utility
window.copyText = function(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let textToCopy = el.textContent || el.innerText;
    
    // Fallback copy for legacy browsers
    const textarea = document.createElement("textarea");
    textarea.value = textToCopy;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand("copy");
        window.showToast("Copied to clipboard!");
    } catch (err) {
        window.showToast("Failed to copy text.");
    }
    
    document.body.removeChild(textarea);
};

window.resetToCustomForm = function() {
    const container = document.getElementById("claude-optimizer-container");
    if (!container) return;
    
    // Clear currently optimized job selection
    window.currentlyOptimizedJob = null;
    
    // Reset optimizer buttons and containers to initial states
    const generateBtn = document.getElementById("btn-generate-optimized-resume");
    if (generateBtn) {
        generateBtn.setAttribute("disabled", "true");
        const btnText = generateBtn.querySelector("span");
        if (btnText) {
            btnText.textContent = "Generate 100% Match Resume";
        }
    }
    
    const missingContainer = document.getElementById("opt-missing-skills-container");
    if (missingContainer) {
        missingContainer.innerHTML = `<span style="color: var(--text-muted); font-size: 0.78rem;">Select a job to see missing skills.</span>`;
    }

    container.innerHTML = `
        <div class="claude-instructions">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="claude-huge-icon">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
            </svg>
            <h3>Select a job posting first</h3>
            <p>To activate Claude's tailored optimization, go to the <strong>Job Board</strong>, select any job, and click the <strong>AI Optimize</strong> button. Claude will generate: </p>
            <ul class="list-bullet">
                <li>A custom cover letter tailored to the job's requirements and your skills.</li>
                <li>Bullet points to inject into your resume to highlight matching achievements.</li>
                <li>Interview prep topics based on the company's stack.</li>
            </ul>
            <button class="btn btn-primary" onclick="document.getElementById('nav-jobs').click()">Go to Job Board</button>
            
            <div class="or-divider" style="margin: 20px 0; display: flex; align-items: center; justify-content: center; width: 100%; color: var(--text-muted); font-size: 0.75rem; font-weight: 700; letter-spacing: 1px;">
                <span style="height: 1px; flex-grow: 1; background: rgba(255,255,255,0.08); margin-right: 12px;"></span>
                <span>OR ANALYZE CUSTOM JOB</span>
                <span style="height: 1px; flex-grow: 1; background: rgba(255,255,255,0.08); margin-left: 12px;"></span>
            </div>
            <div class="custom-job-form" style="width: 100%; text-align: left; display: flex; flex-direction: column; gap: 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 16px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);">
                <div style="display: flex; gap: 12px;">
                    <div style="flex: 1;">
                        <label for="custom-company" style="display: block; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Company Name</label>
                        <input type="text" id="custom-company" placeholder="e.g. Google" style="width: 100%; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 8px 12px; color: var(--text-primary); outline: none; font-size: 0.8rem; font-family: var(--font-body); transition: border-color 0.2s;">
                    </div>
                    <div style="flex: 1;">
                        <label for="custom-title" style="display: block; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Job Title</label>
                        <input type="text" id="custom-title" placeholder="e.g. Software Engineer" style="width: 100%; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 8px 12px; color: var(--text-primary); outline: none; font-size: 0.8rem; font-family: var(--font-body); transition: border-color 0.2s;">
                    </div>
                </div>
                <div>
                    <label for="custom-description" style="display: block; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Job Description</label>
                    <textarea id="custom-description" rows="6" placeholder="Paste the job description from Google search / Job board here..." style="width: 100%; background: rgba(0, 0, 0, 0.25); border: 1px solid var(--border-color); border-radius: var(--border-radius-md); padding: 10px 12px; color: var(--text-primary); outline: none; font-size: 0.8rem; font-family: var(--font-body); resize: vertical; min-height: 100px; line-height: 1.4; transition: border-color 0.2s;"></textarea>
                </div>
                <button class="btn btn-primary" id="btn-optimize-custom" style="width: 100%; justify-content: center; padding: 10px; font-weight: 600; font-size: 0.82rem;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon" style="width: 14px; height: 14px; margin-right: 6px;">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                    </svg>
                    <span>Optimize Pasted Job Details</span>
                </button>
            </div>
        </div>
    `;
    
    // Rewire event listener
    const btnOptimizeCustom = document.getElementById("btn-optimize-custom");
    if (btnOptimizeCustom) {
        btnOptimizeCustom.addEventListener("click", handleCustomJobSubmit);
    }
};

// Expose trigger globally so app.js can call it
window.triggerClaudeOptimization = triggerClaudeOptimization;

