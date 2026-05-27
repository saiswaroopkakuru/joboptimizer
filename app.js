/* ==========================================================================
   Sai Swaroop Reddy - Frontend Application Engine
   Manages tabs, filters, job selections, kanban tracking, and dashboard stats.
   ========================================================================== */

// Global State
const API_BASE = (window.location.protocol === 'file:' || !window.location.host.includes(':8000')) ? 'http://127.0.0.1:8000' : '';
let jobsList = [];
let selectedJob = null;
let applicationTracker = [];

// Fallback high-fidelity jobs to display if jobs_data.js is not present
const DEFAULT_FALLBACK_JOBS = [
    {
        "id": "static-1",
        "jobId": "GOOG-JR-102934",
        "title": "Senior Python Backend Engineer",
        "company": "Google",
        "source": "Google Careers",
        "pubDate": new Date().toISOString().slice(0, 19).replace('T', ' '),
        "isRecent": true,
        "description": "Google Cloud is seeking a Senior Backend Engineer to build high-throughput microservices. You will work on global network gateways using Python, FastAPI, and Kubernetes on GCP. Requires experience scaling distributed transactions and containerized APIs.",
        "summary": "Seeking a Python Backend Engineer specializing in FastAPI and Kubernetes to build high-performance APIs and Kafka streams...",
        "matchScore": 95,
        "matchedSkills": ["Python", "FastAPI", "Kubernetes", "AWS", "EKS", "Kafka", "Terraform", "CI/CD", "Docker"],
        "missingSkills": ["ArgoCD", "Splunk", "Redis"],
        "explanation": "Outstanding match! Aligns perfectly with your experience building sub-second FastAPI backends on AWS EKS at HSBC.",
        "applyUrl": "https://careers.google.com",
        "location": "Sunnyvale, CA (Hybrid)",
        "isUsBased": true,
        "visaSponsorship": "Yes",
        "experienceRequired": 5
    },
    {
        "id": "static-2",
        "jobId": "CFS-JR-204918",
        "title": "DevOps & Infrastructure Architect",
        "company": "CloudFlow Systems",
        "source": "Amazon Careers",
        "pubDate": new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        "isRecent": true,
        "description": "Looking for an infrastructure engineer experienced with Terraform, AWS CDK, Kubernetes, and GitOps workflows. You will manage large AWS multi-account structures and optimize deployments using ArgoCD and GitHub Actions.",
        "summary": "DevOps role focused on Terraform, AWS CDK, and Kubernetes. Manage multi-account AWS architectures and ArgoCD GitOps pipelines...",
        "matchScore": 92,
        "matchedSkills": ["AWS", "Kubernetes", "Terraform", "CDK", "ArgoCD", "GitHub Actions", "GitOps", "Docker"],
        "missingSkills": ["Python", "FastAPI", "Kafka"],
        "explanation": "High match for your automation skillset. Matches your Terraform/CDK and ArgoCD GitOps work.",
        "applyUrl": "https://www.amazon.jobs",
        "location": "Austin, TX (Remote)",
        "isUsBased": true,
        "visaSponsorship": "Likely",
        "experienceRequired": 4
    },
    {
        "id": "static-3",
        "jobId": "STRIPE-JR-309104",
        "title": "Software Engineer - Payments Platform",
        "company": "Stripe",
        "source": "Stripe Careers",
        "pubDate": new Date(Date.now() - 10 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        "isRecent": true,
        "description": "Build resilient payment services with Python, Flask, and PostgreSQL. Help optimize database queries and implement Celery task queues for asynchronous processing. Familiarity with Prometheus and Grafana metrics is a plus.",
        "summary": "Join our payments team building robust transaction backends with Python, Flask, Celery, and PostgreSQL. Monitor via Grafana...",
        "matchScore": 88,
        "matchedSkills": ["Python", "Flask", "PostgreSQL", "Celery", "Prometheus", "Grafana", "SQL"],
        "missingSkills": ["AWS", "Kubernetes", "FastAPI"],
        "explanation": "Strong match for your Python backend capabilities. Matches your database tuning and celery queuing skills.",
        "applyUrl": "https://stripe.com/jobs",
        "location": "New York, NY (Remote)",
        "isUsBased": true,
        "visaSponsorship": "Likely",
        "experienceRequired": 3
    },
    {
        "id": "static-4",
        "jobId": "META-JR-401928",
        "title": "Cloud Platform Engineer (EKS focus)",
        "company": "Meta",
        "source": "Meta Careers",
        "pubDate": new Date(Date.now() - 18 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        "isRecent": true,
        "description": "Help scale our Kubernetes clusters on AWS (EKS) and optimize resource allocation. You will build dashboards in Grafana, set up alerts, configure HPA policies, and write Ansible playbooks for automated server provisioning.",
        "summary": "Kubernetes platform engineer focused on AWS EKS, HPA tuning, Grafana dashboard creation, and automated configuration via Ansible...",
        "matchScore": 85,
        "matchedSkills": ["Kubernetes", "AWS", "EKS", "Grafana", "Ansible", "Docker"],
        "missingSkills": ["Terraform", "CDK", "Kafka"],
        "explanation": "Great fit for your container infrastructure and observability skillset. Matches your work with EKS and HPA at HSBC.",
        "applyUrl": "https://www.meta.com/careers",
        "location": "Chicago, IL (Remote)",
        "isUsBased": true,
        "visaSponsorship": "Yes",
        "experienceRequired": 3
    },
    {
        "id": "static-5",
        "jobId": "NFLX-JR-509283",
        "title": "Backend Services Developer (Distributed Systems)",
        "company": "EventStream Corp",
        "source": "Netflix Careers",
        "pubDate": new Date(Date.now() - 36 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        "isRecent": false,
        "description": "We are seeking a developer with extensive experience building message-driven systems. Key requirements include Apache Kafka, Python, Django/FastAPI, Redis caching, and Docker-based containerization.",
        "summary": "Scale event-driven pipelines utilizing Apache Kafka and Redis. Maintain API endpoints written in Python / FastAPI...",
        "matchScore": 84,
        "matchedSkills": ["Python", "FastAPI", "Django", "Kafka", "Redis", "Docker"],
        "missingSkills": ["AWS", "Kubernetes", "Terraform"],
        "explanation": "Excellent fit for your event-driven and messaging queue expertise.",
        "applyUrl": "https://jobs.netflix.com",
        "location": "Los Angeles, CA (Remote)",
        "isUsBased": true,
        "visaSponsorship": "Likely",
        "experienceRequired": 3
    },
    {
        "id": "static-6",
        "jobId": "NVDA-JR-601928",
        "title": "Site Reliability Engineer (SRE)",
        "company": "Nvidia Corporation",
        "source": "Nvidia Careers",
        "pubDate": new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        "isRecent": false,
        "description": "Ensure reliability of our AI-pipeline pipelines. Heavy focus on Linux systems, CI/CD automation via Jenkins, Docker, and logging tools like Splunk. Basic python script knowledge is needed.",
        "summary": "SRE focusing on Linux, Jenkins pipelines, container deployments, and logging via Splunk. Python scripting is required...",
        "matchScore": 80,
        "matchedSkills": ["Jenkins", "Docker", "Splunk", "Python", "CI/CD"],
        "missingSkills": ["AWS", "Kubernetes", "Terraform"],
        "explanation": "Solid match for your SRE-related activities, including Jenkins automation and Splunk monitoring.",
        "applyUrl": "https://nvidia.wd5.myworkdayjobs.com",
        "location": "Santa Clara, CA (Hybrid)",
        "isUsBased": true,
        "visaSponsorship": "Yes",
        "experienceRequired": 3
    },
    {
        "id": "static-7",
        "jobId": "MSFT-JR-702938",
        "title": "Software Engineer - Azure Devops",
        "company": "Microsoft",
        "source": "Microsoft Careers",
        "pubDate": new Date(Date.now() - 50 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' '),
        "isRecent": false,
        "description": "Microsoft Azure Devops team is seeking a Software Engineer II to build platform tools. You will work on Kubernetes scale, Terraform modules, and Python services. Requires experience in infrastructure and CI/CD pipelines.",
        "summary": "Join Azure Devops team. Build platform automation tools, Kubernetes infrastructure, and Python microservices...",
        "matchScore": 91,
        "matchedSkills": ["Python", "Kubernetes", "Terraform", "Docker", "CI/CD", "AWS"],
        "missingSkills": ["FastAPI", "CDK"],
        "explanation": "Great fit for your DevOps credentials. Aligns with your deep Terraform and CI/CD pipeline optimization work.",
        "applyUrl": "https://careers.microsoft.com",
        "location": "Redmond, WA (Hybrid)",
        "isUsBased": true,
        "visaSponsorship": "Yes",
        "experienceRequired": 3
    }
];

function getLinkedInId(profileUrl) {
    if (!profileUrl) return "";
    try {
        const cleanUrl = profileUrl.split('?')[0].replace(/\/$/, "");
        const parts = cleanUrl.split('/in/');
        if (parts.length > 1) {
            return parts[1];
        }
        return "";
    } catch(e) {
        return "";
    }
}

function cleanRecruiterName(name) {
    if (!name) return "";
    let n = name.split(",")[0].trim();
    n = n.replace(/\(.*?\)/g, "").trim();
    n = n.replace(/[^a-zA-Z\s\-]/g, "").trim();
    const suffixes = [/\bhr\b/gi, /\bmba\b/gi, /\bphd\b/gi, /\brecruiter\b/gi, /\bhiring\b/gi, /\blion\b/gi];
    suffixes.forEach(suf => {
        n = n.replace(suf, "").trim();
    });
    return n.replace(/\s+/g, " ").trim();
}

function cleanCompanyName(company) {
    if (!company) return "";
    let compCleaned = company.replace(/\(.*?\)/g, "").trim();
    compCleaned = compCleaned.replace(/\b(inc|co|corp|corporation|ltd|llc|solutions|technologies|group|link|systems)\b/gi, "").trim();
    return compCleaned.replace(/\s+/g, " ").trim();
}

function getRoleKeyword(title) {
    const t = (title || "").toLowerCase();
    if (t.includes("devops") || t.includes("infrastructure") || t.includes("site reliability") || t.includes("sre")) {
        return "devops OR infrastructure OR SRE";
    }
    if (t.includes("backend") || t.includes("java") || t.includes("python") || t.includes("node") || t.includes("go ")) {
        return "backend OR software OR engineering";
    }
    if (t.includes("frontend") || t.includes("react") || t.includes("ui") || t.includes("web")) {
        return "frontend OR UI OR web";
    }
    if (t.includes("full stack") || t.includes("fullstack")) {
        return "fullstack OR software OR engineering";
    }
    return "engineering OR software OR tech";
}


function getSearchTerm(title) {
    const t = (title || "").toLowerCase();
    if (t.includes("devops") || t.includes("sre") || t.includes("infrastructure") || t.includes("site reliability")) {
        return "DevOps";
    }
    if (t.includes("backend") || t.includes("python") || t.includes("java") || t.includes("node") || t.includes("go ")) {
        return "Backend";
    }
    if (t.includes("frontend") || t.includes("react") || t.includes("ui") || t.includes("web")) {
        return "Frontend";
    }
    if (t.includes("full stack") || t.includes("fullstack")) {
        return "Full Stack";
    }
    return "Software Engineer";
}

function getCareersSearchUrl(company, title, jobId, isMock) {
    const isRealCompanyId = !isMock && jobId && (jobId.startsWith("REQ-") || jobId.startsWith("JR-") || jobId.startsWith("JOB-"));
    const cleanId = jobId ? jobId.replace(/^(REQ|JR|JOB)-/, "") : "";
    const compKey = company.toLowerCase().trim();
    const searchTerm = getSearchTerm(title);
    
    if (isRealCompanyId && cleanId) {
        // Greenhouse companies direct apply mapping
        const greenhouseCompanies = [
            "twilio", "stripe", "roblox", "figma", "vercel", "n8n", "elevenlabs", 
            "supabase", "databricks", "hashicorp", "gitlab", "lyft", "mongodb", 
            "digitalocean", "datadog", "okta", "gusto", "affirm", "pinterest", 
            "airbnb", "coinbase", "coreweave", "crusoe", "scaleai", "zoom", 
            "anthropic", "box", "snyk", "zscaler", "gamechanger", "abnormalsecurity",
            "sequoiacapital"
        ];
        
        for (const g of greenhouseCompanies) {
            if (compKey.includes(g)) {
                const boardToken = g === "crusoe" ? "crusoeenergy" : g;
                return `https://boards.greenhouse.io/${boardToken}/jobs/${cleanId}`;
            }
        }
        
        // Lever direct apply
        if (compKey.includes("palantir")) return `https://jobs.lever.co/palantir/${cleanId}`;
        
        // Ashby direct apply
        if (compKey.includes("openai")) return `https://jobs.ashbyhq.com/openai/${cleanId}`;
        
        // Direct Apply URLs for other platforms
        if (compKey.includes("google")) return `https://careers.google.com/jobs/results/${cleanId}`;
        if (compKey.includes("amazon") || compKey.includes("aws")) return `https://www.amazon.jobs/en/jobs/${cleanId}`;
        if (compKey.includes("meta") || compKey.includes("facebook")) return `https://www.metacareers.com/jobs/${cleanId}`;
        if (compKey.includes("netflix")) return `https://jobs.netflix.com/jobs/${cleanId}`;
        if (compKey.includes("apple")) return `https://jobs.apple.com/en-us/details/${cleanId}`;
        if (compKey.includes("microsoft")) return `https://careers.microsoft.com/us/en/job/${cleanId}`;
        
        // Workday direct apply fallback searches using ID
        if (compKey.includes("palo alto")) return `https://jobs.paloaltonetworks.com/en/search-jobs?k=${encodeURIComponent(cleanId)}`;
        if (compKey.includes("micron")) return `https://micron.wd1.myworkdayjobs.com/en-US/External?searchText=${encodeURIComponent(cleanId)}`;
        if (compKey.includes("nvidia")) return `https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite?searchText=${encodeURIComponent(cleanId)}`;
        if (compKey.includes("salesforce")) return `https://salesforce.wd12.myworkdayjobs.com/en-US/External_Career_Site?searchText=${encodeURIComponent(cleanId)}`;
        if (compKey.includes("snowflake")) return `https://careers.snowflake.com/us/en/search-results?keywords=${encodeURIComponent(cleanId)}`;
    }
    
    // Fallback Careers search mapping
    const careersMapping = {
        "google": "https://careers.google.com/jobs/results/?q=",
        "amazon": "https://www.amazon.jobs/en/search?base_query=",
        "meta": "https://www.metacareers.com/jobs/?q=",
        "netflix": "https://jobs.netflix.com/search?q=",
        "nvidia": "https://nvidia.wd5.myworkdayjobs.com/en-US/NVIDIAExternalCareerSite?searchText=",
        "microsoft": "https://careers.microsoft.com/us/en/search-results?rt=professional&keywords=",
        "apple": "https://jobs.apple.com/en-us/search?search=",
        "uber": "https://www.uber.com/careers/list/?q=",
        "stripe": "https://boards.greenhouse.io/stripe?q=",
        "salesforce": "https://salesforce.wd12.myworkdayjobs.com/en-US/External_Career_Site?searchText=",
        "snowflake": "https://careers.snowflake.com/us/en/search-results?keywords=",
        "palo alto": "https://jobs.paloaltonetworks.com/en/search-jobs?k=",
        "palo alto networks": "https://jobs.paloaltonetworks.com/en/search-jobs?k=",
        "airbnb": "https://boards.greenhouse.io/airbnb?q=",
        "tesla": "https://www.tesla.com/careers/search/?query=",
        "coinbase": "https://boards.greenhouse.io/coinbase?q=",
        "doordash": "https://careers.doordash.com/search?q=",
        "pinterest": "https://boards.greenhouse.io/pinterest?q=",
        "block": "https://block.xyz/careers?q=",
        "servicenow": "https://careers.servicenow.com/jobs?q=",
        "splunk": "https://careers.splunk.com/jobs?q=",
        "roblox": "https://boards.greenhouse.io/roblox?q=",
        "wayfair": "https://www.wayfair.com/careers/jobs?query=",
        "jpmorgan": "https://careers.jpmorgan.com/US/en/search-results?keywords=",
        "goldman sachs": "https://www.goldmansachs.com/careers/",
        "fidelity": "https://jobs.fidelity.com/search-jobs/",
        "intel": "https://jobs.intel.com/en/search-jobs/?k=",
        "adobe": "https://careers.adobe.com/us/en/search-results?keywords=",
        "zoom": "https://boards.greenhouse.io/zoom?q=",
        "atlassian": "https://www.atlassian.com/company/careers/jobs?q=",
        "datadog": "https://boards.greenhouse.io/datadog?q=",
        "okta": "https://boards.greenhouse.io/okta?q=",
        "twilio": "https://boards.greenhouse.io/twilio?q=",
        "mongodb": "https://boards.greenhouse.io/mongodb?q=",
        "hashicorp": "https://boards.greenhouse.io/hashicorp?q=",
        "gitlab": "https://boards.greenhouse.io/gitlab?q=",
        "github": "https://github.com/careers",
        "spotify": "https://www.lifeatspotify.com/jobs?q=",
        "shopify": "https://www.shopify.com/careers",
        "paypal": "https://careers.pypl.com/search?q=",
        "ebay": "https://careers.ebayinc.com/search-apply/search-jobs/?q=",
        "lyft": "https://boards.greenhouse.io/lyft?q=",
        "capital one": "https://www.capitalonecareers.com/search-jobs/",
        "coreweave": "https://boards.greenhouse.io/coreweave?q=",
        "crusoe": "https://boards.greenhouse.io/crusoeenergy?q=",
        "digitalocean": "https://boards.greenhouse.io/digitalocean?q=",
        "coupang": "https://www.coupang.jobs/en/jobs/?search=",
        "openai": "https://jobs.ashbyhq.com/openai?q=",
        "anthropic": "https://boards.greenhouse.io/anthropic?q=",
        "scale ai": "https://boards.greenhouse.io/scaleai?q=",
        "databricks": "https://boards.greenhouse.io/databricks?q=",
        "palantir": "https://jobs.lever.co/palantir?q=",
        "nike": "https://jobs.nike.com/search-jobs/",
        "under armour": "https://careers.underarmour.com/search-jobs/",
        "capgemini": "https://www.capgemini.com/careers/job-search/?keyword=",
        "textnow": "https://www.textnow.com/careers",
        "palo alto": "https://jobs.paloaltonetworks.com/en/search-jobs?k=",
        "zscaler": "https://boards.greenhouse.io/zscaler?q=",
        "gamechanger": "https://boards.greenhouse.io/gamechanger?q=",
        "abnormal security": "https://boards.greenhouse.io/abnormalsecurity?q=",
        "sequoia": "https://boards.greenhouse.io/sequoiacapital?q=",
        "micron": "https://micron.wd1.myworkdayjobs.com/en-US/External?searchText=",
        "western digital": "https://careers.smartrecruiters.com/WesternDigital?search=",
        "sandisk": "https://careers.smartrecruiters.com/WesternDigital?search=",
        "wd": "https://careers.smartrecruiters.com/WesternDigital?search=",
        "at&t": "https://www.att.jobs/search-jobs/",
        "t-mobile": "https://careers.t-mobile.com/search/jobs?q="
    };

    for (const [key, baseSearchUrl] of Object.entries(careersMapping)) {
        if (compKey.includes(key)) {
            // Append search query parameters for supported portals
            if (baseSearchUrl.endsWith("=") || baseSearchUrl.endsWith("/")) {
                return baseSearchUrl + encodeURIComponent(searchTerm);
            }
            return baseSearchUrl;
        }
    }

    const compCleaned = cleanCompanyName(company);
    // Fallback to scoped Google Search to prevent DNS probe failures and find the actual page
    return `https://www.google.com/search?q=site:greenhouse.io+OR+site:lever.co+OR+site:ashbyhq.com+OR+careers+"${encodeURIComponent(compCleaned)}"+"${encodeURIComponent(searchTerm)}"`;
}

function applyLocalOverrides() {
    try {
        const overrides = JSON.parse(localStorage.getItem("job_overrides") || "{}");
        if (jobsList && Array.isArray(jobsList)) {
            jobsList.forEach(job => {
                if (overrides[job.id]) {
                    Object.assign(job, overrides[job.id]);
                }
            });
        }
    } catch (e) {
        console.error("Error applying overrides from localStorage:", e);
    }
}

// CRM global editing functions
window.startEditEmail = function(jobId, isHub) {
    const containerId = isHub ? `email-container-hub-${jobId}` : `email-container-${jobId}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    const job = jobsList.find(j => j.id === jobId);
    if (!job) return;
    const currentEmail = job.recruiterEmail || "";
    const inputId = isHub ? `edit-email-input-hub-${jobId}` : `edit-email-input-${jobId}`;
    
    container.innerHTML = `
        <div class="email-edit-container" style="display: flex; align-items: center; gap: 6px; width: 100%; margin-top: 3px;">
            📧 <input type="email" id="${inputId}" value="${escapeHtml(currentEmail)}" placeholder="recruiter@company.com" style="background: rgba(0, 0, 0, 0.4); border: 1px solid var(--border-color); color: var(--text-primary); border-radius: 4px; padding: 2px 6px; font-size: ${isHub ? '0.68rem' : '0.75rem'}; flex: 1; min-width: ${isHub ? '110px' : '150px'}; height: ${isHub ? '22px' : '28px'}; outline: none; font-family: inherit;" />
            <button onclick="event.preventDefault(); window.saveEmail('${jobId}', ${isHub})" style="background: var(--accent-emerald); border: none; color: white; border-radius: 4px; padding: ${isHub ? '2px 6px' : '4px 8px'}; font-size: ${isHub ? '0.62rem' : '0.7rem'}; cursor: pointer; font-weight: 600;">Save</button>
            <button onclick="event.preventDefault(); window.cancelEditEmail('${jobId}', ${isHub})" style="background: rgba(255,255,255,0.1); border: 1px solid var(--border-color); color: var(--text-secondary); border-radius: 4px; padding: ${isHub ? '2px 6px' : '4px 8px'}; font-size: ${isHub ? '0.62rem' : '0.7rem'}; cursor: pointer;">Cancel</button>
        </div>
    `;
    setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) input.focus();
    }, 50);
};

window.saveEmail = function(jobId, isHub) {
    const inputId = isHub ? `edit-email-input-hub-${jobId}` : `edit-email-input-${jobId}`;
    const input = document.getElementById(inputId);
    if (!input) return;
    const newEmail = input.value.trim();
    
    // Update local overrides
    let overrides = {};
    try {
        overrides = JSON.parse(localStorage.getItem("job_overrides") || "{}");
    } catch (e) {
        console.error(e);
    }
    
    if (!overrides[jobId]) {
        overrides[jobId] = {};
    }
    overrides[jobId].recruiterEmail = newEmail;
    overrides[jobId].recruiterEmailSource = "scraped"; // Mark as scraped once edited
    
    localStorage.setItem("job_overrides", JSON.stringify(overrides));
    
    // Update in-memory jobsList
    const job = jobsList.find(j => j.id === jobId);
    if (job) {
        job.recruiterEmail = newEmail;
        job.recruiterEmailSource = "scraped";
    }
    
    showToast("Recruiter email updated and saved locally!");
    
    // Synchronize UI
    if (selectedJob && selectedJob.id === jobId) {
        renderJobDetail(selectedJob);
    }
    const activeTab = document.querySelector(".sidebar-menu-btn.active")?.getAttribute("data-tab");
    if (activeTab === "recruiter-hub") {
        renderRecruiterHub();
    }
};

window.cancelEditEmail = function(jobId, isHub) {
    if (selectedJob && selectedJob.id === jobId) {
        renderJobDetail(selectedJob);
    }
    const activeTab = document.querySelector(".sidebar-menu-btn.active")?.getAttribute("data-tab");
    if (activeTab === "recruiter-hub") {
        renderRecruiterHub();
    }
};

// Document Ready Initialize
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

async function initApp() {
    // 1. Load Data
    await loadJobsData();
    loadTrackerData();

    // 2. Setup Navigation
    setupNavigation();

    // 3. Setup Event Listeners
    setupEventListeners();

    // 4. Render Initial Panels
    updateDashboardStats();
    renderDashboardJobs();
    renderSkillMetrics();
    filterAndRenderJobs();
    renderKanbanBoard();

    // 5. Load API Sync Status
    await fetchApiStatus();

    // 6. Resume Optimizer Initialization
    await loadBaseResumes();
    await loadOptimizedResumesHistory();
    setupResumeOptimizerEvents();
    setupRecruiterHubEvents();
    setupAutoApplyEvents();
    
    // Initialize LLM state on startup
    handleLLMChange();
    
    showToast("Swaroop's Symbol of Hope synced & running!");

    // Check for updates every 5 minutes in background
    setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/status`);
            if (response.ok) {
                const data = await response.json();
                const currentLabel = document.getElementById("lbl-last-updated").textContent;
                if (data.lastUpdated && !currentLabel.includes(data.lastUpdated)) {
                    document.getElementById("lbl-last-updated").textContent = `Last updated: ${data.lastUpdated}`;
                    await loadJobsData();
                    updateDashboardStats();
                    renderDashboardJobs();
                    renderSkillMetrics();
                    filterAndRenderJobs();
                    showToast("New jobs updated in background!");
                }
            }
        } catch (e) {
            console.error("Failed to check for updates in background:", e);
        }
    }, 300000); // 5 minutes
}

