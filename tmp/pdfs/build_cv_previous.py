from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pathlib import Path
import pymupdf
for name,file in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf'),('Display','Georgia.ttf')]:
 pdfmetrics.registerFont(TTFont(name,'/System/Library/Fonts/Supplemental/'+file))
W,H=595.28,841.89
out='output/pdf/Danny_Kuvonchbek_CV.pdf'
c=canvas.Canvas(out,pagesize=(W,H));c.setTitle('Danny Kuvonchbek | Full-Stack Developer');c.setAuthor('Danny Kuvonchbek')
navy='#152B36';ink='#21343C';muted='#5B6B71';copper='#AD6A45';paper='#FCFAF6'
def rect(x,y,w,h,color):c.setFillColor(HexColor(color));c.rect(x,H-y-h,w,h,fill=1,stroke=0)
def text(x,y,s,size=10,font='Body',color=ink):c.setFillColor(HexColor(color));c.setFont(font,size);c.drawString(x,H-y-size,s)
def para(x,y,w,s,size=9.2,color=ink,leading=None):
 p=Paragraph(s,ParagraphStyle('p',fontName='Body',fontSize=size,leading=leading or size*1.4,textColor=HexColor(color)));_,h=p.wrap(w,800);p.drawOn(c,x,H-y-h);return y+h

def label(x,y,n,s,w=515):
 text(x,y,n,9,'Bold',copper);text(x+27,y,s,10,'Bold',navy)
 c.setStrokeColor(HexColor('#DCDDD6'));c.setLineWidth(.6);c.line(x+27,H-y-18,x+w,H-y-18)
 return y+29

def bullet(y,s):
 rect(54,y+5,3,3,copper);return para(65,y,477,s,9.2)+5
rect(0,0,W,H,paper);rect(0,0,W,194,navy);rect(38,34,28,3,copper)
c.saveState()
clip=c.beginPath();clip.roundRect(460,H-145,94,102,8);c.clipPath(clip,stroke=0,fill=0)
c.drawImage(ImageReader('tmp/pdfs/portrait.png'),460,H-145,width=94,height=102,mask='auto')
c.restoreState()
text(38,48,'DANNY',13,'Bold','#D8BAA2');text(36,69,'Kuvonchbek',40,'Display','#FFFFFF')
text(39,126,'FULL-STACK DEVELOPER',12,'Bold','#FFFFFF')
text(39,148,'Next.js / NestJS / Python / AI-assisted development',9.5,'Body','#CBD7D9')
text(39,169,'Wonju, South Korea   |   +82 10-6761-9777   |   hadijam.com',8.5,'Body','#E7ECE9')
text(39,182,'sobirovich9702@gmail.com',8.5,'Body','#E7ECE9')
c.linkURL('mailto:sobirovich9702@gmail.com',(39,H-193,230,H-181),relative=0)
y=205
y=para(39,y,515,'Full-stack developer building web platforms across React and Next.js interfaces, NestJS and FastAPI services, and deployment workflows. Brings frontend and backend experience together with practical AI-assisted engineering using Cursor and Codex.',10,leading=14)
y+=10;y=label(39,y,'01','PROFESSIONAL EXPERIENCE')
text(39,y,'NOVASTACK TECHNOLOGIES',11,'Bold');text(456,y,'2024 - 2026',9,'Body',muted);y+=17
text(39,y,'Full-Stack Developer | AI-assisted engineering',9.5,'Bold',copper);y+=20
for s in [
'Built and operated Next.js, NestJS and FastAPI platforms, connecting user interfaces with REST and GraphQL services.',
'Developed reusable React components and applied Redis caching to support maintainable interfaces and API performance.',
'Applied Cursor and Codex workflows to implementation and refactoring; worked with Docker, Terraform and CI/CD deployment pipelines.'
]:y=bullet(y,s)
y+=8
text(39,y,'KIDIFYS DEVELOPMENT',11,'Bold');text(456,y,'2021 - 2023',9,'Body',muted);y+=17
text(39,y,'Backend Developer',9.5,'Bold',copper);y+=19
y=bullet(y,'Collaborated on REST API integration and data exchange between frontend applications and backend services.')
y+=7
text(39,y,'NESTTECH DIGITAL',11,'Bold');text(456,y,'2019 - 2020',9,'Body',muted);y+=17
text(39,y,'Frontend Developer',9.5,'Bold',copper);y+=19
y=bullet(y,'Developed React applications with reusable components, responsive layouts and REST API integration; managed asynchronous state with Redux or Context API.')
y+=7;y=label(39,y,'02','SELECTED WORK')
text(39,y,'HaDiJaM',12,'Display');text(332,y,'Maen',12,'Display');y+=20
para(39,y,255,'Marketplace and service platform with private chat, seller onboarding and GraphQL APIs.<br/><font color="#AD6A45">hadijam.com</font>',9)
para(332,y,222,'Web project.<br/><font color="#AD6A45">maen.site</font>',9)
c.linkURL('https://hadijam.com',(39,H-y-29,200,H-y),relative=0);c.linkURL('https://maen.site',(332,H-y-29,500,H-y),relative=0)
y+=47;y=label(39,y,'03','TECHNICAL TOOLKIT')
y=para(39,y,515,'<font name="Bold">Languages</font>  TypeScript, Python, Java   <font color="#AD6A45">/</font>   <font name="Bold">Runtime</font>  Node.js<br/><font name="Bold">Web</font>  React, Next.js, NestJS, FastAPI, Express, Django, REST, GraphQL<br/><font name="Bold">Delivery</font>  Docker, Terraform, Kubernetes, PM2, CI/CD   <font color="#AD6A45">/</font>   <font name="Bold">AI tools</font>  Cursor, Codex, Claude',8.6,leading=13)
y+=8;y=label(39,y,'04','EDUCATION & LANGUAGES')
y=para(39,y,515,'<font name="Bold">Joongbu University</font>  |  Master\'s, Business Administration  |  2024 - 2026<br/><font name="Bold">Seojeong University</font>  |  Bachelor\'s, Global Korean Language  |  2020 - 2024<br/><font name="Bold">Languages</font>  Korean: Level 4   /   English: Basic',8.6,leading=13)
assert y<809,y
rect(39,817,517,1,'#DCDDD6');text(39,824,'DANNY KUVONCHBEK',7,'Bold',muted);text(453,824,'ENGINEERING / 01',7,'Body',muted)
c.save()
doc=pymupdf.open(out);doc[0].get_pixmap(matrix=pymupdf.Matrix(1.6,1.6)).save('tmp/pdfs/cv-preview.png');print('Created',out,'content ends at',y)
