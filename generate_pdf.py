import sys
import os
import json
import re
import html
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

# Import ReportLab elements
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
except ImportError:
    print("ReportLab library not installed. Please run via 'uv run --with reportlab'.")
    sys.exit(1)

def clean_desc_text(raw_desc):
    if not raw_desc:
        return ""
    # Strip HTML tags
    cleanr = re.compile('<[^<]+?>')
    cleantext = re.sub(cleanr, '', raw_desc)
    # Convert common HTML entities
    cleantext = cleantext.replace('&amp;', '&').replace('&quot;', '"').replace('&lt;', '<').replace('&gt;', '>')
    cleantext = cleantext.replace('&nbsp;', ' ').replace('&#39;', "'").replace('&rsquo;', "'").replace('&lsquo;', "'")
    cleantext = cleantext.replace('\r', '').replace('\n', ' ')
    # Escape special XML chars for ReportLab
    cleantext = html.escape(cleantext)
    return re.sub(r'\s+', ' ', cleantext).strip()

EXPORT_REGISTRY_FILE = "exported_job_ids.json"
JOBS_FILE = "jobs.json"
DOWNLOADS_DIR = r"c:\Users\SaiReddy\Downloads"

def load_exported_ids():
    if os.path.exists(EXPORT_REGISTRY_FILE):
        try:
            with open(EXPORT_REGISTRY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return set(data.get("exported_ids", []))
        except Exception as e:
            print(f"Error loading export registry: {e}")
            return set()
    return set()

def save_exported_ids(exported_set):
    try:
        data = {
            "exported_ids": list(exported_set),
            "last_generation_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        with open(EXPORT_REGISTRY_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Saved {len(exported_set)} exported job IDs to registry.")
    except Exception as e:
        print(f"Error saving export registry: {e}")

def draw_line(color=colors.HexColor('#E2E8F0')):
    t = Table([['']], colWidths=[7.0*inch])
    t.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,-1), 0.5, color),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    return t