async function fetchApiStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/status`);
        if (response.ok) {
            const data = await response.json();
            if (data.lastUpdated) {
                document.getElementById("lbl-last-updated").textContent = `Last updated: ${data.lastUpdated}`;
            }
            if (data.status === "syncing") {
                const syncBtn = document.getElementById("btn-sync-jobs");
                if (syncBtn && !syncBtn.disabled) {
                    const btnText = syncBtn.querySelector("span");
                    const originalText = "Sync Feeds";
                    btnText.textContent = "Syncing...";
                    syncBtn.disabled = true;
                    
                    const svgIcon = syncBtn.querySelector("svg");
                    if (svgIcon) {
                        svgIcon.style.animation = "spin 1.5s linear infinite";
                    }
                    pollSyncStatus(syncBtn, originalText, svgIcon);
                }
            }
        }
    } catch (e) {
        console.error("Failed to fetch API status:", e);
        if (window.LAST_UPDATED) {
            document.getElementById("lbl-last-updated").textContent = `Last updated: ${window.LAST_UPDATED}`;
        } else {
            document.getElementById("lbl-last-updated").textContent = "Last updated: Unknown";
        }
    }
}

// ==========================================================================
// Data Loaders
// ==========================================================================
async function loadJobsData() {
    try {
        const response = await fetch(`${API_BASE}/jobs.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        jobsList = await response.json();
        console.log(`Loaded ${jobsList.length} scraped jobs asynchronously.`);
    } catch (e) {
        console.error("Failed to fetch jobs.json asynchronously, fallback to window.JOBS_DATA or defaults:", e);
        if (window.JOBS_DATA && window.JOBS_DATA.length > 0) {
            jobsList = window.JOBS_DATA;
        } else {
            jobsList = DEFAULT_FALLBACK_JOBS;
        }
    }
    applyLocalOverrides();
}

function loadTrackerData() {
    try {
        const saved = localStorage.getItem("apex_application_tracker");
        if (saved) {
            applicationTracker = JSON.parse(saved);
        } else {
            // Pre-fill tracker with 2 mock applications for visual showcase
            applicationTracker = [
                {
                    id: "static-1",
                    title: "Senior Python Backend Engineer",
                    company: "FastAPI Solutions Inc.",
                    matchScore: 96,
                    source: "JobRight AI",
                    status: "applied",
                    notes: "Applied on portal. Emailed contact directly.",
                    dateAdded: new Date().toLocaleDateString()
                },
                {
                    id: "static-3",
                    title: "Software Engineer - Payments Platform",
                    company: "Stripe Link",
                    matchScore: 88,
                    source: "LinkedIn",
                    status: "interview",
                    notes: "Technical phone screen scheduled for next Tuesday.",
                    dateAdded: new Date().toLocaleDateString()
                }
            ];
            saveTrackerToStorage();
        }
    } catch (e) {
        console.error("Failed to load tracker data:", e);
        applicationTracker = [];
    }
}

function saveTrackerToStorage() {
    localStorage.setItem("apex_application_tracker", JSON.stringify(applicationTracker));
}

