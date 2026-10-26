import pymupdf
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
for n,f in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf')]:pdfmetrics.registerFont(TTFont(n,'/System/Library/Fonts/Supplemental/'+f))
src='tmp/pdfs/skills-source.pdf'
doc=pymupdf.open(src);page=doc[0];W,H=page.rect.width,page.rect.height
for r in page.search_for('Terraform and CI/CD workflows.'):
 page.add_redact_annot(r,fill=(247/255,245/255,240/255))
page.add_redact_annot(pymupdf.Rect(20,398,184,H),fill=(25/255,47/255,55/255));page.apply_redactions(images=0,graphics=0)
c=canvas.Canvas('tmp/pdfs/skills-overlay.pdf',pagesize=(W,H))
def text(y,s,size=7.4,font='Bold',col='#A8C9B5'):
 c.setFillColor(HexColor(col));c.setFont(font,size);c.drawString(27,H-y-size,s)
def p(y,s):
 q=Paragraph(s,ParagraphStyle('x',fontName='Body',fontSize=8,leading=10.2,textColor=HexColor('#FFFFFF')));_,h=q.wrap(140,800);q.drawOn(c,27,H-y-h);return y+h
text(405,'SKILLS',8.5);y=425
for title,body in [
('FRONTEND','JavaScript, TypeScript, React, Next.js, Redux, HTML, CSS, SCSS/Sass, Material UI, Tailwind CSS, Bootstrap, React Router, EJS'),
('BACKEND AND DATA','Node.js, NestJS, Express, FastAPI, REST, GraphQL, Apollo Server, MongoDB, Mongoose, MySQL, Redis, JWT, WebSocket, Python'),
('DEVOPS AND TOOLS','Linux/Ubuntu, Docker, NGINX, PM2, DNS, GitHub, Postman, Figma, CI/CD'),
('AI ASSISTED DEVELOPMENT','OpenAI Codex, Cursor, Claude; AI-assisted implementation, design and application logic migration')]:
 text(y,title,6.9);y=p(y+13,body)+13
text(y,'LANGUAGES',8);y=p(y+17,'Uzbek: Native<br/>English: Basic<br/>Korean: Fluent<br/>Turkish: Intermediate')
assert y<823,y
c.setFillColor(HexColor('#263A41'));c.setFont('Body',9.1);c.drawString(229,H-413.1,'and CI/CD workflows.')
c.save();overlay=pymupdf.open('tmp/pdfs/skills-overlay.pdf');page.show_pdf_page(page.rect,overlay,0)
out='output/pdf/Danny_Kuvonchbek_CV.pdf';doc.save(out,garbage=4,deflate=True);page.get_pixmap(matrix=pymupdf.Matrix(1.6,1.6)).save('tmp/pdfs/cv-preview.png');print('Skills bottom:',y)
