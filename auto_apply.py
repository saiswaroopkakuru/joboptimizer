import sys
import os
import re
import json
import time
import urllib.request
import urllib.parse
import ssl
from parse_resume import parse_resume_data

# Use sync playwright
from playwright.sync_api import sync_playwright

STATUS_FILE = "auto_apply_status.json"

def write_status(status_str, step_idx, step_states, logs):
    data = {
        "status": status_str,
        "stepIndex": step_idx,
        "steps": step_states,
        "logs": logs
    }
    with open(STATUS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def get_portal_frame(page, domain_keyword):
    if domain_keyword in page.url.lower():
        return page
    try:
        for f in page.frames:
            if domain_keyword in f.url.lower():
                return f
    except Exception:
        pass
    return page

def main():
    if len(sys.argv) < 3:
        print("Usage: python auto_apply.py <job_url> <resume_path>")
        sys.exit(1)
        
    job_url = sys.argv[1]
    resume_path = sys.argv[2]
    company = sys.argv[3] if len(sys.argv) > 3 else "Target Company"
    title = sys.argv[4] if len(sys.argv) > 4 else "Software Engineer"
    
    logs = []
    def log(msg):
        print(f"[AUTO-APPLY] {msg}")
        logs.append(msg)
        write_status(status_str, step_idx, steps, logs)
        
    steps = [
        {"label": "Initializing Playwright Browser", "status": "pending"},
        {"label": "Navigating to Portal", "status": "pending"},
        {"label": "Uploading Tailored Resume", "status": "pending"},
        {"label": "Autofilling Personal Info", "status": "pending"},
        {"label": "Autofilling Experience & Education", "status": "pending"},
        {"label": "Final Review (Manual Submission)", "status": "pending"}
    ]
    
    status_str = "starting"
    step_idx = 0
    
    steps[0]["status"] = "in_progress"
    log("Initializing browser automation...")
    
    profile = {}
    try:
        profile = parse_resume_data(resume_path)
        log("Successfully parsed tailored resume details.")
    except Exception as e:
        log(f"Failed to parse resume: {e}")
        steps[0]["status"] = "failed"
        write_status("failed", step_idx, steps, logs)
        sys.exit(1)

    with sync_playwright() as p:
        steps[0]["status"] = "completed"
        step_idx = 1
        steps[1]["status"] = "in_progress"
        # We start headed so the user can see it and review/solve captchas
        brave_paths = [
            r"C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe",
            r"C:\Program Files (x86)\BraveSoftware\Brave-Browser\Application\brave.exe",
            os.path.expandvars(r"%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe")
        ]
        executable_path = None
        for path in brave_paths:
            if os.path.exists(path):
                executable_path = path
                break
                
        launch_args = {
            "headless": False,
            "args": ["--start-maximized"]
        }
        if executable_path:
            launch_args["executable_path"] = executable_path
            log(f"Starting Brave headed browser from: {executable_path}")
        else:
            log("Brave browser not found. Starting default Chromium headed browser...")
            
        browser = p.chromium.launch(**launch_args)
        context = browser.new_context(no_viewport=True)
        page = context.new_page()
        
        log(f"Navigating to {job_url}...")
        try:
            page.goto(job_url, timeout=15000)
            page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception as e:
            log(f"Navigation timed out/failed: {e}. Attempting anyway...")
            
        steps[1]["status"] = "completed"
        step_idx = 2
        
        # Allow extra time for any dynamic subframes to load
        page.wait_for_timeout(2000)
        
        url_lower = page.url.lower()
        log(f"Arrived at: {page.url}")
        
        frame_urls = [f.url.lower() for f in page.frames]
        
        # Detect portal type
        is_greenhouse = "greenhouse.io" in url_lower or "gh_jid" in url_lower or any("greenhouse.io" in u for u in frame_urls) or page.locator("#first_name").count() > 0 or page.locator("input[name*='job_application']").count() > 0
        is_lever = "lever.co" in url_lower or any("lever.co" in u for u in frame_urls) or page.locator(".postings-btn").count() > 0 or page.locator(".application-container").count() > 0
        is_workday = "myworkdayjobs.com" in url_lower or page.locator("[data-automation-id='workdayLogo']").count() > 0
        
        if is_greenhouse:
            log("Detected job portal: Greenhouse")
            target = get_portal_frame(page, "greenhouse.io")
            if target != page:
                log("Targeting Greenhouse embedded iframe.")
            fill_greenhouse(target, profile, resume_path, steps, step_idx, log, company, title)
        elif is_lever:
            log("Detected job portal: Lever")
            target = get_portal_frame(page, "lever.co")
            if target != page:
                log("Targeting Lever embedded iframe.")
            fill_lever(target, profile, resume_path, steps, step_idx, log, company, title)
        elif is_workday:
            log("Detected job portal: Workday")
            fill_workday(page, profile, resume_path, steps, step_idx, log, company, title)
        else:
            log("Detected job portal: General/Unknown. Attempting generic field mapping...")
            fill_generic(page, profile, resume_path, steps, step_idx, log, company, title)
            
        # Complete
        steps[-1]["status"] = "completed"
        log("Form auto-fill complete! Ready for your manual review and final submission.")
        write_status("completed", len(steps)-1, steps, logs)
        
        # Keep browser open until user closes it or process is killed
        log("Browser remains open. Close browser window or click Abort in dashboard to stop.")
        while True:
            try:
                # Check if browser is closed
                if not browser.is_connected():
                    break
                time.sleep(1)
            except Exception:
                break

# Question and Answer Mapping for Custom Questions / EEO / Source
QUESTION_MAPPING = {
    "work_auth": {
        "patterns": [
            r"authorized to work", r"legally authorized", r"right to work", 
            r"lawful permanent resident", r"authorization to work", 
            r"eligible to work in the u\.s\."
        ],
        "keywords": ["yes"],
        "field_name": "Work Authorization"
    },
    "sponsorship": {
        "patterns": [
            r"sponsorship", r"require.*visa", r"require.*sponsorship", 
            r"visa.*sponsorship", r"will you now or in the future require"
        ],
        "keywords": ["yes"],
        "field_name": "Visa Sponsorship"
    },
    "gender": {
        "patterns": [r"gender", r"identify as.*gender", r"sex\b"],
        "keywords": ["male", "man"],
        "field_name": "Gender"
    },
    "disability": {
        "patterns": [
            r"disability", r"disabilities", r"voluntary self-identification of disability",
            r"have a physical or mental impairment"
        ],
        "keywords": ["no", "do not have", "don't have", "no, i don't", "no, i do not", "i do not have a disability", "no, i'm not", "no, i am not", "not disabled"],
        "field_name": "Disability Status"
    },
    "lgbtq": {
        "patterns": [
            r"lgbtq", r"lgbt\b", r"identify as lgbt"
        ],
        "keywords": ["no", "i do not identify", "no, i do not"],
        "field_name": "LGBTQ+"
    },
    "veteran": {
        "patterns": [
            r"veteran", r"military status", r"protected veteran", 
            r"active duty", r"armed forces"
        ],
        "keywords": ["no", "not a veteran", "not identify", "i am not a veteran", "not a protected veteran", "declined to state veteran status"],
        "field_name": "Veteran Status"
    },
    "race": {
        "patterns": [
            r"race", r"ethnic", r"demographic", r"how would you identify",
            r"racial category", r"race/ethnicity"
        ],
        "keywords": ["asian", "asian (not hispanic or latino)"],
        "field_name": "Race"
    },
    "hispanic": {
        "patterns": [
            r"hispanic", r"latino", r"spanish origin"
        ],
        "keywords": ["no", "not hispanic", "not hispanic or latino"],
        "field_name": "Hispanic/Latino"
    },
    "sexual_orientation": {
        "patterns": [
            r"sexual orientation", r"describe your sexual orientation", r"sexual.*identity"
        ],
        "keywords": ["heterosexual", "straight"],
        "field_name": "Sexual Orientation"
    },
    "source": {
        "patterns": [
            r"where did you find", r"how did you hear", r"source", 
            r"hear about this", r"find this job", r"referred by", r"referral source"
        ],
        "keywords": ["linkedin", "careers page", "careers website", "company website", "other"],
        "field_name": "Source / Referral"
    },
    "onsite_policy": {
        "patterns": [
            r"open to working in person", r"open to working hybrid", r"open to hybrid",
            r"willing to work in the office", r"onsite", r"in-office", r"work from office",
            r"office.*times a week", r"open to working.*office"
        ],
        "keywords": ["yes", "open", "hybrid", "agree", "i agree"],
        "field_name": "Onsite/Office Policy"
    },
    "restrictive_agreement": {
        "patterns": [
            r"bound by any agreements", r"non-compete", r"restrictive covenant",
            r"agreement with a current or former employer", r"contractual obligations"
        ],
        "keywords": ["no", "not bound", "none", "no contractual", "not subject"],
        "field_name": "Restrictive Agreement"
    }
}

def search_ddg_company_info(company):
    try:
        query = f"{company} company mission values statement overview"
        encoded_query = urllib.parse.quote(query)
        url = f"https://html.duckduckgo.com/html/?q={encoded_query}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        req = urllib.request.Request(url, headers=headers)
        context = ssl._create_unverified_context()
        
        with urllib.request.urlopen(req, context=context, timeout=8) as response:
            html = response.read().decode("utf-8", errors="ignore")
            
        import html as html_parser
        snippets = re.findall(r'<a class="result__snippet[^"]*"[^>]*>(.*?)</a>', html, re.DOTALL)
        combined_text = " ".join([re.sub(r'<[^>]*>', '', s).strip() for s in snippets])
        combined_text = html_parser.unescape(combined_text)
        
        clean_text = re.sub(r'\s+', ' ', combined_text)
        sentences = re.split(r'(?<=[.!?])\s+', clean_text)
        useful_sentences = []
        for s in sentences:
            s_lower = s.lower()
            if any(k in s_lower for k in [company.lower(), "mission", "values", "commit", "focus", "service", "platform", "technology", "develop"]):
                if len(s) > 20 and len(s) < 150 and s not in useful_sentences:
                    useful_sentences.append(s)
            if len(useful_sentences) >= 2:
                break
                
        if useful_sentences:
            return " ".join(useful_sentences)
        elif sentences:
            return " ".join(sentences[:2])
    except Exception as e:
        print(f"[AUTO-APPLY] Error searching company info: {e}")
    return ""

def find_tech_mention(q_text, skills):
    q_lower = q_text.lower()
    for s in skills:
        s_lower = s.lower()
        if len(s_lower) > 2:
            escaped = re.escape(s_lower)
            if re.search(rf"\b{escaped}\b", q_lower):
                return s
    tech_aliases = {
        "k8s": "Kubernetes",
        "aws": "AWS",
        "react": "React",
        "node": "Node.js",
        "django": "Django",
        "fastapi": "FastAPI",
        "python": "Python",
        "docker": "Docker",
        "ci/cd": "CI/CD"
    }
    for alias, name in tech_aliases.items():
        if alias in q_lower:
            return name
    return None

def get_project_details_for_tech(tech, profile):
    tech_lower = tech.lower()
    for exp in profile.get("experience", []):
        for bullet in exp.get("bullets", []):
            if tech_lower in bullet.lower():
                cleaned = bullet.strip().rstrip(".")
                if len(cleaned) > 120:
                    cleaned = cleaned.split(";")[0].split(", and")[0]
                return cleaned
    return None

def generate_question_answer(question_text, company, title, profile):
    if not profile:
        profile = {
            "firstName": "Sai Swaroop",
            "lastName": "Reddy",
            "skills": ["Python", "FastAPI", "Kubernetes", "AWS", "Docker", "Redis", "Kafka", "CI/CD", "PostgreSQL", "SQL"],
            "experience": []
        }
        
    q_lower = question_text.lower().strip()
    
    # 1. Why this company / why join / mission / values
    if any(x in q_lower for x in ["why do you want to", "why are you interested", "why join", "why work at", "why our company", "what interests you"]) or ("why" in q_lower and company.lower() in q_lower):
        about_text = search_ddg_company_info(company)
        answer = f"I am highly interested in joining {company} because of your focus on innovation and industry leadership. "
        if about_text:
            answer += f"Specifically, I am inspired by how you {about_text}. "
        answer += f"With my background in backend systems development, building high-performance APIs, and managing containerized cloud environments, I am eager to contribute to your engineering culture and help scale your core platform services."
        return answer

    # 2. Current or most recent employer / company
    if any(x in q_lower for x in ["current employer", "most recent employer", "current company", "current organization", "company you work for", "employer you work for"]):
        exp = profile.get("experience", [])
        if exp and exp[0].get("company"):
            return exp[0]["company"]
        return "HSBC"

    # 3. Current / most recent title
    if any(x in q_lower for x in ["current title", "most recent title", "current role", "most recent role"]):
        exp = profile.get("experience", [])
        if exp and exp[0].get("title"):
            return exp[0]["title"]
        return "Software Engineer"
        
    # 4. Tech stack / experience with specific tool
    tech_match = find_tech_mention(q_lower, profile.get("skills", []))
    if tech_match:
        if any(x in q_lower for x in ["how many years", "number of years", "years of"]):
            return "3.5"
            
        project_details = get_project_details_for_tech(tech_match, profile)
        if project_details:
            return f"I have over 3 years of professional experience working with {tech_match}. In my previous role, I utilized it to {project_details}."
        else:
            return f"I have over 3 years of hands-on experience working with {tech_match} in my backend development work, applying it to build reliable and scalable service components."

    # 5. Salary expectations
    if any(x in q_lower for x in ["salary", "compensation", "expectations", "compensation requirements"]):
        return "Open and negotiable based on the overall compensation package and growth opportunities."

    # 6. Notice period / Start date
    if any(x in q_lower for x in ["notice period", "start date", "earliest start", "how soon", "availability"]):
        return "Immediate (available to start immediately upon completing the process)."

    # 7. Relocation / Location
    if any(x in q_lower for x in ["relocat", "willing to relocate"]):
        return "Yes, open to relocation and hybrid/remote work arrangements."

    # 8. Description of a challenge / problem solved
    if any(x in q_lower for x in ["describe a time", "solved a", "challenge", "complex technical", "technical problem"]):
        return "At HSBC, I designed and built backend services using Python and FastAPI, handling 1M+ daily transactions. A major technical challenge I solved was optimizing the database query execution and caching layers with Redis, which reduced API latencies by 35% and drastically lowered CPU utilization on our cloud databases."

    # 9. Values / Ethics / Meaningful task
    if any(x in q_lower for x in ["values", "meaningful", "done in line with", "ethics", "integrity"]):
        return "I highly value collaboration, code quality, and user impact. At HSBC, I demonstrated this by leading database query optimizations with Redis that cut latency by 35% and saved significant cloud compute costs, directly improving system reliability for our users."

    # 10. Conditional explanation / follow-ups
    if any(x in q_lower for x in ["if yes", "explain below", "further explanation", "please specify", "if you answered yes"]):
        return "N/A"

    # 11. Relocation / Work eligibility details (for text fields)
    if any(x in q_lower for x in ["citizenship", "visa status"]):
        return "Authorized to work in the United States and will require visa sponsorship in the future."

    # Fallback default professional response for arbitrary open-ended text fields
    return f"I am a backend software engineer with 3.5 years of experience specializing in Python, FastAPI, and Kubernetes. I have a proven track record of building high-performance microservices, optimizing database latency, and setting up automated CI/CD pipelines. I am eager to bring these skills to the Software Engineer role at {company}."

def get_element_question_text(locator):
    try:
        text = locator.evaluate("""el => {
            const parent = el.closest('.field, .custom-question, [class*="question"], [class*="field"], div, td, fieldset, li, tr');
            return parent ? parent.innerText : '';
        }""")
        return text
    except Exception:
        return ""

def get_radio_label_text(radio_locator):
    try:
        text = radio_locator.evaluate("""el => {
            let label = el.closest('label');
            if (label) return label.innerText;
            if (el.id) {
                let lbl = document.querySelector(`label[for="${el.id}"]`);
                if (lbl) return lbl.innerText;
            }
            return el.nextSibling ? el.nextSibling.textContent : (el.parentElement ? el.parentElement.innerText : '');
        }""")
        return text.strip()
    except Exception:
        return ""

def find_matching_element(locators, keywords):
    # First pass: exact or word match
    for idx in range(locators.count()):
        el = locators.nth(idx)
        label = get_radio_label_text(el).lower()
        for kw in keywords:
            if kw == label or (kw in label and len(label) < len(kw) + 10):
                return el
    # Second pass: substring match
    for idx in range(locators.count()):
        el = locators.nth(idx)
        label = get_radio_label_text(el).lower()
        for kw in keywords:
            if kw in label:
                return el
    return None

def select_option_by_keyword(select_locator, keywords, log, field_name):
    try:
        options = select_locator.locator("option")
        for idx in range(options.count()):
            opt = options.nth(idx)
            val = opt.get_attribute("value")
            text = (opt.text_content() or "").lower()
            if any(kw in text for kw in keywords):
                select_locator.select_option(value=val)
                log(f"Selected option '{opt.text_content().strip()}' for {field_name}")
                return True
    except Exception as e:
        log(f"Failed to select option for {field_name}: {e}")
    return False

def select_source_option(select_locator, log):
    try:
        options = select_locator.locator("option")
        # Try to find LinkedIn first
        for idx in range(options.count()):
            opt = options.nth(idx)
            val = opt.get_attribute("value")
            text = (opt.text_content() or "").lower()
            if "linkedin" in text:
                select_locator.select_option(value=val)
                log(f"Selected source option '{opt.text_content().strip()}'")
                return True
        # Try to find Careers Page or Company Website
        for idx in range(options.count()):
            opt = options.nth(idx)
            val = opt.get_attribute("value")
            text = (opt.text_content() or "").lower()
            if any(kw in text for kw in ["careers page", "career page", "careers website", "company website", "company careers"]):
                select_locator.select_option(value=val)
                log(f"Selected source option '{opt.text_content().strip()}'")
                return True
        # Try to find "Other"
        for idx in range(options.count()):
            opt = options.nth(idx)
            val = opt.get_attribute("value")
            text = (opt.text_content() or "").lower()
            if "other" in text:
                select_locator.select_option(value=val)
                log(f"Selected source option '{opt.text_content().strip()}'")
                return True
    except Exception as e:
        log(f"Failed to select source option: {e}")
    return False

def generate_cover_letter(company, title, profile):
    if not profile:
        profile = {
            "firstName": "Sai Swaroop",
            "lastName": "Reddy",
            "skills": ["Python", "FastAPI", "Kubernetes", "AWS", "Docker", "Redis", "Kafka", "CI/CD", "PostgreSQL", "SQL"],
            "experience": []
        }
    skills = profile.get("skills", [])
    req_skills = ", ".join(skills[:3]) if skills else "Python, FastAPI, Kubernetes"
    
    cl_text = f"""Dear Hiring Team,

I am writing to express my strong interest in the {title} position at {company}. With over 3.5 years of experience developing high-performance Python backends and automating cloud platforms, I am eager to apply my technical background to your engineering challenges.

Currently at HSBC, I am part of the backend engineering team supporting a high-performance fraud transaction screening platform. I design and scale asynchronous Python microservices using FastAPI and SQLAlchemy on Amazon EKS. This platform processes over 1,000,000 transactions daily with sub-second response times, requiring robust concurrency patterns and optimized Apache Kafka messaging pipelines.

Your post details a need for expertise in {req_skills}. This matches my day-to-day work:
- Backend: Scaling async services and managing message loops with FastAPI and Celery.
- Platform: Writing modular Infrastructure-as-Code via Terraform/AWS CDK to automate multi-account VPCs and EKS.
- Reliability: Streamlining deployment rollouts via ArgoCD and configuring Prometheus observability dashboards.

I hold a Master's degree in Computer Science from Southern Illinois University and am AWS Certified as a Developer and Solutions Architect. I am highly motivated by {company}'s mission and would welcome the opportunity to discuss how my skill set can support your team.

Thank you for your time and consideration.

Sincerely,

Sai Swaroop Reddy
saiswaroopkakuru@gmail.com
LinkedIn: linkedin.com/in/venkatasaiswaroopkakuru
"""
    return cl_text

def save_cover_letter_file(cl_text, company, log):
    try:
        # Create docx file in downloads directory
        cl_filename = f"Sai_Swaroop_Reddy_Cover_Letter_{company.replace(' ', '_')}.docx"
        cl_path = os.path.join(r"c:\Users\SaiReddy\Downloads", cl_filename)
        
        import docx
        doc = docx.Document()
        
        # Add paragraphs
        for paragraph in cl_text.split('\n\n'):
            doc.add_paragraph(paragraph)
            
        doc.save(cl_path)
        log(f"Generated tailored cover letter file at: {cl_path}")
        return cl_path
    except Exception as e:
        log(f"Failed to generate cover letter docx: {e}")
        try:
            cl_filename = f"Sai_Swaroop_Reddy_Cover_Letter_{company.replace(' ', '_')}.txt"
            cl_path = os.path.join(r"c:\Users\SaiReddy\Downloads", cl_filename)
            with open(cl_path, "w", encoding="utf-8") as f:
                f.write(cl_text)
            log(f"Generated fallback cover letter text file at: {cl_path}")
            return cl_path
        except Exception as ex:
            log(f"Failed to generate fallback cover letter txt file: {ex}")
    return None

def handle_cover_letter(page, company, title, profile, log):
    try:
        # 1. Fill Text Cover Letter fields
        inputs = page.locator("input[type='text'], textarea")
        cl_text = None
        for idx in range(inputs.count()):
            inp = inputs.nth(idx)
            if inp.is_editable():
                question_text = get_element_question_text(inp)
                if not question_text:
                    continue
                q_lower = question_text.lower()
                if any(x in q_lower for x in ["cover letter", "coverletter", "letter of interest"]):
                    # Check if already filled
                    curr_val = inp.input_value() or ""
                    if curr_val.strip() == "":
                        if not cl_text:
                            cl_text = generate_cover_letter(company, title, profile)
                        inp.fill(cl_text)
                        log("Filled cover letter text area/input with dynamically generated cover letter.")
                        
        # 2. Upload Cover Letter file fields
        file_inputs = page.locator("input[type='file']")
        cl_path = None
        for idx in range(file_inputs.count()):
            inp = file_inputs.nth(idx)
            name = (inp.get_attribute("name") or "").lower()
            inp_id = (inp.get_attribute("id") or "").lower()
            question_text = get_element_question_text(inp).lower()
            
            if "cover" in name or "cover" in inp_id or "cover" in question_text:
                if not cl_text:
                    cl_text = generate_cover_letter(company, title, profile)
                if not cl_path:
                    cl_path = save_cover_letter_file(cl_text, company, log)
                if cl_path and os.path.exists(cl_path):
                    inp.set_input_files(cl_path)
                    log(f"Uploaded cover letter file to input: {name or inp_id or 'custom cover letter input'}")
    except Exception as e:
        log(f"Error handling cover letter autofill: {e}")

def autofill_page_questions(page, log, company="Target Company", title="Software Engineer", profile=None):
    # Try filling/uploading cover letter first
    handle_cover_letter(page, company, title, profile, log)

    # 1. Group radios by name and process
    try:
        radio_names = []
        radios = page.locator("input[type='radio']")
        for idx in range(radios.count()):
            r_name = radios.nth(idx).get_attribute("name")
            if r_name and r_name not in radio_names:
                radio_names.append(r_name)
                
        for r_name in radio_names:
            group_radios = page.locator(f"input[type='radio'][name='{r_name}']")
            if group_radios.count() == 0:
                continue
            first_radio = group_radios.first
            question_text = get_element_question_text(first_radio).lower()
            
            # Check which category matches
            for key, val in QUESTION_MAPPING.items():
                if any(re.search(pat, question_text) for pat in val["patterns"]):
                    # Check if any radio in this group is already checked
                    checked_any = False
                    for idx in range(group_radios.count()):
                        if group_radios.nth(idx).is_checked():
                            checked_any = True
                            break
                    if checked_any:
                        break
                        
                    target_radio = find_matching_element(group_radios, val["keywords"])
                    if target_radio:
                        target_radio.click()
                        log(f"Selected radio button '{get_radio_label_text(target_radio)}' for {val['field_name']}")
                    break
    except Exception as e:
        pass

    # 2. Process select dropdowns
    try:
        selects = page.locator("select")
        for idx in range(selects.count()):
            sel = selects.nth(idx)
            # Skip if already selected a valid non-default value
            try:
                curr_val = sel.input_value() or ""
                selected_text = sel.evaluate("el => el.options[el.selectedIndex] ? el.options[el.selectedIndex].text : ''").lower()
                if curr_val != "" and not any(x in selected_text for x in ["select", "choose", "--"]):
                    continue
            except Exception:
                pass
                
            question_text = get_element_question_text(sel).lower()
            
            for key, val in QUESTION_MAPPING.items():
                if any(re.search(pat, question_text) for pat in val["patterns"]):
                    if key == "source":
                        select_source_option(sel, log)
                    else:
                        select_option_by_keyword(sel, val["keywords"], log, val["field_name"])
                    break
    except Exception as e:
        pass
        
    # 3. Process checkboxes
    try:
        checkbox_names = []
        checkboxes = page.locator("input[type='checkbox']")
        for idx in range(checkboxes.count()):
            c_name = checkboxes.nth(idx).get_attribute("name")
            if c_name and c_name not in checkbox_names:
                checkbox_names.append(c_name)
                
        for c_name in checkbox_names:
            group_checkboxes = page.locator(f"input[type='checkbox'][name='{c_name}']")
            if group_checkboxes.count() == 0:
                continue
            first_cb = group_checkboxes.first
            question_text = get_element_question_text(first_cb).lower()
            
            for key, val in QUESTION_MAPPING.items():
                if any(re.search(pat, question_text) for pat in val["patterns"]):
                    target_cb = find_matching_element(group_checkboxes, val["keywords"])
                    if target_cb and not target_cb.is_checked():
                        target_cb.click()
                        log(f"Checked checkbox '{get_radio_label_text(target_cb)}' for {val['field_name']}")
                    break
    except Exception as e:
        pass

    # 4. Process text inputs/textareas
    try:
        inputs = page.locator("input[type='text'], textarea")
        for idx in range(inputs.count()):
            inp = inputs.nth(idx)
            # Skip comboboxes since they are type='text' but have role='combobox'
            role = inp.get_attribute("role") or ""
            if "combobox" in role.lower():
                continue
            if inp.is_editable() and (not inp.input_value() or inp.input_value().strip() == ""):
                question_text = get_element_question_text(inp)
                if not question_text:
                    continue
                q_lower = question_text.lower()
                
                # Check if it is a source question
                if any(re.search(pat, q_lower) for pat in QUESTION_MAPPING["source"]["patterns"]):
                    inp.fill("LinkedIn")
                    log("Filled source text input with 'LinkedIn'.")
                # Direct check for LinkedIn field
                elif "linkedin" in q_lower:
                    val = profile.get("linkedin", "")
                    if val:
                        inp.fill(val)
                        log(f"Filled LinkedIn field with: {val}")
                # Direct check for Website / Portfolio / Github
                elif any(x in q_lower for x in ["website", "portfolio", "github", "personal site", "blog", "git link"]):
                    val = profile.get("github", "")
                    if val:
                        inp.fill(val)
                        log(f"Filled website/portfolio field with: {val}")
                else:
                    # It's a custom question! Generate an answer using resume + web
                    answer = generate_question_answer(question_text, company, title, profile)
                    if answer:
                        tag_name = inp.evaluate("el => el.tagName.toLowerCase()")
                        if tag_name == "input" and len(answer) > 120:
                            # Split by period/question/exclamation followed by space and uppercase letter
                            parts = re.split(r'(?<=[.!?])\s+(?=[A-Z])', answer)
                            if parts:
                                first = parts[0].strip()
                                if len(first) <= 120:
                                    answer = first
                                else:
                                    answer = answer[:117] + "..."
                            else:
                                answer = answer[:117] + "..."
                        inp.fill(answer)
                        log(f"Filled question '{question_text[:50].strip()}...' with generated answer.")
    except Exception as e:
        log(f"Failed to fill text input custom question: {e}")

    # 5. Process custom comboboxes (React-Select on Greenhouse / Lever)
    try:
        labels = page.locator("label, [id$='-label']")
        processed_input_ids = []
        for idx in range(labels.count()):
            lbl = labels.nth(idx)
            lbl_text = (lbl.text_content() or "").strip()
            if not lbl_text:
                continue
                
            # Skip labels representing consent or agreement
            lbl_text_lower = lbl_text.lower()
            if any(w in lbl_text_lower for w in ["consent", "agree", "acknowledge", "certify", "understand", "terms"]):
                continue
                
            matched_key = None
            matched_data = None
            for key, val in QUESTION_MAPPING.items():
                if any(re.search(pat, lbl_text_lower) for pat in val["patterns"]):
                    matched_key = key
                    matched_data = val
                    break
                    
            if not matched_key:
                continue
                
            input_id = lbl.get_attribute("for")
            if not input_id:
                lbl_id = lbl.get_attribute("id") or ""
                if lbl_id.endswith("-label"):
                    input_id = lbl_id[:-6]
                    
            if not input_id:
                continue
                
            if input_id in processed_input_ids:
                continue
            processed_input_ids.append(input_id)
            
            input_loc = page.locator(f"[id='{input_id}']").first
            if input_loc.count() == 0:
                continue
                
            role = input_loc.get_attribute("role") or ""
            is_combobox = "combobox" in role.lower() or "select" in (input_loc.get_attribute("class") or "").lower()
            
            if is_combobox:
                control = page.locator(f"div:has(> div > input[id='{input_id}']), .select__control:has(input[id='{input_id}'])").first
                if control.count() > 0:
                    # Determine search values to try
                    if matched_key == "source":
                        target_vals = ["linkedin", "careers page", "careers website", "company website", "other"]
                    else:
                        target_vals = matched_data["keywords"]
                        
                    for target_val in target_vals:
                        # Click to focus
                        control.click()
                        page.wait_for_timeout(300)
                        
                        # Type matching option sequentially to trigger React state updates
                        input_loc.press_sequentially(target_val, delay=100)
                        page.wait_for_timeout(500)
                        page.keyboard.press("Enter")
                        page.wait_for_timeout(500)
                        
                        # Verify if selection took place (control inner text no longer has "Select...")
                        curr_text = control.text_content() or ""
                        if not any(x in curr_text.lower() for x in ["select", "choose", "--"]):
                            log(f"Filled combobox for {matched_data['field_name']} with '{target_val}'")
                            break
                        else:
                            page.keyboard.press("Escape")
                            page.wait_for_timeout(300)
    except Exception as e:
        pass

def fill_workday_custom_dropdown(page, automation_id_keywords, option_keywords, log):
    try:
        trigger = None
        for kw in automation_id_keywords:
            loc = page.locator(f"[data-automation-id*='{kw}'], [id*='{kw}'], button:has-text('{kw}')").first
            if loc.count() > 0 and loc.is_visible():
                trigger = loc
                break
        
        if not trigger:
            return False
            
        current_val = trigger.text_content() or ""
        if any(okw in current_val.lower() for okw in option_keywords) and "select" not in current_val.lower():
            return True
            
        trigger.click()
        page.wait_for_timeout(500)
        
        options = page.locator("[role='option'], li[role='option'], [data-automation-id='dropdown-option']")
        matched_option = None
        for idx in range(options.count()):
            opt = options.nth(idx)
            text = (opt.text_content() or "").lower()
            if any(okw in text for okw in option_keywords):
                matched_option = opt
                break
                
        if matched_option:
            matched_text = matched_option.text_content().strip()
            matched_option.click()
            log(f"Workday: Selected option '{matched_text}'")
            page.wait_for_timeout(500)
            return True
        else:
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
    except Exception as e:
        pass
    return False

def fill_workday_eeo(page, log):
    fill_workday_custom_dropdown(page, ["gender", "genderIdentity"], ["male", "man"], log)
    fill_workday_custom_dropdown(page, ["hispanicOrLatino", "hispanic", "latino"], ["no", "not hispanic"], log)
    fill_workday_custom_dropdown(page, ["race", "racialIdentity", "raceEthnicity"], ["asian"], log)
    fill_workday_custom_dropdown(page, ["veteranStatus", "militaryStatus", "veteran"], ["no", "not a veteran", "not identify", "declined"], log)
    fill_workday_custom_dropdown(page, ["disabilityStatus", "disability", "disabilities"], ["no", "do not have", "don't have", "no, i don't", "no, i do not", "no, i'm not", "no, i am not", "not disabled"], log)
    fill_workday_custom_dropdown(page, ["sexualOrientation", "sexual"], ["heterosexual", "straight"], log)
    
    # Try LinkedIn for source
    if not fill_workday_custom_dropdown(page, ["source", "howDidYouHear"], ["linkedin"], log):
        # Try careers page
        fill_workday_custom_dropdown(page, ["source", "howDidYouHear"], ["career", "website", "company", "other"], log)

def fill_greenhouse(page, profile, resume_path, steps, step_idx, log, company="Target Company", title="Software Engineer"):
    steps[step_idx]["status"] = "in_progress"
    log("Uploading tailored resume to Greenhouse...")
    
    # Locate file input
    file_input = page.locator("input[type='file'][name*='resume'], input[type='file']").first
    if file_input.count() > 0:
        file_input.set_input_files(resume_path)
        log("Resume uploaded successfully. Waiting 3 seconds for parser...")
        time.sleep(3)
    else:
        log("Warning: Could not locate Greenhouse file input for resume.")
        
    steps[step_idx]["status"] = "completed"
    step_idx += 1
    steps[step_idx]["status"] = "in_progress"
    log("Filling personal details...")
    
    # Personal Info Mapping
    # First name
    fn = page.locator("input[name='job_application[first_name]'], #first_name").first
    if fn.count() > 0 and fn.is_editable(): fn.fill(profile["firstName"])
    
    # Last name
    ln = page.locator("input[name='job_application[last_name]'], #last_name").first
    if ln.count() > 0 and ln.is_editable(): ln.fill(profile["lastName"])
    
    # Email
    email = page.locator("input[name='job_application[email]'], #email").first
    if email.count() > 0 and email.is_editable(): email.fill(profile["email"])
    
    # Phone
    phone = page.locator("input[name='job_application[phone]'], #phone").first
    if phone.count() > 0 and phone.is_editable(): phone.fill(profile["phone"])
    
    # LinkedIn Link
    li = page.locator("input[name*='linkedin'], input[name*='linkedin_profile'], #linkedin_profile").first
    if li.count() > 0 and li.is_editable(): li.fill(profile["linkedin"])
        
    # GitHub Link
    gh = page.locator("input[name*='github'], input[name*='github_profile'], #github_profile").first
    if gh.count() > 0 and gh.is_editable(): gh.fill(profile["github"])
    
    log("Personal details populated.")
    steps[step_idx]["status"] = "completed"
    step_idx += 1
    steps[step_idx]["status"] = "in_progress"
    log("Searching for additional application questions...")
    
    # Autofill other questions (sponsorship, EEO, source etc.)
    autofill_page_questions(page, log, company, title, profile)
                    
    steps[step_idx]["status"] = "completed"
    step_idx += 1
    steps[step_idx]["status"] = "in_progress"
    log("Form is filled. Directing to manual review section.")

def fill_lever(page, profile, resume_path, steps, step_idx, log, company="Target Company", title="Software Engineer"):
    steps[step_idx]["status"] = "in_progress"
    
    # Check if there is an "Apply for Job" button to open the form
    apply_btn = page.locator(".postings-btn, .postings-btn-wrapper a").first
    if apply_btn.count() > 0 and "apply" in apply_btn.text_content().lower():
        log("Opening Lever application form...")
        apply_btn.click()
        page.wait_for_load_state("networkidle")
        time.sleep(2)
        
    log("Uploading resume to Lever...")
    file_input = page.locator("input[type='file'][name='resume'], input[type='file']").first
    if file_input.count() > 0:
        file_input.set_input_files(resume_path)
        log("Resume uploaded. Waiting 3 seconds for parser...")
        time.sleep(3)
        
    steps[step_idx]["status"] = "completed"
    step_idx += 1
    steps[step_idx]["status"] = "in_progress"
    log("Filling Lever form details...")
    
    # Full Name
    name = page.locator("input[name='name']").first
    if name.count() > 0 and name.is_editable():
        name.fill(f"{profile['firstName']} {profile['lastName']}")
        
    # Email
    email = page.locator("input[name='email']").first
    if email.count() > 0 and email.is_editable():
        email.fill(profile["email"])
        
    # Phone
    phone = page.locator("input[name='phone']").first
    if phone.count() > 0 and phone.is_editable():
        phone.fill(profile["phone"])
        
    # Company
    company = page.locator("input[name='org']").first
    if company.count() > 0 and company.is_editable():
        company.fill("HSBC")
        
    # LinkedIn
    li = page.locator("input[name*='linkedin']").first
    if li.count() > 0 and li.is_editable():
        li.fill(profile["linkedin"])
        
    # GitHub
    gh = page.locator("input[name*='github']").first
    if gh.count() > 0 and gh.is_editable():
        gh.fill(profile["github"])
        
    log("Lever details populated.")
    
    # Autofill other questions (sponsorship, EEO, source etc.)
    autofill_page_questions(page, log, company, title, profile)
    
    steps[step_idx]["status"] = "completed"
    step_idx += 1
    steps[step_idx]["status"] = "in_progress"

def fill_workday(page, profile, resume_path, steps, step_idx, log, company="Target Company", title="Software Engineer"):
    log("Detected Workday Career Site.")
    log("Note: Workday applications require creating an account or signing in first.")
    log("Please log in/register in the browser window, navigate to the 'Apply' screen, and the script will automatically monitor and fill pages.")
    
    steps[step_idx]["status"] = "completed"
    step_idx += 1
    steps[step_idx]["status"] = "in_progress"
    
    # Workday loop to fill pages as the user clicks "Next"
    # We will poll the page to detect standard Workday fields
    while True:
        try:
            # Check if page is closed
            if page.is_closed():
                break
                
            # Quick Apply / Resume Upload page
            resume_dropzone = page.locator("[data-automation-id='file-upload-dropzone'], input[type='file']").first
            if resume_dropzone.count() > 0 and resume_dropzone.is_visible():
                log("Autofilling Workday Resume Upload area...")
                resume_dropzone.set_input_files(resume_path)
                log("Uploaded resume to Workday. Please review parsing outcomes.")
                time.sleep(4)
                
            # personal information form
            fn_input = page.locator("[data-automation-id='legalNameSection_firstName'] input, #input-1, input[id*='firstName']").first
            if fn_input.count() > 0 and fn_input.is_visible() and fn_input.input_value() == "":
                log("Autofilling personal details...")
                fn_input.fill(profile["firstName"])
                
                ln_input = page.locator("[data-automation-id='legalNameSection_lastName'] input, #input-2, input[id*='lastName']").first
                if ln_input.count() > 0: ln_input.fill(profile["lastName"])
                
                email_input = page.locator("[data-automation-id='contactInformationSection_emailAddress'] input, input[id*='email']").first
                if email_input.count() > 0: email_input.fill(profile["email"])
                
                phone_input = page.locator("[data-automation-id='contactInformationSection_phoneNumber'] input, input[id*='phone']").first
                if phone_input.count() > 0: phone_input.fill(profile["phone"])
                
                log("Personal details populated on Workday form.")
                
            # Work experience filling (My Experience section)
            exp_header = page.locator("h2:has-text('Work Experience'), h2:has-text('Experience')").first
            if exp_header.count() > 0 and exp_header.is_visible():
                # Check if we should populate work history
                job_title = page.locator("[data-automation-id='jobTitle'] input, input[id*='jobTitle']").first
                if job_title.count() > 0 and job_title.is_visible() and job_title.input_value() == "":
                    log("Autofilling HSBC Work Experience details...")
                    job_title.fill("Software Engineer")
                    company_input = page.locator("[data-automation-id='company'] input, input[id*='company']").first
                    if company_input.count() > 0: company_input.fill("HSBC")
                    
                    # Fill description
                    desc = page.locator("[data-automation-id='description'] textarea, textarea[id*='description']").first
                    if desc.count() > 0 and profile["experience"]:
                        bullets_text = "\n".join(profile["experience"][0]["bullets"])
                        desc.fill(bullets_text)
                    log("Populated work history.")
                    
            # Education filling
            edu_header = page.locator("h2:has-text('Education')").first
            if edu_header.count() > 0 and edu_header.is_visible():
                school_input = page.locator("[data-automation-id='school'] input, input[id*='school']").first
                if school_input.count() > 0 and school_input.is_visible() and school_input.input_value() == "":
                    log("Autofilling Southern Illinois University Education details...")
                    school_input.fill(profile["education"][0]["school"])
                    degree_input = page.locator("[data-automation-id='degree'] input, input[id*='degree']").first
                    if degree_input.count() > 0: degree_input.fill(profile["education"][0]["degree"])
                    field_input = page.locator("[data-automation-id='fieldOfStudy'] input, input[id*='fieldOfStudy']").first
                    if field_input.count() > 0: field_input.fill(profile["education"][0]["fieldOfStudy"])
                    log("Populated education.")
                    
            # Workday EEO custom dropdowns
            fill_workday_eeo(page, log)
            
            # General questionnaire fields (e.g. visa sponsorship, yes/no radios)
            autofill_page_questions(page, log, company, title, profile)
            
            time.sleep(2.5)
        except Exception as e:
            # Silence intermittent page check errors
            time.sleep(2.5)

def fill_generic(page, profile, resume_path, steps, step_idx, log, company="Target Company", title="Software Engineer"):
    steps[step_idx]["status"] = "in_progress"
    
    # Generic file input locator
    file_input = page.locator("input[type='file']").first
    if file_input.count() > 0:
        log("Uploading resume to file input...")
        file_input.set_input_files(resume_path)
        time.sleep(2)
        
    steps[step_idx]["status"] = "completed"
    step_idx += 1
    steps[step_idx]["status"] = "in_progress"
    
    # Generic text field scanning based on labels
    log("Scanning inputs for personal metadata...")
    inputs = page.locator("input[type='text'], input[type='email'], input[type='tel']")
    for idx in range(inputs.count()):
        inp = inputs.nth(idx)
        name_attr = (inp.get_attribute("name") or "").lower()
        id_attr = (inp.get_attribute("id") or "").lower()
        placeholder = (inp.get_attribute("placeholder") or "").lower()
        
        # Match First Name
        if any(x in name_attr or x in id_attr or x in placeholder for x in ["first_name", "firstname", "first name", "givenname"]):
            if inp.input_value() == "": inp.fill(profile["firstName"])
        # Match Last Name
        elif any(x in name_attr or x in id_attr or x in placeholder for x in ["last_name", "lastname", "last name", "surname"]):
            if inp.input_value() == "": inp.fill(profile["lastName"])
        # Match Full Name
        elif any(x in name_attr or x in id_attr or x in placeholder for x in ["fullname", "full_name", "full name", "candidate_name"]):
            if inp.input_value() == "": inp.fill(f"{profile['firstName']} {profile['lastName']}")
        # Match Email
        elif any(x in name_attr or x in id_attr or x in placeholder for x in ["email", "e-mail"]):
            if inp.input_value() == "": inp.fill(profile["email"])
        # Match Phone
        elif any(x in name_attr or x in id_attr or x in placeholder for x in ["phone", "tel", "mobile"]):
            if inp.input_value() == "": inp.fill(profile["phone"])
        # Match LinkedIn
        elif "linkedin" in name_attr or "linkedin" in id_attr or "linkedin" in placeholder:
            if inp.input_value() == "": inp.fill(profile["linkedin"])
        # Match GitHub
        elif "github" in name_attr or "github" in id_attr or "github" in placeholder:
            if inp.input_value() == "": inp.fill(profile["github"])

    log("Generic metadata populate complete.")
    
    # Autofill other questions (sponsorship, EEO, source etc.)
    autofill_page_questions(page, log, company, title, profile)
    
    steps[step_idx]["status"] = "completed"
    step_idx += 1
    steps[step_idx]["status"] = "in_progress"

if __name__ == "__main__":
    main()