// ==========================================================================
// Navigation & Tab Management
// ==========================================================================
function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const panels = document.querySelectorAll(".tab-panel");
    const headerTitle = document.getElementById("current-tab-title");
    const headerSubtitle = document.getElementById("current-tab-subtitle");

    const tabDetails = {
        "dashboard": { title: "Dashboard Overview", subtitle: "Real-time stats of gathered opportunities" },
        "jobs": { title: "Opportunity Board", subtitle: "Explore matching roles filtered by last 24h" },
        "claude": { title: "AI Resume Optimizer", subtitle: "Fine-tune cover letters and skill alignment" },
        "recruiter-hub": { title: "Recruiter & Resume Hub", subtitle: "Direct recruiter outreach channels and role-specific ATS optimized resumes" },
        "tracker": { title: "Application Kanban Board", subtitle: "Track status of interviews and offers" }
    };

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const tabId = item.getAttribute("data-tab");
            
            // Set active navigation button
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            // Toggle Panels
            panels.forEach(panel => panel.classList.remove("active"));
            const targetPanel = document.getElementById(`panel-${tabId}`);
            if (targetPanel) {
                targetPanel.classList.add("active");
            }

            // Update Header Meta
            if (tabDetails[tabId]) {
                headerTitle.textContent = tabDetails[tabId].title;
                headerSubtitle.textContent = tabDetails[tabId].subtitle;
            }
            
            // If going to recruiter hub, render it
            if (tabId === "recruiter-hub") {
                renderRecruiterHub();
            }
            
            // If returning to tracker, re-render kanban
            if (tabId === "tracker") {
                renderKanbanBoard();
            }
        });
    });
}


// ==========================================================================
// Dashboard Calculations & Charts
// ==========================================================================
function updateDashboardStats() {
    const totalJobs = jobsList.length;
    const recentJobs = jobsList.filter(j => j.isRecent).length;
    
    const companyJobs = jobsList.filter(j => j.source.endsWith("Careers")).length;
    const linkedinJobs = jobsList.filter(j => !j.source.endsWith("Careers")).length;
    
    // Average Match Score
    const totalScore = jobsList.reduce((acc, job) => acc + job.matchScore, 0);
    const avgScore = totalJobs > 0 ? Math.round(totalScore / totalJobs) : 0;

    // Write to UI
    document.getElementById("stat-total-jobs").textContent = totalJobs;
    document.getElementById("stat-recent-jobs").textContent = recentJobs;
    document.getElementById("stat-avg-match").textContent = `${avgScore}%`;
    document.getElementById("stat-company-careers-count").textContent = companyJobs;
    document.getElementById("stat-linkedin-recruiter-count").textContent = linkedinJobs;
    document.getElementById("job-count-badge").textContent = totalJobs;
}

function renderDashboardJobs() {
    const listContainer = document.getElementById("dashboard-recent-jobs-list");
    listContainer.innerHTML = "";

    // Show top 4 highly matched jobs posted in last 24h
    const recentMatches = jobsList
        .filter(j => j.isRecent)
        .slice(0, 4);

    if (recentMatches.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state-small">
                <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; padding: 20px;">No postings found in last 24 hours. Try syncing or exploring the Job Board.</p>
            </div>`;
        return;
    }

    recentMatches.forEach(job => {
        const item = document.createElement("div");
        item.className = "dashboard-job-item";
        
        let scoreClass = "score-high";
        if (job.matchScore < 85 && job.matchScore >= 70) scoreClass = "score-medium";
        if (job.matchScore < 70) scoreClass = "score-low";

        const sourceClass = job.source.toLowerCase().split(" ")[0];

        item.innerHTML = `
            <div class="dash-job-score ${scoreClass}">${job.matchScore}%</div>
            <div class="dash-job-info">
                <h5>${job.title} <span class="source-tag ${sourceClass}">${job.source}</span></h5>
                <p>${job.company} &middot; ${job.location}</p>
            </div>
            <div class="dash-job-meta">
                <span>Last 24h</span>
            </div>
        `;

        item.addEventListener("click", () => {
            // Jump to Job Board, set filters to show it, and select it
            document.getElementById("nav-jobs").click();
            
            // Apply a minor delay to let the panel load, then search and select
            setTimeout(() => {
                const searchInput = document.getElementById("input-search");
                searchInput.value = job.title;
                filterAndRenderJobs();
                selectJobItem(job.id);
            }, 100);
        });

        listContainer.appendChild(item);
    });
}

function renderSkillMetrics() {
    const container = document.getElementById("dashboard-skill-metrics");
    container.innerHTML = "";

    // Calculate skill frequencies in the aggregated dataset
    const skillCounts = {};
    let totalRounds = 0;
    
    jobsList.forEach(job => {
        job.matchedSkills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            totalRounds++;
        });
        job.missingSkills.forEach(skill => {
            skillCounts[skill] = (skillCounts[skill] || 0) + 0.3; // Give less weight to missing skills
        });
    });

    // Sort and grab top 5 skills
    const topSkills = Object.entries(skillCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    if (topSkills.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); font-size: 0.8rem;">No skill data accumulated.</p>`;
        return;
    }

    const maxCount = topSkills[0][1];

    topSkills.forEach(([skill, count]) => {
        const percentage = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
        
        const bar = document.createElement("div");
        bar.className = "chart-bar-container";
        bar.innerHTML = `
            <div class="chart-bar-label">
                <span>${skill}</span>
                <strong>${percentage}% demand</strong>
            </div>
            <div class="chart-bar-bg">
                <div class="chart-bar-fill" style="width: 0%"></div>
            </div>
        `;

        container.appendChild(bar);

        // Animate fill bar loading
        setTimeout(() => {
            bar.querySelector(".chart-bar-fill").style.width = `${percentage}%`;
        }, 150);
    });
}

// ==========================================================================
// Job Board Filter & Render Logic
// ==========================================================================
function setupEventListeners() {
    // Inputs
    document.getElementById("input-search").addEventListener("input", filterAndRenderJobs);
    document.getElementById("filter-src-linkedin").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-google").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-meta").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-netflix").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-amazon").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-nvidia").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-salesforce").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-snowflake").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-nike").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-goldmansachs").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-src-other").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-loc-usa").addEventListener("change", filterAndRenderJobs);
    document.getElementById("filter-sponsor-only").addEventListener("change", filterAndRenderJobs);
    
    // Recency radio
    const recencyRadios = document.getElementsByName("filter-recency");
    recencyRadios.forEach(radio => {
        radio.addEventListener("change", filterAndRenderJobs);
    });

    // Score Slider
    const scoreSlider = document.getElementById("filter-match-score");
    const scoreLabel = document.getElementById("match-score-label");
    scoreSlider.addEventListener("input", (e) => {
        scoreLabel.textContent = `${e.target.value}%`;
        filterAndRenderJobs();
    });

    // Reset button
    document.getElementById("btn-reset-filters").addEventListener("click", () => {
        document.getElementById("input-search").value = "";
        document.getElementById("filter-src-linkedin").checked = true;
        document.getElementById("filter-src-google").checked = true;
        document.getElementById("filter-src-meta").checked = true;
        document.getElementById("filter-src-netflix").checked = true;
        document.getElementById("filter-src-amazon").checked = true;
        document.getElementById("filter-src-nvidia").checked = true;
        document.getElementById("filter-src-salesforce").checked = true;
        document.getElementById("filter-src-snowflake").checked = true;
        document.getElementById("filter-src-nike").checked = true;
        document.getElementById("filter-src-goldmansachs").checked = true;
        document.getElementById("filter-src-other").checked = true;
        document.getElementById("filter-loc-usa").checked = true;
        document.getElementById("filter-sponsor-only").checked = false;
        document.getElementsByName("filter-recency")[0].checked = true; // 24h
        
        scoreSlider.value = 60;
        scoreLabel.textContent = "60%";

        filterAndRenderJobs();
        showToast("Filters reset");
    });

    // Sort selector
    document.getElementById("select-sort").addEventListener("change", filterAndRenderJobs);

    // Sync button
    document.getElementById("btn-sync-jobs").addEventListener("click", async () => {
        showToast("Scraping latest job postings... Please wait.");
        
        // Animate sync button spin and disable it
        const syncBtn = document.getElementById("btn-sync-jobs");
        const btnText = syncBtn.querySelector("span");
        const originalText = "Sync Feeds";
        btnText.textContent = "Syncing...";
        syncBtn.disabled = true;
        
        const svgIcon = syncBtn.querySelector("svg");
        svgIcon.style.animation = "spin 1.5s linear infinite";
        
        try {
            const response = await fetch(`${API_BASE}/api/sync`, { method: 'POST' });
            if (response.ok) {
                const data = await response.json();
                
                if (data.status === "syncing") {
                    pollSyncStatus(syncBtn, originalText, svgIcon);
                } else {
                    // Fallback in case server sync returns online immediately
                    await loadJobsData();
                    if (data.lastUpdated) {
                        document.getElementById("lbl-last-updated").textContent = `Last updated: ${data.lastUpdated}`;
                    }
                    updateDashboardStats();
                    renderDashboardJobs();
                    renderSkillMetrics();
                    filterAndRenderJobs();
                    showToast("Sync complete! Postings database refreshed.");
                    
                    svgIcon.style.animation = "";
                    btnText.textContent = originalText;
                    syncBtn.disabled = false;
                }
            } else {
                const errData = await response.json().catch(() => ({}));
                showToast(`Sync failed: ${errData.message || 'Server error'}`);
                svgIcon.style.animation = "";
                btnText.textContent = originalText;
                syncBtn.disabled = false;
            }
        } catch (e) {
            console.error("Sync error:", e);
            showToast("Sync failed: Network error. Make sure server is running.");
            svgIcon.style.animation = "";
            btnText.textContent = originalText;
            syncBtn.disabled = false;
        }
    });

    // Export PDF button
    document.getElementById("btn-export-pdf").addEventListener("click", async () => {
        const btn = document.getElementById("btn-export-pdf");
        const originalText = "Export PDF";
        const btnSpan = btn.querySelector("span");
        const svgIcon = btn.querySelector("svg");
        
        btnSpan.textContent = "Exporting...";
        btn.disabled = true;
        if (svgIcon) {
            svgIcon.style.animation = "spin 1.5s linear infinite";
        }
        
        try {
            const response = await fetch(`${API_BASE}/api/export-pdf`);
            if (response.ok) {
                const contentType = response.headers.get("content-type") || "";
                if (contentType.includes("application/pdf")) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    
                    const disposition = response.headers.get("content-disposition");
                    let filename = "daily_job_postings.pdf";
                    if (disposition && disposition.indexOf("attachment") !== -1) {
                        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                        const matches = filenameRegex.exec(disposition);
                        if (matches != null && matches[1]) { 
                            filename = matches[1].replace(/['"]/g, '');
                        }
                    }
                    
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                    showToast("PDF exported and downloaded successfully!");
                } else {
                    const data = await response.json();
                    showToast(data.message || "All postings have already been exported.");
                }
            } else {
                const err = await response.json().catch(() => ({}));
                showToast(`Export failed: ${err.message || "Server error"}`);
            }
        } catch (e) {
            console.error("Export PDF error:", e);
            showToast("Export failed: Network error.");
        } finally {
            btnSpan.textContent = originalText;
            btn.disabled = false;
            if (svgIcon) {
                svgIcon.style.animation = "";
            }
        }
    });

    // LLM Selector Event Listener
    const selectLlmEl = document.getElementById("select-llm");
    if (selectLlmEl) {
        selectLlmEl.addEventListener("change", handleLLMChange);
    }
}

async function pollSyncStatus(syncBtn, originalText, svgIcon) {
    const btnText = syncBtn.querySelector("span");
    const interval = setInterval(async () => {
        try {
            const response = await fetch(`${API_BASE}/api/status`);
            if (response.ok) {
                const data = await response.json();
                if (data.status !== "syncing") {
                    clearInterval(interval);
                    
                    // Reload jobs data
                    await loadJobsData();
                    
                    if (data.lastUpdated) {
                        document.getElementById("lbl-last-updated").textContent = `Last updated: ${data.lastUpdated}`;
                    }
                    
                    updateDashboardStats();
                    renderDashboardJobs();
                    renderSkillMetrics();
                    filterAndRenderJobs();
                    
                    showToast("Sync complete! Postings database refreshed.");
                    
                    svgIcon.style.animation = "";
                    btnText.textContent = originalText;
                    syncBtn.disabled = false;
                }
            } else {
                clearInterval(interval);
                showToast("Sync tracking failed. Check server status.");
                svgIcon.style.animation = "";
                btnText.textContent = originalText;
                syncBtn.disabled = false;
            }
        } catch (e) {
            clearInterval(interval);
            console.error("Error polling sync status:", e);
            showToast("Sync tracking lost: Server connection failed.");
            svgIcon.style.animation = "";
            btnText.textContent = originalText;
            syncBtn.disabled = false;
        }
    }, 3000); // Poll every 3 seconds
}

