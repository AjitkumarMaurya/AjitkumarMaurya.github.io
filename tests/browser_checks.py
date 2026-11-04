"""Run against python3 -m http.server 8000 from the repository root.
Requires the environment's Python Playwright and /usr/bin/chromium.
Optional: AXE_PATH=/path/to/axe.min.js enables accessibility checks.
"""
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('PORTFOLIO_URL', 'http://127.0.0.1:8000')
REPORT = {'passed': [], 'accessibility': [], 'remote_artwork': 'Blocked deliberately in offline resilience checks; separate network check required.'}

def passed(name):
    REPORT['passed'].append(name)
    print('PASS:', name)

def audit(page, state):
    axe_path = os.environ.get('AXE_PATH')
    if not axe_path:
        return
    page.add_script_tag(path=axe_path)
    result = page.evaluate('''async () => await axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}})''')
    findings = [{'id': x['id'], 'impact': x['impact'], 'nodes': [n['target'] for n in x['nodes']]} for x in result['violations']]
    REPORT['accessibility'].append({'state': state, 'violations': findings, 'passes': len(result['passes']), 'incomplete': len(result['incomplete'])})
    assert not findings, findings
    passed('axe accessibility: ' + state)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width':1440,'height':1000}, reduced_motion='reduce')
    # Test the real local page while external services are unavailable.
    context.route('https://**/*', lambda route: route.abort())
    page = context.new_page()
    errors = []
    bad_local_responses = []
    page.on('pageerror', lambda err: errors.append(str(err)))
    page.on('response', lambda res: bad_local_responses.append((res.url,res.status)) if res.url.startswith(BASE) and res.status>=400 else None)
    assert page.goto(BASE+'/',wait_until='networkidle').status == 200
    page.wait_for_function("document.querySelector('.repo-controls').hidden === false")
    assert page.locator('h1').count() == 1
    assert page.locator('main > section').count() == 8
    assert page.locator('.product').count() == 5
    assert page.locator('.skill-card').count() == 7
    assert page.locator('.timeline-item').count() == 5
    assert page.locator('.highlights-grid article').count() == 3
    passed('all requested sections and five product stories render')
    assert page.locator('#repo-grid .repo-card').count() >= 6
    assert page.locator('#repo-grid .repo-card').first.locator('h3').inner_text() == 'imdbkt'
    page.locator('#repo-search').fill('galleryImagePicker')
    assert page.locator('#repo-grid .repo-card').count() == 1
    page.locator('#repo-search').fill('no-such-project-xyz')
    assert page.locator('#repo-empty').is_visible()
    page.locator('#repo-reset').click()
    assert not page.locator('#repo-empty').is_visible()
    for category in ['Android','Flutter','Kotlin','Experiments']:
        page.locator('#repo-category').select_option(label=category)
        assert page.locator('#repo-grid .repo-card').count() > 0
        assert all(x == category for x in page.locator('#repo-grid .repo-top span').all_text_contents())
    page.locator('#repo-category').select_option('all')
    page.locator('#repo-type').select_option('fork')
    assert page.locator('#repo-grid .repo-card').count()>0
    assert all(x == 'Fork' for x in page.locator('#repo-grid .repo-top span').all_text_contents())
    page.locator('#repo-type').select_option('original')
    page.locator('#repo-language').select_option('Kotlin')
    assert page.locator('#repo-grid .repo-card').count()>0
    assert all(x == 'Kotlin' for x in page.locator('#repo-grid .repo-language').all_text_contents())
    page.locator('#repo-language').select_option('all')
    page.locator('#repo-sort').select_option('name')
    names=page.locator('#repo-grid h3').all_text_contents()
    assert names==sorted(names,key=str.casefold)
    passed('search, empty state, reset, technology/language filters, fork separation and sorting')
    # All old anchors and all local CTAs must continue to resolve.
    ids=page.locator('[id]').evaluate_all('(els)=>els.map(e=>e.id)')
    assert len(ids)==len(set(ids)), 'Duplicate IDs'
    for anchor in page.locator('a[href^="#"]').all():
        target=anchor.get_attribute('href')[1:]
        assert target in ids, target
    for old_id in ['top','main','apps','work','about','repositories','contact','panel-myco','panel-lens','panel-society','panel-fincasys','panel-association']:
        assert old_id in ids
    for anchor in page.locator('a[download]').all():
        response=context.request.get(BASE+'/'+anchor.get_attribute('href'))
        assert response.status==200 and response.body().startswith(b'%PDF')
    assert page.locator('a[href="mailto:ajitmauray@gmail.com"]').count()>=3
    for anchor in page.locator('a[target="_blank"]').all():
        assert 'noopener' in anchor.get_attribute('rel')
    passed('all fragment links, preserved URLs, email, PDF download and external-link safety')
    artwork=page.locator('[data-image]').first
    artwork.click()
    assert page.locator('dialog').evaluate('(d)=>d.open')
    assert page.locator('#dialog-original').get_attribute('href') == artwork.get_attribute('href')
    page.keyboard.press('Escape')
    assert not page.locator('dialog').evaluate('(d)=>d.open')
    assert artwork.evaluate('(a)=>a===document.activeElement')
    passed('screenshot dialog, Escape, return focus and original artwork link')
    assert page.locator('.motion-toggle').is_disabled()
    assert page.locator('html').get_attribute('data-motion')=='off'
    audit(page,'desktop dark reduced motion')
    page.locator('.theme-toggle').click()
    assert page.locator('html').get_attribute('data-theme')=='light'
    assert page.locator('.theme-toggle').get_attribute('aria-label')=='Switch to dark theme'
    page.reload(wait_until='networkidle')
    assert page.locator('html').get_attribute('data-theme')=='light'
    audit(page,'desktop light')
    passed('theme toggles, labels update and preference survives reload')
    for width,height in [(320,740),(360,800),(390,844),(768,1024),(1024,768),(1440,1000),(1920,1080)]:
        page.set_viewport_size({'width':width,'height':height})
        page.evaluate('scrollTo(0,0)')
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Horizontal overflow at {width}'
        for section in page.locator('main > section').all():
            section.scroll_into_view_if_needed()
            assert section.is_visible()
        if width<=650:
            page.evaluate('scrollTo(0,0)')
            page.locator('.menu-toggle').click()
            assert page.locator('.menu-toggle').get_attribute('aria-expanded')=='true'
            assert page.locator('.nav-links').is_visible()
            page.keyboard.press('Escape')
            assert page.locator('.menu-toggle').get_attribute('aria-expanded')=='false'
            page.locator('.menu-toggle').click()
            page.locator('.nav-links a[href="#about"]').click()
            assert page.locator('.menu-toggle').get_attribute('aria-expanded')=='false'
    passed('all sections at seven viewport widths (320–1920px), no horizontal overflow, mobile navigation')
    page.set_viewport_size({'width':390,'height':844})
    page.evaluate('scrollTo(0,0)')
    page.locator('.menu-toggle').click()
    audit(page,'mobile light with open navigation')
    page.keyboard.press('Escape')
    page.locator('.theme-toggle').click()
    audit(page,'mobile dark')
    metadata=page.evaluate('''() => ({title:document.title,description:document.querySelector('meta[name="description"]').content,canonical:document.querySelector('link[rel="canonical"]').href,schema:JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent),image:document.querySelector('meta[property="og:image"]').content})''')
    assert 'Senior Mobile' in metadata['title']
    assert metadata['schema']['email']=='mailto:ajitmauray@gmail.com'
    assert metadata['canonical']=='https://ajitkumarmaurya.github.io/'
    assert context.request.get(BASE+'/assets/social-card.png').status==200
    assert not errors, errors
    assert not bad_local_responses, bad_local_responses
    passed('SEO, structured data, local assets and zero uncaught JavaScript errors')
    # No-JavaScript users retain all products, selected code and mobile navigation.
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
    nojs.route('https://**/*',lambda route:route.abort())
    static=nojs.new_page();static.goto(BASE+'/',wait_until='domcontentloaded')
    assert static.locator('.product').count()==5
    assert static.locator('#repo-grid .repo-card').count()==6
    assert static.locator('.nav-links a[href="#apps"]').is_visible()
    assert static.locator('html').evaluate('(el)=>el.scrollWidth')<=390
    passed('usable without JavaScript, including mobile navigation')
    nojs.close()
    # Normal motion remains optional, and controls respond to system preference changes.
    page.emulate_media(reduced_motion='no-preference')
    expect(page.locator('.motion-toggle')).to_be_enabled()
    page.locator('.motion-toggle').click()
    assert page.locator('html').get_attribute('data-motion')=='off'
    page.locator('.motion-toggle').click()
    assert page.locator('html').get_attribute('data-motion')=='on'
    passed('motion pause/resume and live OS reduced-motion preference changes')
    context.close()
    # Exercise successful live refresh and safe rendering with controlled API data.
    live=browser.new_context(reduced_motion='reduce')
    snapshot=json.loads((Path(__file__).resolve().parents[1]/'assets/repositories.json').read_text())
    owner={'login':'AjitkumarMaurya'}
    payload=[dict(r,owner=owner,private=False,size=100) for r in snapshot]
    payload.append({'name':'safe-test','description':'Demonstration of safe rendering: <img src=x onerror=alert(1)>','html_url':'https://github.com/AjitkumarMaurya/safe-test','language':'Kotlin','fork':False,'owner':owner,'private':False,'size':10})
    payload.append({'name':'unsafe','html_url':'javascript:alert(1)','language':'Kotlin','owner':owner,'private':False})
    live.route('https://**/*',lambda route:route.abort())
    live.route('https://api.github.com/**',lambda route:route.fulfill(json=payload))
    fresh=live.new_page();fresh.goto(BASE+'/',wait_until='networkidle')
    fresh.wait_for_function("document.querySelector('#repo-refresh').textContent.startsWith('Refreshed')")
    fresh.locator('#repo-search').fill('safe-test')
    assert fresh.locator('#repo-grid .repo-card').count()==1
    assert '<img src=x' in fresh.locator('#repo-grid').inner_text()
    assert fresh.locator('#repo-grid img').count()==0
    assert fresh.locator('a[href^="javascript:"]').count()==0
    passed('successful GitHub refresh and safe handling of untrusted API text/URLs')
    live.close();browser.close()
Path('/tmp/portfolio-browser-results.json').write_text(json.dumps(REPORT,indent=2))
print(f"Completed {len(REPORT['passed'])} check groups.")
