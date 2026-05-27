import http.server
import socketserver
import subprocess
import json
import threading
import time
import os
import sys
import shutil
from datetime import datetime

def find_uv_executable():
    uv_path = shutil.which("uv")
    if uv_path:
        return uv_path
    user_profile = os.environ.get("USERPROFILE") or os.environ.get("HOME")
    if user_profile:
        fallback = os.path.join(user_profile, ".local", "bin", "uv.exe")
        if os.path.exists(fallback):
            return fallback
    return "uv"

PORT = 8000
SCRAPER_INTERVAL = 3600  # 1 hour
last_sync_time = "Never"
sync_lock = threading.Lock()

apply_process = None
apply_process_lock = threading.Lock()

def load_last_sync_time():
    global last_sync_time
    try:
        if os.path.exists("metadata.json"):
            with open("metadata.json", "r", encoding="utf-8") as f:
                data = json.load(f)
                last_sync_time = data.get("lastUpdated", "Never")
                print(f"Loaded last sync time from metadata: {last_sync_time}")
        else:
            # Fallback to checking jobs.json mod time if it exists
            if os.path.exists("jobs.json"):
                mtime = os.path.getmtime("jobs.json")
                dt = datetime.fromtimestamp(mtime)
                last_sync_time = dt.strftime('%B %d, %Y at %I:%M %p')
                print(f"Loaded last sync time from jobs.json mtime: {last_sync_time}")
    except Exception as e:
        print(f"Error loading last sync time: {e}")

def run_scraper_subprocess():
    global last_sync_time
    with sync_lock:
        print(f"[{datetime.now()}] Initiating job aggregator run...")
        try:
            # Run fetch_jobs.py using the same Python executable
            result = subprocess.run([sys.executable, "fetch_jobs.py"], capture_output=True, text=True, check=True)
            print(result.stdout)
            
            # Reload sync time from metadata.json
            load_last_sync_time()
            print(f"[{datetime.now()}] Job aggregator complete. Current sync time: {last_sync_time}")
            return True
        except Exception as e:
            print(f"[{datetime.now()}] Scraper failed: {e}")
            if hasattr(e, 'stderr') and e.stderr:
                print("Error Details:")
                print(e.stderr)
            return False

def check_and_trigger_daily_pdf():
    try:
        today_str = datetime.now().strftime("%Y-%m-%d")
        last_run = ""
        if os.path.exists("exported_job_ids.json"):
            with open("exported_job_ids.json", "r", encoding="utf-8") as f:
                data = json.load(f)
                last_run_dt = data.get("last_generation_date", "")
                if last_run_dt:
                    last_run = last_run_dt.split(" ")[0]
        
        current_hour = datetime.now().hour
        if today_str != last_run and current_hour >= 23:
            print(f"[{datetime.now()}] End of day reached. Auto-exporting new job postings to PDF...")
            cmd = [find_uv_executable(), "run", "--with", "reportlab", "python", "generate_pdf.py"]
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(result.stdout)
    except Exception as e:
        print(f"Error checking daily PDF: {e}")