function filterAndRenderJobs() {
    const searchVal = document.getElementById("input-search").value.toLowerCase();
    const linkedinChecked = document.getElementById("filter-src-linkedin").checked;
    const googleChecked = document.getElementById("filter-src-google").checked;
    const metaChecked = document.getElementById("filter-src-meta").checked;
    const netflixChecked = document.getElementById("filter-src-netflix").checked;
    const amazonChecked = document.getElementById("filter-src-amazon").checked;
    const nvidiaChecked = document.getElementById("filter-src-nvidia").checked;
    const salesforceChecked = document.getElementById("filter-src-salesforce").checked;
    const snowflakeChecked = document.getElementById("filter-src-snowflake").checked;
    const nikeChecked = document.getElementById("filter-src-nike").checked;
    const goldmansachsChecked = document.getElementById("filter-src-goldmansachs").checked;
    const otherChecked = document.getElementById("filter-src-other").checked;
    const minScore = parseInt(document.getElementById("filter-match-score").value);
    const usaOnlyChecked = document.getElementById("filter-loc-usa").checked;
    const sponsorOnlyChecked = document.getElementById("filter-sponsor-only").checked;
    
    const recencyRadios = document.getElementsByName("filter-recency");
    let recencyVal = "24h";
    recencyRadios.forEach(radio => {
        if (radio.checked) recencyVal = radio.value;
    });

    const sortBy = document.getElementById("select-sort").value;

    // Apply Filter Pipeline
    let filtered = jobsList.filter(job => {
        // Search query filter
        const matchSearch = 
            job.title.toLowerCase().includes(searchVal) ||
            job.company.toLowerCase().includes(searchVal) ||
            job.description.toLowerCase().includes(searchVal) ||
            job.matchedSkills.some(s => s.toLowerCase().includes(searchVal));

        // Source filter
        let matchSource = false;
        if (job.source === "Google Careers") {
            if (googleChecked) matchSource = true;
        } else if (job.source === "Meta Careers") {
            if (metaChecked) matchSource = true;
        } else if (job.source === "Netflix Careers") {
            if (netflixChecked) matchSource = true;
        } else if (job.source === "Amazon Careers") {
            if (amazonChecked) matchSource = true;
        } else if (job.source === "Nvidia Careers") {
            if (nvidiaChecked) matchSource = true;
        } else if (job.source === "Salesforce Careers") {
            if (salesforceChecked) matchSource = true;
        } else if (job.source === "Snowflake Careers") {
            if (snowflakeChecked) matchSource = true;
        } else if (job.source === "Nike Careers") {
            if (nikeChecked) matchSource = true;
        } else if (job.source === "Goldman Sachs Careers") {
            if (goldmansachsChecked) matchSource = true;
        } else if (job.source.endsWith("Careers")) {
            if (otherChecked) matchSource = true;
        } else {
            if (linkedinChecked) matchSource = true;
        }

        // Recency filter
        const matchRecency = recencyVal === "all" ? true : job.isRecent;

        // Match Score filter
        const matchScoreValue = job.matchScore >= minScore;

        // USA Location filter
        const matchUsa = !usaOnlyChecked || (job.isUsBased === true);

        // Sponsorship filter
        const matchSponsorship = !sponsorOnlyChecked || (job.visaSponsorship === "Yes" || job.visaSponsorship === "Likely");

        return matchSearch && matchSource && matchRecency && matchScoreValue && matchUsa && matchSponsorship;
    });

    // Apply Sort Pipeline
    if (sortBy === "match") {
        filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else {
        filtered.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    }

    // Render count
    document.getElementById("filtered-jobs-count").textContent = `${filtered.length} Jobs Found`;

    // Render list
    const listingsContainer = document.getElementById("job-listings-container");
    listingsContainer.innerHTML = "";

    if (filtered.length === 0) {
        listingsContainer.innerHTML = `
            <div class="empty-state" style="text-align:center; padding: 40px 20px;">
                <p style="color:var(--text-muted); font-size:0.9rem;">No matching job postings found. Try adjustments.</p>
            </div>
        `;
        document.getElementById("job-detail-container").innerHTML = `
            <div class="empty-detail-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                <h3>No postings matching filters</h3>
                <p>Relax filters to explore roles matching your requirements.</p>
            </div>
        `;
        return;
    }

    filtered.forEach(job => {
        const card = document.createElement("div");
        card.id = `card-${job.id}`;
        card.className = `job-card ${selectedJob && selectedJob.id === job.id ? 'selected' : ''}`;
        
        let matchClass = "high";
        if (job.matchScore < 85 && job.matchScore >= 70) matchClass = "medium";
        if (job.matchScore < 70) matchClass = "low";

        let badgeRowHtml = `<span class="mini-badge location">${job.location}</span>`;
        if (job.isUsBased) {
            badgeRowHtml += `<span class="mini-badge usa">USA</span>`;
        }
        if (job.visaSponsorship === "Yes") {
            badgeRowHtml += `<span class="mini-badge sponsor-yes">Sponsorship: Yes</span>`;
        } else if (job.visaSponsorship === "Likely") {
            badgeRowHtml += `<span class="mini-badge sponsor-likely">Sponsorship: Likely</span>`;
        }
        if (job.experienceRequired) {
            badgeRowHtml += `<span class="mini-badge experience">${job.experienceRequired}+ Yrs Exp</span>`;
        }
        if (job.isRecent) {
            badgeRowHtml += `<span class="mini-badge recency">Last 24h</span>`;
        }
        if (job.jobId) {
            let displayId = job.jobId;
            if (displayId.length > 15) {
                const prefixMatch = displayId.match(/^(REQ|JR|JOB)-/);
                if (prefixMatch) {
                    const prefix = prefixMatch[0];
                    const rest = displayId.replace(prefix, "");
                    displayId = prefix + rest.substring(0, 8) + "...";
                } else {
                    displayId = displayId.substring(0, 12) + "...";
                }
            }
            badgeRowHtml += `<span class="mini-badge job-id" title="${escapeHtml(job.jobId)}">ID: ${escapeHtml(displayId)}</span>`;
        }

        card.innerHTML = `
            <div class="job-card-header">
                <h4 class="job-card-title">${job.title}</h4>
                <div class="match-rating">
                    <span class="match-dot ${matchClass}"></span>
                    <span>${job.matchScore}%</span>
                </div>
            </div>
            <div class="job-card-company">${job.company}</div>
            <div class="job-card-badge-row">
                ${badgeRowHtml}
            </div>
            <div class="job-card-footer">
                <span style="font-size:0.7rem; color:var(--text-muted);">${job.source}</span>
                <span style="font-size:0.68rem; color:var(--text-muted);">${formatRelativeTime(job.pubDate)} (${formatExactDateTime(job.pubDate)})</span>
            </div>
        `;

        card.addEventListener("click", () => {
            selectJobItem(job.id);
        });

        listingsContainer.appendChild(card);
    });

    // Auto-select first job if none selected (or selected no longer matches filters)
    const activeSelectedExists = filtered.find(j => selectedJob && j.id === selectedJob.id);
    if (!activeSelectedExists && filtered.length > 0) {
        selectJobItem(filtered[0].id);
    }
}

function selectJobItem(jobId) {
    // Remove previous selection states
    document.querySelectorAll(".job-card").forEach(c => c.classList.remove("selected"));
    
    // Find job
    const job = jobsList.find(j => j.id === jobId);
    if (!job) return;

    selectedJob = job;

    // Add selected class to card if exists
    const selectedCardElement = document.getElementById(`card-${jobId}`);
    if (selectedCardElement) {
        selectedCardElement.classList.add("selected");
    }

    // Render Deep-dive detail
    renderJobDetail(job);
}

function calculateRubricScores(job) {
    const matchVal = Number((job.matchScore / 20.0).toFixed(1));
    const titleL = (job.title || "").toLowerCase();
    const descL = (job.description || "").toLowerCase();
    let northStar = 3.5;
    if (titleL.includes("backend") || titleL.includes("platform") || titleL.includes("infrastructure")) {
        northStar = 4.8;
    } else if (titleL.includes("devops") || titleL.includes("sre") || titleL.includes("automation")) {
        northStar = 4.5;
    } else if (titleL.includes("full stack") || titleL.includes("fullstack")) {
        northStar = 4.2;
    } else if (titleL.includes("software") || titleL.includes("developer") || titleL.includes("engineer")) {
        northStar = 4.0;
    }
    if (descL.includes("python") || descL.includes("fastapi")) {
        northStar = Math.min(5.0, northStar + 0.2);
    }
    
    const companyL = (job.company || "").toLowerCase();
    let compRating = 3.8;
    const tier1 = ["google", "amazon", "meta", "netflix", "nvidia", "microsoft", "apple", "openai", "anthropic", "scale ai", "databricks", "palantir", "coreweave"];
    const tier2 = ["coupang", "crusoe", "digitalocean", "stripe", "salesforce", "snowflake", "airbnb", "tesla", "coinbase", "doordash", "pinterest", "block", "servicenow", "splunk", "roblox", "wayfair", "jpmorgan", "goldman sachs", "fidelity", "workday", "hubspot", "twilio", "datadog", "okta", "mongodb", "hashicorp", "elastic"];
    
    if (tier1.some(t => companyL.includes(t))) {
        compRating = 4.9;
    } else if (tier2.some(t => companyL.includes(t))) {
        compRating = 4.4;
    } else if (companyL.includes("nike") || companyL.includes("under armour")) {
        compRating = 4.1;
    }
    
    let cultureRating = 4.0;
    const locL = (job.location || "").toLowerCase();
    if (locL.includes("remote")) {
        cultureRating = 4.8;
    } else if (locL.includes("hybrid")) {
        cultureRating = 4.3;
    } else {
        cultureRating = 3.5;
    }
    const goodSignals = ["autonomy", "mentorship", "learning", "innovation", "wfh", "flexible", "trust"];
    goodSignals.forEach(sig => {
        if (descL.includes(sig)) {
            cultureRating = Math.min(5.0, cultureRating + 0.1);
        }
    });

    let redFlagsRating = 5.0;
    if (!job.recruiterName) {
        redFlagsRating -= 0.5;
    }
    if (job.experienceRequired > 4) {
        redFlagsRating -= 1.0;
    }
    if (job.visaSponsorship === "No") {
        redFlagsRating -= 2.0;
    }
    redFlagsRating = Math.max(1.0, redFlagsRating);

    const globalFit = Number(((matchVal * 2.0 + northStar * 1.5 + compRating * 1.0 + cultureRating * 1.0 + redFlagsRating * 1.0) / 6.5).toFixed(1));

    return {
        match: matchVal,
        northstar: northStar,
        comp: compRating,
        culture: cultureRating,
        redflags: redFlagsRating,
        global: globalFit
    };
}

function renderJobDetail(job) {
    const detailContainer = document.getElementById("job-detail-container");
    const sourceClass = job.source.toLowerCase().split(" ")[0];
    
    let dialColor = "var(--accent-emerald)";
    let scoreClass = "high";
    if (job.matchScore < 85 && job.matchScore >= 70) {
        dialColor = "var(--accent-amber)";
        scoreClass = "medium";
    } else if (job.matchScore < 70) {
        dialColor = "var(--accent-rose)";
        scoreClass = "low";
    }

    const rubric = calculateRubricScores(job);

    // Render skills lists
    const matchedTags = job.matchedSkills.map(s => `<span class="skill-tag match">${s}</span>`).join("");
    const missingTags = job.missingSkills.map(s => `<span class="skill-tag missing">${s}</span>`).join("");

    const isLinkedInUrl = job.applyUrl && job.applyUrl.includes("linkedin.com");
    const isMock = job.id.startsWith("syn-") || job.id.startsWith("fallback-") || job.id.startsWith("static-");
    
    let showCareersBtn = true;
    let showLinkedInBtn = true;
    
    if (isLinkedInUrl) {
        showCareersBtn = !!job.jobId;
    } else {
        showCareersBtn = true;
        showLinkedInBtn = false;
    }

    detailContainer.innerHTML = `
        <div class="detail-header">
            <div class="detail-header-meta">
                <span class="source-tag ${sourceClass}">${job.source}</span>
                <span style="font-size: 0.78rem; color: var(--text-muted);">${formatRelativeTime(job.pubDate)} (${formatExactDateTime(job.pubDate)})</span>
            </div>
            <h3>${job.title}</h3>
            <p class="detail-company">${job.company}</p>
        </div>

        <div class="detail-grid">
            <div class="detail-grid-item">
                <span>Location</span>
                <p>${job.location} ${job.isUsBased ? '<strong style="color: var(--accent-blue); font-size: 0.72rem; margin-left: 4px;">(US Based)</strong>' : ''}</p>
            </div>
            <div class="detail-grid-item">
                <span>Experience Required</span>
                <p>${job.experienceRequired ? job.experienceRequired + '+ Years' : '3+ Years'}</p>
            </div>
            <div class="detail-grid-item">
                <span>Visa Sponsorship</span>
                <p>${job.visaSponsorship === 'Yes' ? '<span style="color: var(--accent-emerald); font-weight: 600;">Sponsorship Offered (Yes)</span>' : (job.visaSponsorship === 'Likely' ? '<span style="color: var(--accent-purple); font-weight: 600;">Sponsorship Likely</span>' : '<span style="color: var(--text-muted);">No Sponsorship</span>')}</p>
            </div>
            <div class="detail-grid-item">
                <span>Compensation</span>
                <p>Competitive Rate</p>
            </div>
            <div class="detail-grid-item">
                <span>Job ID / Req ID</span>
                <p>${job.jobId ? `<span class="job-id-mono">${job.jobId}</span>` : '<span class="text-muted">N/A</span>'}</p>
            </div>
            <div class="detail-grid-item">
                <span>Employment Type</span>
                <p>Full-Time</p>
            </div>
        </div>

        <div class="detail-section">
            <h4>Profile Match Score</h4>
            <div class="detail-match-breakdown">
                <div class="match-summary-row">
                    <div class="match-dial" style="color: ${dialColor};">${job.matchScore}%</div>
                    <div class="match-summary-text">
                        <strong>Match Level: ${scoreClass.toUpperCase()}</strong><br>
                        ${job.explanation}
                    </div>
                </div>
            </div>
        </div>

        <div class="rubric-section">
            <div class="rubric-title">
                <span>Career-Ops Rubric Evaluation</span>
                <span style="color: var(--accent-blue); font-size: 0.82rem; font-weight: 700;">${rubric.global} / 5.0 Global Fit</span>
            </div>
            <div class="rubric-grid">
                <div class="rubric-item">
                    <div class="rubric-item-header">
                        <span class="rubric-item-label">Match Alignment</span>
                        <span class="rubric-item-value">${rubric.match} / 5.0</span>
                    </div>
                    <div class="rubric-bar-outer">
                        <div class="rubric-bar-inner match" style="width: ${rubric.match * 20}%"></div>
                    </div>
                </div>
                <div class="rubric-item">
                    <div class="rubric-item-header">
                        <span class="rubric-item-label">North-Star Goal</span>
                        <span class="rubric-item-value">${rubric.northstar} / 5.0</span>
                    </div>
                    <div class="rubric-bar-outer">
                        <div class="rubric-bar-inner northstar" style="width: ${rubric.northstar * 20}%"></div>
                    </div>
                </div>
                <div class="rubric-item">
                    <div class="rubric-item-header">
                        <span class="rubric-item-label">Comp Potential</span>
                        <span class="rubric-item-value">${rubric.comp} / 5.0</span>
                    </div>
                    <div class="rubric-bar-outer">
                        <div class="rubric-bar-inner comp" style="width: ${rubric.comp * 20}%"></div>
                    </div>
                </div>
                <div class="rubric-item">
                    <div class="rubric-item-header">
                        <span class="rubric-item-label">Culture & Remote</span>
                        <span class="rubric-item-value">${rubric.culture} / 5.0</span>
                    </div>
                    <div class="rubric-bar-outer">
                        <div class="rubric-bar-inner culture" style="width: ${rubric.culture * 20}%"></div>
                    </div>
                </div>
                <div class="rubric-item">
                    <div class="rubric-item-header">
                        <span class="rubric-item-label">Risk (Red Flags Check)</span>
                        <span class="rubric-item-value">${rubric.redflags} / 5.0</span>
                    </div>
                    <div class="rubric-bar-outer">
                        <div class="rubric-bar-inner redflags" style="width: ${rubric.redflags * 20}%"></div>
                    </div>
                </div>
                <div class="rubric-item">
                    <div class="rubric-item-header">
                        <span class="rubric-item-label">Global Fit Target</span>
                        <span class="rubric-item-value" style="color: var(--accent-blue);">${rubric.global} / 5.0</span>
                    </div>
                    <div class="rubric-bar-outer">
                        <div class="rubric-bar-inner global" style="width: ${rubric.global * 20}%"></div>
                    </div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>Skills Alignment</h4>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <div>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">MATCHING ASSETS (${job.matchedSkills.length})</p>
                    <div class="skills-tags-list">
                        ${matchedTags || '<span style="color:var(--text-muted); font-size:0.8rem;">No overlap matches found.</span>'}
                    </div>
                </div>
                <div>
                    <p style="font-size:0.75rem; color:var(--text-muted); margin-bottom:6px;">MISSING DESIRED SKILLS (${job.missingSkills.length})</p>
                    <div class="skills-tags-list">
                        ${missingTags || '<span style="color:var(--accent-emerald); font-size:0.8rem;">None! You meet all skill requirements.</span>'}
                    </div>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>Recruiter Outreach & Contact</h4>
            <div class="outreach-card">
                <!-- Extracted Contact Details -->
                <div id="outreach-extracted-contacts"></div>
                
                <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.4;">
                    Search for recruiters or hiring managers for this role on LinkedIn:
                </p>
                <div class="outreach-search-buttons">
                    <button class="btn btn-outline" id="btn-find-recruiter" style="flex: 1; padding: 10px 14px; font-size: 0.75rem;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon" style="color: #0077b5; width: 14px; height: 14px; margin-right: 6px;">
                            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                            <rect x="2" y="9" width="4" height="12"></rect>
                            <circle cx="4" cy="4" r="2"></circle>
                        </svg>
                        <span>Find Recruiters</span>
                    </button>
                    <button class="btn btn-outline" id="btn-find-hiring-manager" style="flex: 1; padding: 10px 14px; font-size: 0.75rem;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon" style="color: #3b82f6; width: 14px; height: 14px; margin-right: 6px;">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span>Find Hiring Managers</span>
                    </button>
                </div>
                <p style="font-size: 0.78rem; color: var(--text-secondary); margin-bottom: 8px;">
                    Send a message when reaching out:
                </p>
                <div class="outreach-message-container">
                    <textarea class="outreach-textarea" id="txt-outreach-message" readonly rows="8"></textarea>
                    <button class="btn-copy-outreach" id="btn-copy-outreach">Copy Message</button>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4>Job Description Summary</h4>
            <div class="detail-description">
                <p>${job.description}</p>
            </div>
        </div>

        <div class="detail-actions">
            <button class="btn btn-outline" id="btn-track-opportunity">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>Track Job</span>
            </button>
            <button class="btn btn-primary" id="btn-optimize-apply">
                <span>AI Optimize</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            <button class="btn btn-primary" id="btn-auto-apply" style="background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%); border-color: #ef4444;">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon" style="margin-right: 6px;">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
                <span>Auto Apply</span>
            </button>
            <button class="btn btn-outline" id="btn-apply-linkedin" style="display: ${showLinkedInBtn ? 'inline-flex' : 'none'};">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon" style="color: #0099ff;">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                </svg>
                <span>LinkedIn Page</span>
            </button>
            <button class="btn btn-outline" id="btn-apply-careers" style="display: ${showCareersBtn ? 'inline-flex' : 'none'};">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon" style="color: #10b981;">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
                <span>Careers Page</span>
            </button>
        </div>
    `;

    // Hook tracker button
    document.getElementById("btn-track-opportunity").addEventListener("click", () => {
        addJobToTracker(job);
    });

    // Hook Find Recruiter button
    document.getElementById("btn-find-recruiter").addEventListener("click", () => {
        const roleKeyword = getRoleKeyword(job.title);
        const query = encodeURIComponent(`"${job.company}" recruiter (${roleKeyword}) "hiring"`);
        window.open(`https://www.linkedin.com/search/results/people/?keywords=${query}`, "_blank");
    });

    // Hook Find Hiring Manager button
    document.getElementById("btn-find-hiring-manager").addEventListener("click", () => {
        const roleKeyword = getRoleKeyword(job.title);
        const query = encodeURIComponent(`"${job.company}" ("hiring manager" OR "engineering manager" OR "technical lead" OR "team lead") (${roleKeyword})`);
        window.open(`https://www.linkedin.com/search/results/people/?keywords=${query}`, "_blank");
    });

    // Generate tailored outreach message
    const skillsToMention = (job.matchedSkills || []).slice(0, 3).map(s => s.trim());
    let skillsSentence = "";
    if (skillsToMention.length > 0) {
        skillsSentence = `specifically with your requirements in ${skillsToMention.join(', ')}`;
    } else {
        skillsSentence = "specifically with your backend engineering requirements";
    }

    let contactGreetingName = "Hiring Team";
    if (job.recruiterName) {
        const firstWord = job.recruiterName.trim().split(/\s+/)[0];
        if (firstWord && firstWord.length > 1 && !firstWord.endsWith(".")) {
            contactGreetingName = firstWord;
        } else {
            contactGreetingName = job.recruiterName;
        }
    }

    const outreachMessage = `Hi ${contactGreetingName},

I hope you're having a great day. I recently saw the opening for the ${job.title} position at ${job.company} and wanted to reach out.

My background aligns closely with this role—${skillsSentence}. In my current role at HSBC, I design and scale high-throughput backend microservices handling over 1M+ daily transactions, which has allowed me to build strong expertise in these stack areas.

I would love to connect and share my resume with you if you are open to a brief chat.

Best regards,
Sai Swaroop Reddy
saiswaroopkakuru@gmail.com | +1(408)-590-8917
https://www.linkedin.com/in/venkatasaiswaroopkakuru/`;

    // Populate message in textarea
    const txtArea = document.getElementById("txt-outreach-message");
    if (txtArea) {
        txtArea.value = outreachMessage;
    }

    // Hook Copy Outreach Message button
    const copyBtn = document.getElementById("btn-copy-outreach");
    if (copyBtn && txtArea) {
        copyBtn.addEventListener("click", () => {
            navigator.clipboard.writeText(txtArea.value).then(() => {
                copyBtn.textContent = "Copied!";
                copyBtn.classList.add("copied");
                showToast("Outreach message copied to clipboard!");
                setTimeout(() => {
                    copyBtn.textContent = "Copy Message";
                    copyBtn.classList.remove("copied");
                }, 2000);
            }).catch(err => {
                console.error("Clipboard copy failed: ", err);
                showToast("Failed to copy. Please manually copy the message.");
            });
        });
    }

    // Extract contact info using regex
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const linkedinProfileRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/gi;
    
    const emailMatches = (job.description || "").match(emailRegex);
    const linkedinMatches = (job.description || "").match(linkedinProfileRegex);
    
    let contacts = [];
    if (job.recruiterName) {
        const cleanName = cleanRecruiterName(job.recruiterName);
        const rawProfile = job.recruiterProfile ? (job.recruiterProfile.startsWith("http") ? job.recruiterProfile : `https://${job.recruiterProfile}`) : "";
        const linkedinId = getLinkedInId(rawProfile);
        const nameDisplay = linkedinId ? `${cleanName} (@${linkedinId})` : cleanName;
        
        const isMock = job.id.startsWith("syn-") || job.id.startsWith("fallback-") || job.id.startsWith("static-");
        const fullProfile = isMock 
            ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(cleanName + ' ' + job.company)}`
            : rawProfile;
            
        const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(cleanName + ' ' + job.company)}`;
        
        let profileHtml = "";
        if (rawProfile && !isMock) {
            profileHtml = `<a href="${rawProfile}" target="_blank">${escapeHtml(nameDisplay)}</a>`;
            profileHtml += ` <a href="${searchUrl}" target="_blank" style="margin-left: 6px; font-size: 0.65rem; color: var(--accent-purple); text-decoration: underline;" title="Search LinkedIn if direct link fails">🔍 Search LinkedIn</a>`;
        } else {
            profileHtml = `<a href="${searchUrl}" target="_blank" title="Search LinkedIn">${escapeHtml(nameDisplay)}</a>`;
        }
            
        let emailHtml = "";
        const currentEmail = job.recruiterEmail || "";
        const domain = currentEmail ? (currentEmail.split("@")[1] || "") : "";
        const isScraped = job.recruiterEmailSource === "scraped";
        const badgeText = isScraped ? "Verified Scraped" : "Estimated";
        const badgeColor = isScraped ? "var(--accent-emerald)" : "var(--accent-amber)";
        const badgeBg = isScraped ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)";
        const badgeBorder = isScraped ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)";
        
        const badgeHtml = currentEmail ? `<span style="font-size: 0.62rem; color: ${badgeColor}; background: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 4px; padding: 1px 4px; margin-left: 6px; font-weight: 500;">${badgeText}</span>` : "";
        
        const companyCleaned = cleanCompanyName(job.company);
        const googleQuery = currentEmail ? `"${cleanName}" "${domain}" email OR contact` : `"${cleanName}" "${companyCleaned}" email OR contact`;
        const rocketreachQuery = currentEmail ? `site:rocketreach.co "${cleanName}" "${domain}"` : `site:rocketreach.co "${cleanName}" "${companyCleaned}"`;
        
        const verifyHtml = cleanName
            ? `
               <a href="https://www.google.com/search?q=${encodeURIComponent(googleQuery)}" target="_blank" style="color: var(--accent-purple); font-size: 0.65rem; text-decoration: underline; display: inline-flex; align-items: center;" title="Search Google for original email or contact info">🔍 Verify Email</a>
               <a href="https://www.google.com/search?q=${encodeURIComponent(rocketreachQuery)}" target="_blank" style="color: var(--accent-purple); font-size: 0.65rem; text-decoration: underline; margin-left: 6px; display: inline-flex; align-items: center;" title="Find recruiter RocketReach profile via Google">🚀 RocketReach</a>
              `
            : "";

        if (currentEmail) {
            emailHtml = `
                <div id="email-container-${job.id}" style="width: 100%;">
                    <div class="hub-recruiter-card-email" style="margin-top: 4px; display: flex; align-items: center; flex-wrap: wrap;">
                        📧 <a href="mailto:${currentEmail}">${escapeHtml(currentEmail)}</a> ${badgeHtml}
                        <button onclick="event.preventDefault(); window.startEditEmail('${job.id}', false)" class="btn-edit-recruiter-email" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; font-size: 0.75rem; margin-left: 6px; display: inline-flex; align-items: center;" title="Edit Recruiter Email">✏️</button>
                    </div>
                </div>
            `;
        } else {
            emailHtml = `
                <div id="email-container-${job.id}" style="width: 100%;">
                    <div class="hub-recruiter-card-email" style="margin-top: 4px; display: flex; align-items: center; flex-wrap: wrap;">
                        📧 <span style="color: var(--text-muted); font-style: italic;">No email listed</span>
                        <button onclick="event.preventDefault(); window.startEditEmail('${job.id}', false)" class="btn-edit-recruiter-email" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; font-size: 0.75rem; margin-left: 6px; display: inline-flex; align-items: center;" title="Add Recruiter Email">✏️ Add Email</button>
                    </div>
                </div>
            `;
        }

        contacts.push(`
            <div class="hub-recruiter-card" style="margin-bottom: 12px; border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; background: rgba(255, 255, 255, 0.03); width: 100%;">
                <div class="hub-recruiter-card-header" style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px;">
                    ${isMock ? 'Suggested Recruiter (Representative)' : 'Job Poster / Recruiter'}
                </div>
                <div class="hub-recruiter-card-name" style="font-weight: 600; font-size: 0.85rem; color: var(--text-primary);">👤 ${profileHtml}</div>
                ${job.recruiterTitle ? `<div class="hub-recruiter-card-title" style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(job.recruiterTitle)}</div>` : ""}
                ${emailHtml}
                ${verifyHtml ? `<div class="recruiter-verify-row" style="margin-top: 6px; display: flex; gap: 8px; flex-wrap: wrap; font-size: 0.65rem;">${verifyHtml}</div>` : ""}
                ${isMock ? `<div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 6px; font-style: italic;">*Representative profile. Use search buttons below to find the active hiring team.</div>` : ""}
            </div>
        `);
    }
    if (emailMatches) {
        // deduplicate emails
        const uniqueEmails = Array.from(new Set(emailMatches));
        uniqueEmails.forEach(email => {
            contacts.push(`<span class="extracted-contact-badge">📧 Direct Email: <a href="mailto:${email}">${email}</a></span>`);
        });
    }
    if (linkedinMatches) {
        // deduplicate linkedin profiles
        const uniqueLinkedins = Array.from(new Set(linkedinMatches));
        uniqueLinkedins.forEach(link => {
            const fullLink = link.startsWith("http") ? link : `https://${link}`;
            contacts.push(`<span class="extracted-contact-badge">🔗 Recruiter Profile: <a href="${fullLink}" target="_blank">${link}</a></span>`);
        });
    }
    
    const contactsContainer = document.getElementById("outreach-extracted-contacts");
    if (contactsContainer && contacts.length > 0) {
        contactsContainer.innerHTML = `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px;">${contacts.join("")}</div>`;
    }

    // Hook Claude Optimize jump button
    document.getElementById("btn-optimize-apply").addEventListener("click", () => {
        // Jump to Claude optimizer panel
        document.getElementById("nav-claude").click();
        
        // Trigger optimizer engine inside copilot.js
        if (window.triggerClaudeOptimization) {
            window.triggerClaudeOptimization(job);
        }
    });

    // Hook Auto Apply button
    document.getElementById("btn-auto-apply").addEventListener("click", () => {
        triggerAutoApply(job);
    });

    // Hook LinkedIn Page button
    document.getElementById("btn-apply-linkedin").addEventListener("click", () => {
        const isMock = job.id.startsWith("syn-") || job.id.startsWith("fallback-") || job.id.startsWith("static-");
        const isLinkedInUrl = job.applyUrl && job.applyUrl.includes("linkedin.com");
        
        if (isLinkedInUrl && !isMock) {
            window.open(job.applyUrl, "_blank");
        } else {
            const compCleaned = cleanCompanyName(job.company);
            const queryTerm = `${job.title} ${compCleaned}`;
            window.open(`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(queryTerm)}`, "_blank");
        }
    });

    // Hook Careers Page button
    document.getElementById("btn-apply-careers").addEventListener("click", () => {
        const isMock = job.id.startsWith("syn-") || job.id.startsWith("fallback-") || job.id.startsWith("static-");
        const isLinkedInUrl = job.applyUrl && job.applyUrl.includes("linkedin.com");
        
        if (job.applyUrl && !isLinkedInUrl && !isMock) {
            window.open(job.applyUrl, "_blank");
        } else {
            const targetUrl = getCareersSearchUrl(job.company, job.title, job.jobId, isMock);
            window.open(targetUrl, "_blank");
        }
    });
}