def generate_pdf(force_all=False):
    # 1. Load jobs
    if not os.path.exists(JOBS_FILE):
        print(f"Error: {JOBS_FILE} does not exist.")
        return None, 0
        
    try:
        with open(JOBS_FILE, "r", encoding="utf-8") as f:
            jobs = json.load(f)
    except Exception as e:
        print(f"Error reading jobs.json: {e}")
        return None, 0

    # 2. Filter & Deduplicate
    exported_ids = load_exported_ids()
    unique_jobs = []
    seen_ids = set()

    for job in jobs:
        job_id = job.get("id")
        if not job_id:
            continue
            
        # Skip duplicate job IDs within the current JSON file
        if job_id in seen_ids:
            continue
        seen_ids.add(job_id)
        
        # Skip already exported job IDs (unless force_all is True)
        if not force_all and job_id in exported_ids:
            continue
            
        unique_jobs.append(job)

    if not unique_jobs:
        print("No new job postings to export.")
        return None, 0

    # 3. Create PDF path
    today_str = datetime.now().strftime("%Y-%m-%d")
    time_str = datetime.now().strftime("%H%M%S")
    pdf_filename = f"daily_job_postings_{today_str}_{time_str}.pdf" if not force_all else f"all_job_postings_{today_str}.pdf"
    
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    pdf_path = os.path.join(DOWNLOADS_DIR, pdf_filename)

    # 4. Setup styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#ef4444'), # Red
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=colors.HexColor('#475569'), # Slate-600
        spaceAfter=12
    )
    meta_style = ParagraphStyle(
        'DocMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#64748B'), # Slate-500
        spaceAfter=15
    )
    job_title_style = ParagraphStyle(
        'JobTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11.5,
        leading=14,
        textColor=colors.HexColor('#0f172a'), # Slate-900
        spaceAfter=4
    )
    job_meta_style = ParagraphStyle(
        'JobMetaStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#475569'),
        spaceAfter=3
    )
    desc_style = ParagraphStyle(
        'DescStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#334155'), # Slate-700
        spaceAfter=6
    )

    # 5. Build PDF Document
    # Page template with 0.75-inch margins (7.0 inch width content area on 8.5 inch page)
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=0.75*inch,
        rightMargin=0.75*inch,
        topMargin=0.75*inch,
        bottomMargin=0.75*inch
    )

    story = []

    # Title Banner
    story.append(Paragraph("SUPERMAN: SYMBOL OF HOPE", title_style))
    report_title = "DAILY AUTOMATED JOB POSTINGS REPORT" if not force_all else "ALL COMPLIANT JOB OPPORTUNITIES EXPORT"
    story.append(Paragraph(report_title, subtitle_style))
    
    meta_text = (
        f"<b>Report Date:</b> {datetime.now().strftime('%B %d, %Y at %I:%M %p')} | "
        f"<b>Target Experience:</b> 3-4 Years Strictly | "
        f"<b>New Opportunities Extracted:</b> {len(unique_jobs)}"
    )
    story.append(Paragraph(meta_text, meta_style))
    story.append(draw_line(colors.HexColor('#ef4444'))) # Red primary line
    story.append(Spacer(1, 15))

    # Job Listings Loop
    for idx, job in enumerate(unique_jobs):
        job_flowables = []
        
        # Header Row Table
        match_val = job.get('matchScore', 0)
        match_color = '#10B981' if match_val >= 85 else ('#F59E0B' if match_val >= 70 else '#EF4444')
        
        esc_title = html.escape(job.get('title') or '')
        esc_company = html.escape(job.get('company') or '')
        esc_id = html.escape(job.get('id') or '')
        
        header_table_data = [
            [
                Paragraph(f"<b>{idx+1}. {esc_title}</b> at <font color='#ef4444'><b>{esc_company}</b></font>", job_title_style),
                Paragraph(f"<font color='{match_color}'><b>{match_val}% Match</b></font> (ID: {esc_id})", ParagraphStyle('RightMeta', parent=job_meta_style, alignment=2))
            ]
        ]
        
        header_table = Table(header_table_data, colWidths=[4.7*inch, 2.3*inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 2),
        ]))
        job_flowables.append(header_table)
        
        # Details row
        esc_loc = html.escape(job.get('location') or 'United States')
        esc_spons = html.escape(job.get('visaSponsorship') or 'No')
        pub_date_raw = job.get('pubDate', '')
        esc_pub_date = 'N/A'
        if pub_date_raw:
            try:
                if pub_date_raw.endswith("00:00:00") or len(pub_date_raw) <= 10:
                    dt_obj = datetime.strptime(pub_date_raw[:10], "%Y-%m-%d")
                    esc_pub_date = dt_obj.strftime("%b %d, %Y")
                else:
                    iso_str = pub_date_raw.replace(" ", "T")
                    dt_obj = datetime.fromisoformat(iso_str)
                    esc_pub_date = dt_obj.strftime("%b %d, %Y at %I:%M %p")
            except Exception:
                esc_pub_date = html.escape(pub_date_raw)
                
        details_parts = [
            f"<b>Location:</b> {esc_loc}",
            f"<b>Experience:</b> {job.get('experienceRequired', '3-4')} Years Required",
            f"<b>Sponsorship:</b> {esc_spons}",
            f"<b>Posted:</b> {esc_pub_date}"
        ]
        details_para = Paragraph(" | ".join(details_parts), job_meta_style)
        job_flowables.append(details_para)
        
        # Recruiter contact row if present
        rec_name = job.get('recruiterName')
        rec_email = job.get('recruiterEmail')
        rec_title = job.get('recruiterTitle')
        
        rec_parts = []
        if rec_name:
            rec_parts.append(f"<b>Contact:</b> {html.escape(rec_name)}")
            if rec_title:
                rec_parts.append(f"({html.escape(rec_title)})")
        if rec_email:
            rec_parts.append(f"| <b>Email:</b> {html.escape(rec_email)}")
            
        if rec_parts:
            rec_para = Paragraph(" ".join(rec_parts), ParagraphStyle('RecInfo', parent=job_meta_style, textColor=colors.HexColor('#6366f1'))) # indigo
            job_flowables.append(rec_para)
            
        # Brief description snippet (first 280 chars)
        raw_desc = job.get('description', '')
        # Strip HTML tags
        clean_desc = re.sub(r'<[^<]+?>', '', raw_desc)
        # Convert entities
        clean_desc = clean_desc.replace('&amp;', '&').replace('&quot;', '"').replace('&lt;', '<').replace('&gt;', '>')
        clean_desc = clean_desc.replace('&nbsp;', ' ').replace('&#39;', "'").replace('&rsquo;', "'").replace('&lsquo;', "'")
        clean_desc = clean_desc.replace('\r', '').replace('\n', ' ')
        clean_desc = re.sub(r'\s+', ' ', clean_desc).strip()
        if len(clean_desc) > 280:
            clean_desc = clean_desc[:280] + "..."
        # Now escape it for ReportLab
        clean_desc = html.escape(clean_desc)
        desc_para = Paragraph(clean_desc, desc_style)
        job_flowables.append(desc_para)
        
        # Divider line
        job_flowables.append(Spacer(1, 4))
        job_flowables.append(draw_line())
        job_flowables.append(Spacer(1, 10))
        
        # Keep each listing together so it doesn't split awkwardly
        story.append(KeepTogether(job_flowables))

    doc.build(story)
    
    # 6. Save back to registry (unless force_all)
    if not force_all:
        for job in unique_jobs:
            exported_ids.add(job.get("id"))
        save_exported_ids(exported_ids)

    print(f"Generated PDF successfully: {pdf_path}")
    return pdf_path, len(unique_jobs)

if __name__ == "__main__":
    force = "--force" in sys.argv
    path, count = generate_pdf(force_all=force)
    if path:
        print(f"Exported {count} jobs successfully.")
    else:
        print("Export finished with 0 jobs.")
