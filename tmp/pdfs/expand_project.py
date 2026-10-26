import pymupdf
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
for n,f in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf'),('Display','Georgia.ttf')]:pdfmetrics.registerFont(TTFont(n,'/System/Library/Fonts/Supplemental/'+f))
src='output/pdf/Danny_Kuvonchbek_CV.pdf';doc=pymupdf.open(src);page=doc[0];W,H=page.rect.width,page.rect.height
# Remove the old project region including its colored card, retaining the section heading.
page.add_redact_annot(pymupdf.Rect(211,599,580,H),fill=(247/255,245/255,240/255));page.apply_redactions(images=0,graphics=0)
for link in page.get_links():
 if link['from'].y0>=599 and link['from'].x0>200:page.delete_link(link)
c=canvas.Canvas('tmp/pdfs/project-overlay.pdf',pagesize=(W,H))
def t(x,y,s,size=9,font='Body',col='#263A41'):
 c.setFillColor(HexColor(col));c.setFont(font,size);c.drawString(x,H-y-size,s)
def p(x,y,w,s,size=8.4,lead=11):
 q=Paragraph(s,ParagraphStyle('x',fontName='Body',fontSize=size,leading=lead,textColor=HexColor('#263A41')));_,h=q.wrap(w,800);q.drawOn(c,x,H-y-h);return y+h
c.setFillColor(HexColor('#E9EEE7'));c.rect(218,H-720,345,118,fill=1,stroke=0)
t(229,608,'HaDiJaM',14,'Display');t(487,613,'hadijam.com',8,'Bold','#557461')
y=p(229,630,323,'<font name="Bold">Stack:</font> Next.js, TypeScript, NestJS, GraphQL/Apollo, MongoDB/Mongoose, JWT and WebSocket.',8.3,10.8)
y=p(229,y+4,323,'<font name="Bold">Platform:</font> Private atelier chat, seller onboarding, comments, likes and follower/following relationships.',8.3,10.8)
y=p(229,y+4,323,'<font name="Bold">AI:</font> Catalog-based assistant for product discovery and service guidance; Cursor/Codex-assisted implementation and refactoring.',8.3,10.8)
assert y<716,y
c.linkURL('https://hadijam.com',(218,H-720,563,H-602),relative=0)
t(218,728,'Maen',11,'Display');t(276,730,'Web project / maen.site',8.6,col='#64747A');c.linkURL('https://maen.site',(218,H-745,500,H-727),relative=0)
t(218,752,'03',8,'Bold','#688777');t(242,752,'EDUCATION',9,'Bold','#192F37')
c.setFillColor(HexColor('#D9DFDA'));c.rect(218,H-770,345,.6,fill=1,stroke=0)
y=p(218,779,345,'<font name="Bold">Joongbu University</font> / 2024 - 2026<br/>Master\'s, Business Administration',8.5,11)
y=p(218,y+4,345,'<font name="Bold">Seojeong University</font> / 2020 - 2024<br/>Bachelor\'s, Global Korean Language',8.5,11)
assert y<831,y
c.save();over=pymupdf.open('tmp/pdfs/project-overlay.pdf');page.show_pdf_page(page.rect,over,0)
# show_pdf_page does not copy link annotations.
page.insert_link({'kind':pymupdf.LINK_URI,'from':pymupdf.Rect(218,602,563,720),'uri':'https://hadijam.com'})
page.insert_link({'kind':pymupdf.LINK_URI,'from':pymupdf.Rect(218,727,500,745),'uri':'https://maen.site'})
doc.save('tmp/pdfs/expanded-cv.pdf',garbage=4,deflate=True);doc.close()
from pathlib import Path
Path('tmp/pdfs/expanded-cv.pdf').replace(src)
doc=pymupdf.open(src);doc[0].get_pixmap(matrix=pymupdf.Matrix(1.6,1.6)).save('tmp/pdfs/cv-preview.png');print('Project expanded; bottom:',y)