// ==========================================================================
// Application Tracker / Kanban board Logic
// ==========================================================================
function addJobToTracker(job) {
    const exists = applicationTracker.find(a => a.id === job.id);
    if (exists) {
        showToast("Already tracking this job!");
        return;
    }

    applicationTracker.push({
        id: job.id,
        title: job.title,
        company: job.company,
        matchScore: job.matchScore,
        source: job.source,
        status: "wishlist",
        notes: "Opportunity bookmarked from feed.",
        dateAdded: new Date().toLocaleDateString()
    });

    saveTrackerToStorage();
    showToast("Added to Wishlist in Tracker!");
}

function renderKanbanBoard() {
    const statuses = ["wishlist", "applied", "interview", "offer", "rejected"];
    
    // Clear previous elements
    statuses.forEach(status => {
        const wrapper = document.getElementById(`kanban-${status}`);
        if (wrapper) {
            wrapper.innerHTML = "";
            
            // Set header count pill
            const count = applicationTracker.filter(a => a.status === status).length;
            wrapper.closest(".kanban-column").querySelector(".count-pill").textContent = count;
        }
    });

    // Append Cards
    applicationTracker.forEach(app => {
        const wrapper = document.getElementById(`kanban-${app.status}`);
        if (!wrapper) return;

        const card = document.createElement("div");
        card.className = "kanban-card";
        card.setAttribute("draggable", "true");
        card.setAttribute("data-id", app.id);
        
        const scoreClass = app.matchScore >= 85 ? "score-high" : (app.matchScore >= 70 ? "score-medium" : "score-low");
        const sourceClass = app.source.toLowerCase().split(" ")[0];

        card.innerHTML = `
            <h5>${app.title}</h5>
            <p>${app.company}</p>
            <div class="kanban-card-footer">
                <span class="kanban-score ${scoreClass}">${app.matchScore}% Match</span>
                <span class="tracker-badge ${sourceClass}">${app.source}</span>
            </div>
            <div style="margin-top:6px; font-size:0.65rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                <span>Added: ${app.dateAdded}</span>
                <span class="btn-delete-card" style="cursor:pointer; color:var(--accent-rose); font-weight:bold;">Remove</span>
            </div>
        `;

        // Handle Drag Events
        card.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", app.id);
            card.style.opacity = "0.5";
        });

        card.addEventListener("dragend", () => {
            card.style.opacity = "1";
        });

        // Handle Quick Delete button inside card
        card.querySelector(".btn-delete-card").addEventListener("click", (e) => {
            e.stopPropagation();
            removeApplication(app.id);
        });

        wrapper.appendChild(card);
    });

    // Configure Columns Drag Over & Drop
    statuses.forEach(status => {
        const wrapper = document.getElementById(`kanban-${status}`);
        if (!wrapper) return;

        wrapper.addEventListener("dragover", (e) => {
            e.preventDefault(); // Required to allow drop
            wrapper.classList.add("drag-over");
        });

        wrapper.addEventListener("dragleave", () => {
            wrapper.classList.remove("drag-over");
        });

        wrapper.addEventListener("drop", (e) => {
            e.preventDefault();
            wrapper.classList.remove("drag-over");
            
            const jobId = e.dataTransfer.getData("text/plain");
            const app = applicationTracker.find(a => a.id === jobId);
            
            if (app && app.status !== status) {
                app.status = status;
                saveTrackerToStorage();
                renderKanbanBoard();
                showToast(`Moved to ${status.toUpperCase()}`);
            }
        });
    });
}