def write_apply_status(status_str, step_idx, step_states, logs):
    data = {
        "status": status_str,
        "stepIndex": step_idx,
        "steps": step_states,
        "logs": logs
    }
    with open("auto_apply_status.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def run_optimization_sync(job_id, base_resume_name, company, title, missing_skills, matched_skills, selected_llm):
    if base_resume_name.lower().strip() in ["sai_swaroop_reddy_resume_.docx", "sai_swaroop_reddy_resume__.docx", "sai_swaroop_reddy_resume.docx", "sai_swaroop_reddy_resume_1.docx", "sai_swaroop_reddy_resume_2.docx"]:
        base_resume_name = "Sai_Swaroop_Reddy_Resume_ATS.docx"
        
    clean_company = "".join(c for c in company if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    clean_title = "".join(c for c in title if c.isalnum() or c in (' ', '_', '-')).strip().replace(' ', '_')
    
    llm_suffix_map = {
        "claude": "Claude_4.7_Sonnet",
        "opus": "Claude_4.7_Opus",
        "gemini": "Gemini_3.5_Flash",
        "gemini35": "Gemini_3.5_Pro",
        "gpt4o": "GPT_5.5_Instant",
        "gpt5": "GPT_5.5_Pro",
        "deepseek": "DeepSeek_V4_Pro",
        "llama": "Llama_4_Maverick",
        "gemma": "Gemma_4"
    }
    llm_label = llm_suffix_map.get(selected_llm, "Claude_4.7_Sonnet")
    filename = f"Sai_Swaroop_Reddy_Resume_{clean_company}_{clean_title}_Optimized_via_{llm_label}.docx"
    
    downloads_dir = r"c:\Users\SaiReddy\Downloads"
    current_dir = os.getcwd()
    
    base_resume_path = None
    for directory in [downloads_dir, current_dir]:
        candidate = os.path.join(directory, base_resume_name)
        if os.path.exists(candidate):
            base_resume_path = candidate
            break
            
    if not base_resume_path:
        for directory in [downloads_dir, current_dir]:
            for f in os.listdir(directory):
                if f.lower().strip() in ["sai_swaroop_reddy_resume_.docx", "sai_swaroop_reddy_resume__.docx", "sai_swaroop_reddy_resume.docx", "sai_swaroop_reddy_resume_1.docx", "sai_swaroop_reddy_resume_2.docx"]:
                    continue
                if "resume" in f.lower() and f.endswith(".docx") and not f.startswith("~$"):
                    base_resume_path = os.path.join(directory, f)
                    base_resume_name = f
                    break
            if base_resume_path:
                break
    
    if not base_resume_path or not os.path.exists(base_resume_path):
        raise FileNotFoundError(f"Base resume template {base_resume_name} not found in Downloads or current folder.")
    
    opt_dir = os.path.join(os.getcwd(), "optimized_resumes")
    os.makedirs(opt_dir, exist_ok=True)
    
    output_path_server = os.path.join(opt_dir, filename)
    output_path_downloads = os.path.join(downloads_dir, filename)
    
    keywords_str = ", ".join(missing_skills) if missing_skills else "General Optimization"
    matched_str = ", ".join(matched_skills) if matched_skills else ""
    
    print(f"Running optimizer script for {company} - {title} via {selected_llm}...")
    cmd = [
        find_uv_executable(), "run", "--with", "python-docx", "python", "modify_resume.py",
        base_resume_path, output_path_server, company, title, keywords_str, matched_str, selected_llm
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    print(result.stdout)
    
    try:
        shutil.copy(output_path_server, output_path_downloads)
        print(f"Copied optimized resume to Downloads: {output_path_downloads}")
    except PermissionError:
        timestamp_suffix = datetime.now().strftime('%H%M%S')
        filename_unique = f"Sai_Swaroop_Reddy_Resume_{clean_company}_{clean_title}_Optimized_via_{llm_label}_{timestamp_suffix}.docx"
        output_path_downloads = os.path.join(downloads_dir, filename_unique)
        shutil.copy(output_path_server, output_path_downloads)
        filename = filename_unique
        print(f"Downloads copy locked, saved unique file: {output_path_downloads}")
    
    history = []
    if os.path.exists("optimized_resumes.json"):
        try:
            with open("optimized_resumes.json", "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = []
    
    entry = {
        "jobId": job_id,
        "company": company,
        "title": title,
        "fileName": filename,
        "date": datetime.now().strftime('%b %d, %Y at %I:%M %p'),
        "downloadUrl": f"/optimized_resumes/{filename}",
        "outputPath": output_path_downloads
    }
    
    history = [h for h in history if h.get("jobId") != job_id]
    history.insert(0, entry)
    
    with open("optimized_resumes.json", "w", encoding="utf-8") as f:
        json.dump(history, f, indent=4, ensure_ascii=False)
        
    return output_path_downloads

def wait_for_apply_process(proc):
    global apply_process
    stdout, stderr = proc.communicate()
    print(f"Apply process finished. Return code: {proc.returncode}")
    if stdout:
        print(f"Apply process stdout:\n{stdout}")
    if stderr:
        print(f"Apply process stderr:\n{stderr}")
    with apply_process_lock:
        if apply_process == proc:
            apply_process = None

def scraper_loop():
    # Allow the HTTP server a brief moment to spin up before running first check
    time.sleep(5)
    while True:
        # If it's the very first time and last_sync_time is still Never, run it.
        # Otherwise, run it on schedule.
        print(f"[{datetime.now()}] Background scheduler checking sync status...")
        run_scraper_subprocess()
        check_and_trigger_daily_pdf()
        time.sleep(SCRAPER_INTERVAL)

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_OPTIONS(self):
        # Allow CORS preflight requests
        self.send_response(200, "ok")
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type")
        self.end_headers()

    def end_headers(self):
        # Prevent caching of optimized resumes, dynamic job lists, and other static assets
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def handle_pdf_export(self):
        try:
            force_all = "force=true" in self.path
            cmd = [find_uv_executable(), "run", "--with", "reportlab", "python", "generate_pdf.py"]
            if force_all:
                cmd.append("--force")
                
            result = subprocess.run(cmd, capture_output=True, text=True, check=True)
            print(result.stdout)
            
            generated_path = None
            for line in result.stdout.splitlines():
                if "Generated PDF successfully:" in line:
                    generated_path = line.split("Generated PDF successfully:")[1].strip()
                    break
            
            if generated_path and os.path.exists(generated_path):
                self.send_response(200)
                self.send_header('Content-Type', 'application/pdf')
                self.send_header('Content-Disposition', f'attachment; filename="{os.path.basename(generated_path)}"')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Expose-Headers', 'Content-Disposition')
                self.end_headers()
                with open(generated_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"status": "empty", "message": "All current job postings have already been exported. No new jobs to write."}
                self.wfile.write(json.dumps(response).encode('utf-8'))
        except Exception as e:
            print(f"Error exporting PDF: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"status": "error", "message": str(e)}
            self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_POST(self):
        global last_sync_time, apply_process
        if self.path.startswith('/api/export-pdf'):
            self.handle_pdf_export()
        elif self.path == '/api/sync':
            # Perform immediate sync asynchronously if not already running
            if sync_lock.locked():
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"status": "syncing", "lastUpdated": last_sync_time}
                self.wfile.write(json.dumps(response).encode('utf-8'))
            else:
                # Spawn scraper in a background daemon thread
                threading.Thread(target=run_scraper_subprocess, daemon=True).start()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"status": "syncing", "lastUpdated": last_sync_time}
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/optimize-resume':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                req_data = json.loads(post_data.decode('utf-8'))
                
                job_id = req_data.get("jobId")
                base_resume_name = req_data.get("baseResumeName", "Sai_Swaroop_Reddy_Resume_ATS.docx")
                company = req_data.get("company", "Target Company")
                title = req_data.get("title", "Target Role")
                missing_skills = req_data.get("missingSkills", [])
                matched_skills = req_data.get("matchedSkills", [])
                selected_llm = req_data.get("selectedLlm", "claude")
                
                output_path_downloads = run_optimization_sync(
                    job_id, base_resume_name, company, title, missing_skills, matched_skills, selected_llm
                )
                
                filename = os.path.basename(output_path_downloads)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {
                    "status": "success",
                    "filename": filename,
                    "downloadUrl": f"/optimized_resumes/{filename}",
                    "outputPath": output_path_downloads
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                print(f"Error optimizing resume: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"status": "error", "message": str(e)}
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/auto-apply':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                req_data = json.loads(post_data.decode('utf-8'))
                
                job_id = req_data.get("jobId")
                base_resume_name = req_data.get("baseResumeName", "Sai_Swaroop_Reddy_Resume_ATS.docx")
                selected_llm = req_data.get("selectedLlm", "claude")
                
                apply_url = req_data.get("applyUrl")
                company = req_data.get("company")
                title = req_data.get("title")
                missing_skills = req_data.get("missingSkills", [])
                matched_skills = req_data.get("matchedSkills", [])
                
                job_details = None
                if not apply_url:
                    if os.path.exists("jobs.json"):
                        with open("jobs.json", "r", encoding="utf-8") as f:
                            jobs_list = json.load(f)
                            for job in jobs_list:
                                if job.get("id") == job_id or job.get("jobId") == job_id:
                                    job_details = job
                                    break
                    
                    if not job_details:
                        raise ValueError(f"Job with ID {job_id} not found in jobs.json")
                    
                    apply_url = job_details.get("applyUrl")
                    company = job_details.get("company", "Target Company")
                    title = job_details.get("title", "Target Role")
                    missing_skills = job_details.get("missingSkills", [])
                    matched_skills = job_details.get("matchedSkills", [])
                
                if not apply_url:
                    raise ValueError("Apply URL is required for auto-apply automation")
                
                optimized_resume_path = None
                if os.path.exists("optimized_resumes.json"):
                    try:
                        with open("optimized_resumes.json", "r", encoding="utf-8") as f:
                            history = json.load(f)
                            for entry in history:
                                if entry.get("jobId") == job_id:
                                    p = entry.get("outputPath")
                                    if p and os.path.exists(p):
                                        optimized_resume_path = p
                                        break
                                    fn = entry.get("fileName")
                                    if fn:
                                        p_alt = os.path.join(os.getcwd(), "optimized_resumes", fn)
                                        if os.path.exists(p_alt):
                                            optimized_resume_path = p_alt
                                            break
                    except Exception as e:
                        print(f"Error checking optimized history: {e}")
                
                if not optimized_resume_path:
                    print(f"No optimized resume found for jobId {job_id}. Optimizing first...")
                    optimized_resume_path = run_optimization_sync(
                        job_id, base_resume_name, company, title, missing_skills, matched_skills, selected_llm
                    )
                

                with apply_process_lock:
                    if apply_process and apply_process.poll() is None:
                        try:
                            apply_process.terminate()
                            time.sleep(0.5)
                            if apply_process.poll() is None:
                                apply_process.kill()
                        except Exception as ex:
                            print(f"Error terminating previous apply process: {ex}")
                    
                    init_steps = [
                        {"label": "Initializing Playwright Browser", "status": "pending"},
                        {"label": "Navigating to Portal", "status": "pending"},
                        {"label": "Uploading Tailored Resume", "status": "pending"},
                        {"label": "Autofilling Personal Info", "status": "pending"},
                        {"label": "Autofilling Experience & Education", "status": "pending"},
                        {"label": "Final Review (Manual Submission)", "status": "pending"}
                    ]
                    write_apply_status("starting", 0, init_steps, ["Starting auto-apply process..."])
                    
                    cmd = [
                        find_uv_executable(), "run",
                        "--with", "python-docx",
                        "--with", "playwright",
                        "python", "auto_apply.py",
                        apply_url, optimized_resume_path,
                        company, title
                    ]
                    print(f"Spawning auto_apply.py process: {cmd}")
                    apply_process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                    threading.Thread(target=wait_for_apply_process, args=(apply_process,), daemon=True).start()
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                filename = os.path.basename(optimized_resume_path)
                response = {
                    "status": "success",
                    "message": "Auto-apply process started",
                    "resumePath": optimized_resume_path,
                    "filename": filename,
                    "downloadUrl": f"/optimized_resumes/{filename}"
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
            except Exception as e:
                print(f"Error starting auto-apply: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                response = {"status": "error", "message": str(e)}
                self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path == '/api/auto-apply-abort':

            with apply_process_lock:
                if apply_process and apply_process.poll() is None:
                    try:
                        apply_process.terminate()
                        time.sleep(0.5)
                        if apply_process.poll() is None:
                            apply_process.kill()
                    except Exception as e:
                        print(f"Error terminating apply process: {e}")
                    apply_process = None
                
                if os.path.exists("auto_apply_status.json"):
                    try:
                        with open("auto_apply_status.json", "r", encoding="utf-8") as f:
                            data = json.load(f)
                        data["status"] = "aborted"
                        if "steps" in data and isinstance(data["steps"], list):
                            for step in data["steps"]:
                                if step.get("status") == "in_progress":
                                    step["status"] = "failed"
                        if "logs" in data and isinstance(data["logs"], list):
                            data["logs"].append("Automation process aborted by user.")
                        with open("auto_apply_status.json", "w", encoding="utf-8") as f:
                            json.dump(data, f, indent=2)
                    except Exception as e:
                        print(f"Error updating status to aborted: {e}")
                else:
                    write_apply_status("aborted", 0, [], ["Automation process aborted by user."])
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"status": "success", "message": "Automation aborted successfully"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        global last_sync_time
        if self.path.startswith('/api/export-pdf'):
            self.handle_pdf_export()
        elif self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            status_str = "syncing" if sync_lock.locked() else "online"
            response = {"status": status_str, "lastUpdated": last_sync_time}
            self.wfile.write(json.dumps(response).encode('utf-8'))
        elif self.path.startswith('/api/parse-resume'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            try:
                from urllib.parse import urlparse, parse_qs
                parsed_path = urlparse(self.path)
                params = parse_qs(parsed_path.query)
                resume_name = params.get('resume', ['Sai_Swaroop_Reddy_Resume_ATS.docx'])[0]
                
                downloads_dir = r"c:\Users\SaiReddy\Downloads"
                current_dir = os.getcwd()
                docx_path = None
                for directory in [downloads_dir, current_dir]:
                    test_path = os.path.join(directory, resume_name)
                    if os.path.exists(test_path):
                        docx_path = test_path
                        break
                
                if not docx_path:
                    docx_path = os.path.join(current_dir, "Sai_Swaroop_Reddy_Resume_ATS.docx")
                
                from parse_resume import parse_resume_data
                profile = parse_resume_data(docx_path)
                self.wfile.write(json.dumps(profile).encode('utf-8'))
            except Exception as e:
                self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
        elif self.path == '/api/base-resumes':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            resumes = []
            try:
                downloads_dir = r"c:\Users\SaiReddy\Downloads"
                current_dir = os.getcwd()
                for directory in [downloads_dir, current_dir]:
                    if os.path.exists(directory):
                        for f in os.listdir(directory):
                            if f.lower().strip() in ["sai_swaroop_reddy_resume_.docx", "sai_swaroop_reddy_resume__.docx", "sai_swaroop_reddy_resume.docx", "sai_swaroop_reddy_resume_1.docx", "sai_swaroop_reddy_resume_2.docx"]:
                                continue
                            if "resume" in f.lower() and f.endswith(".docx") and not f.startswith("~$"):
                                if f not in resumes:
                                    resumes.append(f)
                if "Sai_Swaroop_Reddy_Resume_ATS.docx" in resumes:
                    resumes.remove("Sai_Swaroop_Reddy_Resume_ATS.docx")
                resumes.insert(0, "Sai_Swaroop_Reddy_Resume_ATS.docx")
            except Exception as e:
                print(f"Error scanning base resumes: {e}")
                resumes = ["Sai_Swaroop_Reddy_Resume_ATS.docx"]
            self.wfile.write(json.dumps(resumes).encode('utf-8'))
        elif self.path == '/api/optimized-resumes':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            history = []
            try:
                if os.path.exists("optimized_resumes.json"):
                    with open("optimized_resumes.json", "r", encoding="utf-8") as f:
                        history = json.load(f)
            except Exception as e:
                print(f"Error loading optimized resumes history: {e}")
            self.wfile.write(json.dumps(history).encode('utf-8'))
        elif self.path == '/api/auto-apply-status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            data = {"status": "idle", "steps": [], "logs": []}
            if os.path.exists("auto_apply_status.json"):
                try:
                    with open("auto_apply_status.json", "r", encoding="utf-8") as f:
                        data = json.load(f)
                except Exception as e:
                    print(f"Error reading status file: {e}")
            self.wfile.write(json.dumps(data).encode('utf-8'))
        else:
            # Delegate to SimpleHTTPRequestHandler to serve index.html, app.js, jobs.json, etc.
            super().do_GET()

if __name__ == "__main__":
    # 1. Load initial sync timestamp on startup
    load_last_sync_time()
    
    # 2. Start the background scheduler thread (daemon=True so it terminates when the main thread stops)
    scheduler_thread = threading.Thread(target=scraper_loop, daemon=True)
    scheduler_thread.start()
    print("Background job scheduler thread started (Running every 1 hour).")

    # 3. Start HTTP Server in the main thread
    # Re-use port option to avoid 'address already in use' errors on quick restarts
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"======================================================")
        print(f" Sai Swaroop Reddy - Superman: Symbol of Hope Dashboard Server")
        print(f" Running locally 24/7 on: http://localhost:{PORT}")
        print(f"======================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
