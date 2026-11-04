"""Regenerate the sharing PNG and downloadable tagged PDF from their HTML sources.
Start the local server first; requires Playwright and /usr/bin/chromium.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':1200,'height':630},device_scale_factor=1)
    page.goto('http://127.0.0.1:8000/assets/social-card.html',wait_until='networkidle')
    page.screenshot(path=str(ROOT/'assets/social-card.png'))
    page.goto('http://127.0.0.1:8000/resume.html',wait_until='networkidle')
    page.pdf(path=str(ROOT/'assets/ajit-kumar-maurya-profile.pdf'),format='A4',print_background=True,tagged=True,outline=True)
    browser.close()
print('Generated social-card.png and tagged professional profile PDF.')