function removeApplication(appId) {
    applicationTracker = applicationTracker.filter(a => a.id !== appId);
    saveTrackerToStorage();
    renderKanbanBoard();
    showToast("Opportunity removed from tracking");
}

// ==========================================================================
// Toast Notification Utility
// ==========================================================================
function showToast(message) {
    const toast = document.getElementById("notification-toast");
    const msgContainer = document.getElementById("toast-message");
    
    msgContainer.textContent = message;
    toast.classList.add("show");

    // Clear previous timeout if exists
    if (window.toastTimeout) {
        clearTimeout(window.toastTimeout);
    }

    window.toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ==========================================================================
// Helper Utility Functions
// ==========================================================================
function formatRelativeTime(dateStr) {
    try {
        const cleanStr = dateStr.replace(' ', 'T');
        const pubDate = new Date(cleanStr);
        const now = new Date();
        const diffMs = now - pubDate;
        
        if (isNaN(diffMs)) return "Today";

        const diffHours = Math.round(diffMs / (1000 * 60 * 60));
        
        if (diffHours <= 0) {
            const diffMin = Math.round(diffMs / (1000 * 60));
            return diffMin <= 1 ? "Just now" : `${diffMin}m ago`;
        }
        
        if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            const diffDays = Math.round(diffHours / 24);
            return diffDays === 1 ? "Yesterday" : `${diffDays}d ago`;
        }
    } catch (e) {
        return "Today";
    }
}

function formatExactDateTime(dateStr) {
    try {
        if (!dateStr) return "";
        const cleanStr = dateStr.replace(' ', 'T');
        const pubDate = new Date(cleanStr);
        if (isNaN(pubDate.getTime())) return dateStr;
        const options = { month: 'short', day: 'numeric' };
        if (dateStr.includes(" ") && !dateStr.endsWith("00:00:00")) {
            options.hour = 'numeric';
            options.minute = '2-digit';
            options.hour12 = true;
        }
        return pubDate.toLocaleString('en-US', options);
    } catch (e) {
        return dateStr;
    }
}
window.showToast = showToast; // Expose to global scope for copilot chat

// ==========================================================================
// Resume Optimizer API Controller
// ==========================================================================
async function loadBaseResumes() {
    const select = document.getElementById("select-base-resume");
    if (!select) return;
    try {
        const response = await fetch(`${API_BASE}/api/base-resumes`);
        if (response.ok) {
            const resumes = await response.json();
            select.innerHTML = "";
            resumes.forEach(name => {
                const opt = document.createElement("option");
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });
        }
    } catch (e) {
        console.error("Error loading base resumes:", e);
    }
}

async function loadOptimizedResumesHistory() {
    const historyList = document.getElementById("optimized-resumes-list");
    if (!historyList) return;
    try {
        const response = await fetch(`${API_BASE}/api/optimized-resumes`);
        if (response.ok) {
            const history = await response.json();
            if (history.length === 0) {
                historyList.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 20px 0;">No optimized resumes generated yet.</div>`;
                return;
            }
            
            historyList.innerHTML = "";
            history.forEach(item => {
                const card = document.createElement("div");
                card.className = "resume-history-item";
                card.innerHTML = `
                    <div class="resume-history-details">
                        <h6>${item.company} &middot; ${item.title}</h6>
                        <p>${item.date}</p>
                    </div>
                    <div class="resume-history-actions">
                        <button class="btn-download-icon" data-url="${item.downloadUrl}" title="Download optimized resume to your browser">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>
                    </div>
                `;
                
                card.querySelector(".btn-download-icon").addEventListener("click", () => {
                    // Browser download trigger
                    const link = document.createElement("a");
                    const rawUrl = item.downloadUrl.startsWith('http') ? item.downloadUrl : `${API_BASE}${item.downloadUrl}`;
                    link.href = rawUrl + "?cb=" + new Date().getTime();
                    link.download = item.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast("Downloading optimized resume...");
                });
                
                historyList.appendChild(card);
            });
        }
    } catch (e) {
        console.error("Error loading optimized resumes history:", e);
    }
}

function setupResumeOptimizerEvents() {
    const generateBtn = document.getElementById("btn-generate-optimized-resume");
    if (!generateBtn) return;
    
    generateBtn.addEventListener("click", async () => {
        const job = window.currentlyOptimizedJob;
        if (!job) {
            showToast("Please select a job to optimize first!");
            return;
        }
        
        const baseResumeSelect = document.getElementById("select-base-resume");
        const selectedBase = baseResumeSelect ? baseResumeSelect.value : "Sai_Swaroop_Reddy_Resume_ATS.docx";
        
        // Disable button, show loading animation
        generateBtn.disabled = true;
        const btnSpan = generateBtn.querySelector("span");
        const originalText = btnSpan.textContent;
        btnSpan.textContent = "Optimizing ATS Match...";
        
        try {
            const response = await fetch(`${API_BASE}/api/optimize-resume`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jobId: job.id,
                    baseResumeName: selectedBase,
                    company: job.company,
                    title: job.title,
                    missingSkills: job.missingSkills || [],
                    matchedSkills: job.matchedSkills || [],
                    selectedLlm: document.getElementById("select-llm") ? document.getElementById("select-llm").value : "claude"
                })
            });
            
            if (response.ok) {
                const resData = await response.json();
                showToast("Resume optimized and saved successfully!");
                
                // Play a subtle success micro-animation on the button
                btnSpan.textContent = "Match Achieved! (100%)";
                generateBtn.style.background = "linear-gradient(135deg, #10b981, #059669)";
                
                setTimeout(() => {
                    generateBtn.style.background = "";
                    btnSpan.textContent = originalText;
                    generateBtn.disabled = false;
                }, 3000);
                
                // Trigger auto-download link
                const link = document.createElement("a");
                const rawUrl = resData.downloadUrl.startsWith('http') ? resData.downloadUrl : `${API_BASE}${resData.downloadUrl}`;
                link.href = rawUrl + "?cb=" + new Date().getTime();
                link.download = resData.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Reload history
                await loadOptimizedResumesHistory();
            } else {
                const errorData = await response.json();
                showToast(`Optimization failed: ${errorData.message}`);
                generateBtn.disabled = false;
                btnSpan.textContent = originalText;
            }
        } catch (e) {
            console.error("Optimization error:", e);
            showToast("Network error. Ensure local server is running.");
            generateBtn.disabled = false;
            btnSpan.textContent = originalText;
        }
    });
}

// ==========================================================================
// Recruiter Hub Event setup & rendering logic
// ==========================================================================
function setupRecruiterHubEvents() {
    const refreshHubBtn = document.getElementById("btn-refresh-hub");
    if (refreshHubBtn) {
        refreshHubBtn.addEventListener("click", async () => {
            showToast("Syncing resume history...");
            const svgIcon = refreshHubBtn.querySelector("svg");
            if (svgIcon) {
                svgIcon.style.animation = "spin 1s linear infinite";
            }
            refreshHubBtn.disabled = true;
            try {
                await renderRecruiterHub();
            } catch (e) {
                console.error("Failed to refresh recruiter hub:", e);
            } finally {
                if (svgIcon) {
                    svgIcon.style.animation = "";
                }
                refreshHubBtn.disabled = false;
            }
        });
    }
}

async function renderRecruiterHub() {
    const tbody = document.getElementById("recruiter-hub-tbody");
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = `
        <tr>
            <td colspan="3" style="text-align: center; padding: 30px; color: var(--text-muted);">
                <div class="typing-indicator" style="justify-content: center; margin-bottom: 10px; display: flex; gap: 4px;">
                    <span></span><span></span><span></span>
                </div>
                Loading recruiter & resume hub data...
            </td>
        </tr>
    `;

    try {
        // Fetch history
        const response = await fetch(`${API_BASE}/api/optimized-resumes`);
        let history = [];
        if (response.ok) {
            history = await response.json();
        }

        // Map history by jobId for quick lookup
        const historyMap = {};
        history.forEach(item => {
            if (item.jobId) {
                historyMap[item.jobId] = item;
            }
        });

        tbody.innerHTML = "";

        if (jobsList.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" style="text-align: center; padding: 30px; color: var(--text-muted);">
                        No job opportunities found. Use the sync feature or refresh.
                    </td>
                </tr>
            `;
            return;
        }

        jobsList.forEach(job => {
            const tr = document.createElement("tr");

            // --- Column 1: Target Role & Company ---
            let scoreClass = "high";
            if (job.matchScore < 85 && job.matchScore >= 70) scoreClass = "medium";
            if (job.matchScore < 70) scoreClass = "low";

            const colRole = document.createElement("td");
            colRole.innerHTML = `
                <div class="hub-role-info">
                    <h5>${escapeHtml(job.title)}</h5>
                    <p style="margin-top: 4px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <strong>${escapeHtml(job.company)}</strong>
                        <span style="color: var(--text-muted);">&middot;</span>
                        <span>${escapeHtml(job.location)}</span>
                        <span style="color: var(--text-muted);">&middot;</span>
                        <span class="mini-badge ${scoreClass}" style="font-size: 0.65rem; padding: 1px 6px;">${job.matchScore}% Match</span>
                        <span style="color: var(--text-muted);">&middot;</span>
                        <span style="font-size: 0.68rem; color: var(--text-secondary);">${formatRelativeTime(job.pubDate)} (${formatExactDateTime(job.pubDate)})</span>
                    </p>
                </div>
            `;
            tr.appendChild(colRole);

            // --- Column 2: Recruiter Outreach ---
            const colRecruiter = document.createElement("td");
            colRecruiter.className = "hub-recruiter-info";

            let contactsHtml = "";
            let renderedRecruiterCardHtml = "";
            if (job.recruiterName) {
                const cleanName = cleanRecruiterName(job.recruiterName);
                const rawProfile = job.recruiterProfile ? (job.recruiterProfile.startsWith("http") ? job.recruiterProfile : `https://${job.recruiterProfile}`) : "";
                const linkedinId = getLinkedInId(rawProfile);
                const nameDisplay = linkedinId ? `${cleanName} (@${linkedinId})` : cleanName;
                
                const isMock = job.id.startsWith("syn-") || job.id.startsWith("fallback-") || job.id.startsWith("static-");
                const fullProfile = isMock 
                    ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(cleanName + ' ' + job.company)}`
                    : rawProfile;
                    
                const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(cleanName + ' ' + job.company)}`;
                
                let nameHtml = "";
                if (rawProfile && !isMock) {
                    nameHtml = `<a href="${rawProfile}" target="_blank">👤 ${escapeHtml(nameDisplay)}</a>`;
                    nameHtml += ` <a href="${searchUrl}" target="_blank" style="margin-left: 6px; font-size: 0.62rem; color: var(--accent-purple); text-decoration: underline;" title="Search LinkedIn fallback">🔍 Search LinkedIn</a>`;
                } else {
                    nameHtml = `<a href="${searchUrl}" target="_blank" title="Search LinkedIn">👤 ${escapeHtml(nameDisplay)}</a>`;
                }
                
                let emailHtml = "";
                const currentEmail = job.recruiterEmail || "";
                const domain = currentEmail ? (currentEmail.split("@")[1] || "") : "";
                const isScraped = job.recruiterEmailSource === "scraped";
                const badgeText = isScraped ? "Verified" : "Est.";
                const badgeColor = isScraped ? "var(--accent-emerald)" : "var(--accent-amber)";
                const badgeBg = isScraped ? "rgba(16,185,129,0.08)" : "rgba(245,158,11,0.08)";
                const badgeBorder = isScraped ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)";
                
                const badgeHtml = currentEmail ? `<span style="font-size: 0.58rem; color: ${badgeColor}; background: ${badgeBg}; border: 1px solid ${badgeBorder}; border-radius: 4px; padding: 1px 3px; margin-left: 4px; font-weight: 500; display: inline-block; vertical-align: middle;">${badgeText}</span>` : ""
                
                const companyCleaned = cleanCompanyName(job.company);
                const googleQuery = currentEmail ? `"${cleanName}" "${domain}" email OR contact` : `"${cleanName}" "${companyCleaned}" email OR contact`;
                const rocketreachQuery = currentEmail ? `site:rocketreach.co "${cleanName}" "${domain}"` : `site:rocketreach.co "${cleanName}" "${companyCleaned}"`;
                
                const verifyHtml = cleanName
                    ? `
                       <a href="https://www.google.com/search?q=${encodeURIComponent(googleQuery)}" target="_blank" style="color: var(--accent-purple); font-size: 0.62rem; text-decoration: underline; display: inline-flex; align-items: center;" title="Search Google for original email or contact info">🔍 Verify</a>
                       <a href="https://www.google.com/search?q=${encodeURIComponent(rocketreachQuery)}" target="_blank" style="color: var(--accent-purple); font-size: 0.62rem; text-decoration: underline; margin-left: 6px; display: inline-flex; align-items: center;" title="Find recruiter RocketReach profile via Google">🚀 RocketReach</a>
                      `
                    : "";

                if (currentEmail) {
                    emailHtml = `
                        <div id="email-container-hub-${job.id}" style="width: 100%;">
                            <div class="hub-recruiter-card-email" style="margin-top: 3px; font-size: 0.68rem; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                                📧 <a href="mailto:${currentEmail}">${escapeHtml(currentEmail)}</a> ${badgeHtml}
                                <button onclick="event.preventDefault(); window.startEditEmail('${job.id}', true)" class="btn-edit-recruiter-email" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 1px; font-size: 0.68rem;" title="Edit Recruiter Email">✏️</button>
                            </div>
                        </div>
                    `;
                } else {
                    emailHtml = `
                        <div id="email-container-hub-${job.id}" style="width: 100%;">
                            <div class="hub-recruiter-card-email" style="margin-top: 3px; font-size: 0.68rem; display: flex; align-items: center; flex-wrap: wrap; gap: 4px;">
                                📧 <span style="color: var(--text-muted); font-style: italic;">No email listed</span>
                                <button onclick="event.preventDefault(); window.startEditEmail('${job.id}', true)" class="btn-edit-recruiter-email" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 1px; font-size: 0.68rem;" title="Add Recruiter Email">✏️ Add Email</button>
                            </div>
                        </div>
                    `;
                }

                renderedRecruiterCardHtml = `
                    <div class="hub-recruiter-card">
                        <div class="hub-recruiter-card-header">${isMock ? 'Suggested Recruiter' : 'Job Poster / Recruiter'}</div>
                        <div class="hub-recruiter-card-name">${nameHtml}</div>
                        ${job.recruiterTitle ? `<div class="hub-recruiter-card-title">${escapeHtml(job.recruiterTitle)}</div>` : ""}
                        ${emailHtml}
                        ${verifyHtml ? `<div class="recruiter-verify-row" style="margin-top: 4px; display: flex; gap: 6px; flex-wrap: wrap; font-size: 0.62rem;">${verifyHtml}</div>` : ""}
                        ${isMock ? `<div style="font-size: 0.62rem; color: var(--text-muted); margin-top: 4px; font-style: italic; line-height: 1.2;">*Representative contact. Use "Find Recruiter" to locate active hiring team.</div>` : ""}
                    </div>
                `;
            }

            // Extract contact info using regex (emails & linkedin profiles)
            const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
            const linkedinProfileRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+)/gi;
            
            const emailMatches = (job.description || "").match(emailRegex);
            const linkedinMatches = (job.description || "").match(linkedinProfileRegex);
            
            if (emailMatches) {
                const uniqueEmails = Array.from(new Set(emailMatches));
                uniqueEmails.forEach(email => {
                    contactsHtml += `
                        <span class="hub-recruiter-badge email">
                            📧 <a href="mailto:${email}" title="Email recruiter directly">${escapeHtml(email)}</a>
                        </span>
                    `;
                });
            }
            if (linkedinMatches) {
                const uniqueLinkedins = Array.from(new Set(linkedinMatches));
                uniqueLinkedins.forEach(link => {
                    // Skip if it's already shown in the recruiter card
                    if (job.recruiterProfile && (link.includes(job.recruiterProfile) || job.recruiterProfile.includes(link))) {
                        return;
                    }
                    const fullLink = link.startsWith("http") ? link : `https://${link}`;
                    contactsHtml += `
                        <span class="hub-recruiter-badge linkedin">
                            🔗 <a href="${fullLink}" target="_blank" title="Visit recruiter LinkedIn profile">Recruiter Profile</a>
                        </span>
                    `;
                });
            }

            const recruiterButtonsWrapper = document.createElement("div");
            recruiterButtonsWrapper.style.display = "flex";
            recruiterButtonsWrapper.style.gap = "8px";
            recruiterButtonsWrapper.style.flexWrap = "wrap";
            recruiterButtonsWrapper.style.marginTop = (renderedRecruiterCardHtml || contactsHtml) ? "6px" : "0px";

            // Recruiter search button
            const searchBtn = document.createElement("button");
            searchBtn.className = "hub-recruiter-search-btn";
            searchBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:11px; height:11px;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                Find Recruiter
            `;
            searchBtn.addEventListener("click", () => {
                const roleKeyword = getRoleKeyword(job.title);
                const query = encodeURIComponent(`"${job.company}" recruiter (${roleKeyword}) "hiring"`);
                window.open(`https://www.linkedin.com/search/results/people/?keywords=${query}`, "_blank");
            });
            recruiterButtonsWrapper.appendChild(searchBtn);

            // Copy Outreach message button
            const copyMsgBtn = document.createElement("button");
            copyMsgBtn.className = "hub-recruiter-search-btn";
            copyMsgBtn.style.color = "var(--accent-purple)";
            copyMsgBtn.style.background = "rgba(139, 92, 246, 0.05)";
            copyMsgBtn.style.borderColor = "rgba(139, 92, 246, 0.15)";
            copyMsgBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:11px; height:11px;">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy Message
            `;
            copyMsgBtn.addEventListener("click", () => {
                // Generate message
                const skillsToMention = (job.matchedSkills || []).slice(0, 3).map(s => s.trim());
                let skillsSentence = "";
                if (skillsToMention.length > 0) {
                    skillsSentence = `specifically with your requirements in ${skillsToMention.join(', ')}`;
                } else {
                    skillsSentence = "specifically with your backend engineering requirements";
                }

                let greetingName = "Hiring Team";
                if (job.recruiterName) {
                    const firstWord = job.recruiterName.trim().split(/\s+/)[0];
                    if (firstWord && firstWord.length > 1 && !firstWord.endsWith(".")) {
                        greetingName = firstWord;
                    } else {
                        greetingName = job.recruiterName;
                    }
                }

                const msg = `Hi ${greetingName},

I hope you're having a great day. I recently saw the opening for the ${job.title} position at ${job.company} and wanted to reach out.

My background aligns closely with this role—${skillsSentence}. In my current role at HSBC, I design and scale high-throughput backend microservices handling over 1M+ daily transactions, which has allowed me to build strong expertise in these stack areas.

I would love to connect and share my resume with you if you are open to a brief chat.

Best regards,
Sai Swaroop Reddy
saiswaroopkakuru@gmail.com | +1(408)-590-8917
https://www.linkedin.com/in/venkatasaiswaroopkakuru/`;
                
                navigator.clipboard.writeText(msg).then(() => {
                    showToast("Outreach message copied for " + job.company + "!");
                    copyMsgBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:11px; height:11px; color: var(--accent-emerald);">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Copied!
                    `;
                    setTimeout(() => {
                        copyMsgBtn.innerHTML = `
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="width:11px; height:11px;">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy Message
                        `;
                    }, 2000);
                });
            });
            recruiterButtonsWrapper.appendChild(copyMsgBtn);

            colRecruiter.innerHTML = `
                ${renderedRecruiterCardHtml}
                ${contactsHtml ? `<div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px;">${contactsHtml}</div>` : ""}
            `;
            colRecruiter.appendChild(recruiterButtonsWrapper);
            tr.appendChild(colRecruiter);

            // --- Column 3: Tailored ATS Resume ---
            const colResume = document.createElement("td");
            const resumeWrapper = document.createElement("div");
            resumeWrapper.className = "hub-resume-status";

            const optimizedRecord = historyMap[job.id];
            if (optimizedRecord) {
                // Tailored
                const badge = document.createElement("span");
                badge.className = "hub-resume-badge tailored";
                badge.textContent = "Tailored";
                resumeWrapper.appendChild(badge);

                const downloadBtn = document.createElement("button");
                downloadBtn.className = "hub-action-btn download";
                downloadBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px;">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Download
                `;
                downloadBtn.addEventListener("click", () => {
                    const link = document.createElement("a");
                    const rawUrl = optimizedRecord.downloadUrl.startsWith('http') ? optimizedRecord.downloadUrl : `${API_BASE}${optimizedRecord.downloadUrl}`;
                    link.href = rawUrl + "?cb=" + new Date().getTime();
                    link.download = optimizedRecord.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showToast(`Downloading tailored resume for ${job.company}...`);
                });
                resumeWrapper.appendChild(downloadBtn);
            } else {
                // Not Tailored
                const badge = document.createElement("span");
                badge.className = "hub-resume-badge not-tailored";
                badge.textContent = "Not Tailored";
                resumeWrapper.appendChild(badge);

                const optimizeBtn = document.createElement("button");
                optimizeBtn.className = "hub-action-btn optimize";
                optimizeBtn.innerHTML = `
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px; height:12px;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    Auto-Optimize
                `;
                optimizeBtn.addEventListener("click", async () => {
                    optimizeBtn.disabled = true;
                    optimizeBtn.innerHTML = `
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon" style="width:12px; height:12px; animation: spin 1.5s linear infinite;">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                        </svg>
                        Optimizing...
                    `;

                    try {
                        const baseResumeSelect = document.getElementById("select-base-resume");
                        const selectedBase = baseResumeSelect ? baseResumeSelect.value : "Sai_Swaroop_Reddy_Resume_ATS.docx";

                        const response = await fetch(`${API_BASE}/api/optimize-resume`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                jobId: job.id,
                                baseResumeName: selectedBase,
                                company: job.company,
                                title: job.title,
                                missingSkills: job.missingSkills || [],
                                matchedSkills: job.matchedSkills || [],
                                selectedLlm: document.getElementById("select-llm") ? document.getElementById("select-llm").value : "claude"
                            })
                        });

                        if (response.ok) {
                            const resData = await response.json();
                            showToast(`Resume optimized for ${job.company}!`);
                            
                            // Auto-download
                            const link = document.createElement("a");
                            const rawUrl = resData.downloadUrl.startsWith('http') ? resData.downloadUrl : `${API_BASE}${resData.downloadUrl}`;
                            link.href = rawUrl + "?cb=" + new Date().getTime();
                            link.download = resData.filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            // Re-render
                            await renderRecruiterHub();
                            // Also reload history list in the Claude tab
                            await loadOptimizedResumesHistory();
                        } else {
                            const errorData = await response.json().catch(() => ({}));
                            showToast(`Optimization failed: ${errorData.message || 'Server error'}`);
                            await renderRecruiterHub();
                        }
                    } catch (err) {
                        console.error("Hub optimization error:", err);
                        showToast("Network error during optimization.");
                        await renderRecruiterHub();
                    }
                });
                resumeWrapper.appendChild(optimizeBtn);
            }

            colResume.appendChild(resumeWrapper);
            tr.appendChild(colResume);

            tbody.appendChild(tr);
        });
    } catch (e) {
        console.error("Error rendering recruiter hub:", e);
        tbody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 30px; color: var(--text-muted);">
                    Error loading Recruiter Hub: ${escapeHtml(e.message)}
                </td>
            </tr>
        `;
    }
}

function escapeHtml(text) {
    if (!text) return "";
    return text
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Global LLM Config
const llmConfig = {
    claude: {
        name: "Claude 4.7 Sonnet",
        initials: "CL",
        colorClass: "claude-color",
        title: "Claude 4.7 Sonnet Match Optimizer"
    },
    opus: {
        name: "Claude 4.7 Opus",
        initials: "OP",
        colorClass: "opus-color",
        title: "Claude 4.7 Opus Match Optimizer"
    },
    gemini: {
        name: "Gemini 3.5 Flash",
        initials: "GE",
        colorClass: "gemini-color",
        title: "Gemini 3.5 Flash Match Optimizer"
    },
    gemini35: {
        name: "Gemini 3.5 Pro",
        initials: "G3",
        colorClass: "gemini35-color",
        title: "Gemini 3.5 Pro Match Optimizer"
    },
    gpt4o: {
        name: "GPT-5.5 Instant",
        initials: "GP",
        colorClass: "gpt-color",
        title: "GPT-5.5 Instant Match Optimizer"
    },
    gpt5: {
        name: "GPT-5.5 Pro",
        initials: "G5",
        colorClass: "gpt5-color",
        title: "GPT-5.5 Pro Match Optimizer"
    },
    deepseek: {
        name: "DeepSeek-V4-Pro",
        initials: "DS",
        colorClass: "deepseek-color",
        title: "DeepSeek-V4-Pro Match Optimizer"
    },
    llama: {
        name: "Llama 4 Maverick",
        initials: "LL",
        colorClass: "llama-color",
        title: "Llama 4 Maverick Match Optimizer"
    },
    gemma: {
        name: "Gemma 4 (Google OS)",
        initials: "GM",
        colorClass: "gemma-color",
        title: "Gemma 4 Match Optimizer"
    }
};

// Handle LLM dropdown changes globally
function handleLLMChange() {
    const selectLlmEl = document.getElementById("select-llm");
    if (!selectLlmEl) return;
    const selectedLLM = selectLlmEl.value;
    const config = llmConfig[selectedLLM] || llmConfig.claude;
    
    // Update Copilot sidebar elements
    const sidebarTitle = document.querySelector(".assistant-profile h3");
    if (sidebarTitle) {
        sidebarTitle.textContent = `${config.name} Copilot`;
    }
    
    const sidebarIcon = document.querySelector(".assistant-profile .logo-icon");
    if (sidebarIcon) {
        // remove old colors
        sidebarIcon.classList.remove("jobright-color", "claude-color", "opus-color", "gemini-color", "gemini35-color", "gpt-color", "gpt5-color", "deepseek-color", "llama-color", "gemma-color");
        // add new color
        sidebarIcon.classList.add(config.colorClass);
    }
    
    // Update Optimizer Header elements
    const optimizerAvatar = document.querySelector(".claude-optimizer-pane .optimizer-header .avatar");
    if (optimizerAvatar) {
        optimizerAvatar.textContent = config.initials;
        optimizerAvatar.classList.remove("claude-color", "opus-color", "gemini-color", "gemini35-color", "gpt-color", "gpt5-color", "deepseek-color", "llama-color", "gemma-color");
        optimizerAvatar.classList.add(config.colorClass);
    }
    
    const optimizerTitle = document.querySelector(".claude-optimizer-pane .optimizer-header h4");
    if (optimizerTitle) {
        optimizerTitle.textContent = config.title;
    }
    
    // Update credit label if it exists in DOM
    const creditLabel = document.getElementById("clpanel-credit-label");
    if (creditLabel) {
        creditLabel.textContent = `DRAFTED BY ${config.name.toUpperCase()}`;
    }
    
    // Update existing chatbot message avatars
    const botAvatars = document.querySelectorAll(".chat-messages .chat-bubble.bot .avatar");
    botAvatars.forEach(avatar => {
        avatar.textContent = config.initials;
        avatar.classList.remove("claude-color", "opus-color", "gemini-color", "gemini35-color", "gpt-color", "gpt5-color", "deepseek-color", "llama-color", "gemma-color");
        avatar.classList.add(config.colorClass);
    });
    
    // If window.currentlyOptimizedJob exists, refresh the optimizer panel report
    if (window.currentlyOptimizedJob && typeof window.renderClaudeOptimizedReport === 'function') {
        window.renderClaudeOptimizedReport(window.currentlyOptimizedJob);
    }
}

// ==========================================
// Playwright Auto-Apply Automation Controller
// ==========================================

let pollingIntervalId = null;
let isPolling = false;

function setupAutoApplyEvents() {
    const btnAbort = document.getElementById("btn-abort-apply");
    if (btnAbort) {
        btnAbort.addEventListener("click", async () => {
            btnAbort.disabled = true;
            btnAbort.textContent = "Aborting...";
            try {
                const response = await fetch(`${API_BASE}/api/auto-apply-abort`, { method: 'POST' });
                const res = await response.json();
                showToast("Application automation aborted");
            } catch (e) {
                console.error("Error aborting automation:", e);
                showToast("Failed to abort automation");
            } finally {
                btnAbort.disabled = false;
                btnAbort.textContent = "Abort Automation";
            }
        });
    }

    const btnCloseModal = document.getElementById("btn-close-apply-modal");
    if (btnCloseModal) {
        btnCloseModal.addEventListener("click", () => {
            hideAutoApplyModal();
        });
    }

    const btnDone = document.getElementById("btn-close-modal-done");
    if (btnDone) {
        btnDone.addEventListener("click", () => {
            hideAutoApplyModal();
        });
    }

    const btnAutoApplyLink = document.getElementById("btn-auto-apply-link");
    if (btnAutoApplyLink) {
        btnAutoApplyLink.addEventListener("click", () => {
            const inputVal = document.getElementById("input-auto-apply-link")?.value.trim();
            if (!inputVal) {
                showToast("Please paste a job application link first.");
                return;
            }
            triggerCustomAutoApply(inputVal);
        });
    }
}

function detectCompanyFromUrl(url) {
    try {
        const u = new URL(url);
        const host = u.hostname.toLowerCase();
        if (host.includes("myworkdayjobs.com")) {
            return host.split(".")[0];
        }
        if (host.includes("lever.co")) {
            const parts = u.pathname.split("/");
            if (parts.length > 1 && parts[1]) {
                return parts[1];
            }
        }
        if (host.includes("greenhouse.io")) {
            const parts = u.pathname.split("/");
            if (parts.length > 2 && parts[1] === "embed") {
                return parts[2];
            }
            if (parts.length > 1 && parts[1]) {
                return parts[1];
            }
        }
        const domainParts = host.replace("www.", "").split(".");
        if (domainParts.length > 0) {
            return domainParts[0];
        }
    } catch (e) {
        console.error("Url parsing failed:", e);
    }
    return "Target Company";
}

async function triggerCustomAutoApply(applyUrl) {
    if (!applyUrl) return;
    
    const logsContainer = document.getElementById("apply-logs-container");
    if (logsContainer) logsContainer.innerHTML = "";
    
    const badge = document.getElementById("apply-status-badge");
    const subtitle = document.getElementById("apply-status-subtitle");
    
    if (badge) {
        badge.className = "status-badge starting";
        badge.textContent = "STARTING";
    }
    if (subtitle) {
        subtitle.textContent = "Initializing custom link automation...";
    }
    
    const actionBanner = document.getElementById("apply-action-banner");
    if (actionBanner) actionBanner.style.display = "none";
    
    const btnDone = document.getElementById("btn-close-modal-done");
    if (btnDone) btnDone.style.display = "none";
    
    const btnAbort = document.getElementById("btn-abort-apply");
    if (btnAbort) btnAbort.style.display = "inline-flex";
    
    showAutoApplyModal();
    
    try {
        const baseResumeName = document.getElementById("select-base-resume")?.value || "Sai_Swaroop_Reddy_Resume_ATS.docx";
        const selectedLlm = document.getElementById("select-llm")?.value || "claude";
        
        const company = detectCompanyFromUrl(applyUrl);
        const title = "Software Engineer";
        
        const skills = (window.candidateProfile && window.candidateProfile.skills) || ["Python", "FastAPI", "Kubernetes", "AWS EKS", "Terraform", "AWS CDK", "Apache Kafka", "Docker", "ArgoCD", "Django", "Flask", "PostgreSQL", "Prometheus", "Grafana", "Splunk"];
        
        showToast("Starting custom link automation...");
        
        const response = await fetch(`${API_BASE}/api/auto-apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobId: "custom_" + Date.now(),
                applyUrl: applyUrl,
                company: company,
                title: title,
                baseResumeName: baseResumeName,
                selectedLlm: selectedLlm,
                matchedSkills: skills,
                missingSkills: []
            })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            // Trigger auto-download in the browser
            if (data.downloadUrl && data.filename) {
                const link = document.createElement("a");
                const rawUrl = data.downloadUrl.startsWith('http') ? data.downloadUrl : `${API_BASE}${data.downloadUrl}`;
                link.href = rawUrl + "?cb=" + new Date().getTime();
                link.download = data.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showToast("Downloading customized resume...");
            }
            // Refresh history
            if (typeof loadOptimizedResumesHistory === 'function') {
                await loadOptimizedResumesHistory();
            }
            if (typeof renderRecruiterHub === 'function') {
                await renderRecruiterHub();
            }
            startPollingStatus();
        } else {
            showToast("Failed to start automation: " + data.message);
            if (badge) {
                badge.className = "status-badge failed";
                badge.textContent = "FAILED";
            }
            if (subtitle) subtitle.textContent = data.message;
        }
    } catch (e) {
        console.error("Error starting custom auto-apply:", e);
        showToast("Error starting custom auto-apply");
        if (badge) {
            badge.className = "status-badge failed";
            badge.textContent = "FAILED";
        }
        if (subtitle) subtitle.textContent = e.message;
    }
}

function showAutoApplyModal() {
    const modal = document.getElementById("auto-apply-modal");
    if (modal) {
        modal.style.display = "flex";
    }
}

function hideAutoApplyModal() {
    const modal = document.getElementById("auto-apply-modal");
    if (modal) {
        modal.style.display = "none";
    }
    stopPollingStatus();
}

async function triggerAutoApply(job) {
    if (!job) return;
    
    const logsContainer = document.getElementById("apply-logs-container");
    if (logsContainer) logsContainer.innerHTML = "";
    
    const badge = document.getElementById("apply-status-badge");
    const subtitle = document.getElementById("apply-status-subtitle");
    
    if (badge) {
        badge.className = "status-badge starting";
        badge.textContent = "STARTING";
    }
    if (subtitle) {
        subtitle.textContent = "Initializing form automation agent...";
    }
    
    const actionBanner = document.getElementById("apply-action-banner");
    if (actionBanner) actionBanner.style.display = "none";
    
    const btnDone = document.getElementById("btn-close-modal-done");
    if (btnDone) btnDone.style.display = "none";
    
    const btnAbort = document.getElementById("btn-abort-apply");
    if (btnAbort) btnAbort.style.display = "inline-flex";
    
    showAutoApplyModal();
    
    try {
        const baseResumeName = document.getElementById("select-base-resume")?.value || "Sai_Swaroop_Reddy_Resume_ATS.docx";
        const selectedLlm = document.getElementById("select-llm")?.value || "claude";
        
        showToast("Starting browser automation...");
        
        const response = await fetch(`${API_BASE}/api/auto-apply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jobId: job.id || job.jobId,
                baseResumeName: baseResumeName,
                selectedLlm: selectedLlm
            })
        });
        
        const data = await response.json();
        if (data.status === 'success') {
            startPollingStatus();
        } else {
            showToast("Failed to start automation: " + data.message);
            if (badge) {
                badge.className = "status-badge failed";
                badge.textContent = "FAILED";
            }
            if (subtitle) subtitle.textContent = data.message;
        }
    } catch (e) {
        console.error("Error starting auto-apply:", e);
        showToast("Error starting auto-apply");
        if (badge) {
            badge.className = "status-badge failed";
            badge.textContent = "FAILED";
        }
        if (subtitle) subtitle.textContent = e.message;
    }
}

async function pollAutoApplyStatus() {
    try {
        const response = await fetch(`${API_BASE}/api/auto-apply-status`);
        if (!response.ok) throw new Error("Status API error");
        const data = await response.json();
        
        updateApplyModalUI(data);
        
        if (data.status === 'completed' || data.status === 'failed' || data.status === 'aborted') {
            stopPollingStatus();
        }
    } catch (error) {
        console.error("Error polling auto-apply status:", error);
    }
}

function startPollingStatus() {
    if (isPolling) return;
    isPolling = true;
    pollAutoApplyStatus();
    pollingIntervalId = setInterval(pollAutoApplyStatus, 1500);
    const pulse = document.getElementById('console-pulse');
    if (pulse) {
        pulse.classList.add('red');
        pulse.style.display = 'inline-block';
    }
}

function stopPollingStatus() {
    if (!isPolling) return;
    isPolling = false;
    if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
        pollingIntervalId = null;
    }
    const pulse = document.getElementById('console-pulse');
    if (pulse) {
        pulse.classList.remove('red');
        pulse.style.display = 'none';
    }
}

function updateApplyModalUI(data) {
    const badge = document.getElementById("apply-status-badge");
    const subtitle = document.getElementById("apply-status-subtitle");
    const stepper = document.getElementById("apply-stepper");
    const logsContainer = document.getElementById("apply-logs-container");
    const actionBanner = document.getElementById("apply-action-banner");
    const actionMessage = document.getElementById("apply-action-message");
    const btnAbort = document.getElementById("btn-abort-apply");
    const btnDone = document.getElementById("btn-close-modal-done");
    
    if (badge) {
        badge.className = "status-badge " + (data.status || 'idle');
        badge.textContent = (data.status || 'idle').replace("_", " ").toUpperCase();
    }
    
    if (subtitle) {
        if (data.status === 'starting') {
            subtitle.textContent = "Launching headed browser automation...";
            if (btnAbort) btnAbort.style.display = "inline-flex";
            if (btnDone) btnDone.style.display = "none";
        } else if (data.status === 'running' || data.status === 'in_progress') {
            subtitle.textContent = "Automation agent is filling the form...";
            if (btnAbort) btnAbort.style.display = "inline-flex";
            if (btnDone) btnDone.style.display = "none";
        } else if (data.status === 'completed') {
            subtitle.textContent = "Automation completed. Please submit the application.";
            if (btnAbort) btnAbort.style.display = "none";
            if (btnDone) btnDone.style.display = "inline-flex";
        } else if (data.status === 'failed') {
            subtitle.textContent = "Automation run encountered an error.";
            if (btnAbort) btnAbort.style.display = "none";
            if (btnDone) btnDone.style.display = "inline-flex";
        } else if (data.status === 'aborted') {
            subtitle.textContent = "Automation run was aborted by user.";
            if (btnAbort) btnAbort.style.display = "none";
            if (btnDone) btnDone.style.display = "inline-flex";
        }
    }
    
    if (stepper && data.steps && data.steps.length > 0) {
        stepper.innerHTML = data.steps.map((step, idx) => {
            let statusClass = step.status || 'pending';
            let icon = '';
            if (statusClass === 'completed') icon = '✓';
            else if (statusClass === 'in_progress') icon = '●';
            else if (statusClass === 'failed') icon = '✗';
            else icon = idx + 1;
            
            return `
                <div class="step-item ${statusClass}">
                    <div class="step-circle">${icon}</div>
                    <div class="step-label">${step.label}</div>
                </div>
            `;
        }).join("");
    }
    
    let needsAction = false;
    let actionMsgText = "";
    
    if (data.logs && data.logs.length > 0) {
        const lastLog = data.logs[data.logs.length - 1];
        if (lastLog.includes("require creating an account") || lastLog.includes("Please log in/register") || lastLog.includes("require signing in")) {
            needsAction = true;
            actionMsgText = "Workday requires creating an account or logging in first. Please register or sign in in the browser window, navigate to the apply screen, and the script will resume.";
        } else if (lastLog.includes("CAPTCHA") || lastLog.includes("captcha")) {
            needsAction = true;
            actionMsgText = "A CAPTCHA check was detected. Please solve the CAPTCHA in the headed browser window to proceed.";
        }
    }
    
    if (actionBanner && actionMessage) {
        if (needsAction) {
            actionMessage.textContent = actionMsgText;
            actionBanner.style.display = "flex";
        } else {
            actionBanner.style.display = "none";
        }
    }
    
    if (logsContainer && data.logs) {
        const previousLogsCount = logsContainer.childElementCount;
        if (data.logs.length !== previousLogsCount) {
            logsContainer.innerHTML = data.logs.map(log => {
                let logClass = "log-info";
                if (log.toLowerCase().includes("fail") || log.toLowerCase().includes("error")) {
                    logClass = "log-error";
                } else if (log.toLowerCase().includes("warning")) {
                    logClass = "log-warn";
                } else if (log.toLowerCase().includes("success") || log.toLowerCase().includes("complete")) {
                    logClass = "log-success";
                }
                return `<div class="log-line ${logClass}">[${new Date().toLocaleTimeString()}] ${log}</div>`;
            }).join("");
            
            logsContainer.scrollTop = logsContainer.scrollHeight;
        }
    }
}
