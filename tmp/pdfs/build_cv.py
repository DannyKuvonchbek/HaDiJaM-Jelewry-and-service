from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
import pymupdf
for n,f in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf'),('Display','Georgia.ttf')]:pdfmetrics.registerFont(TTFont(n,'/System/Library/Fonts/Supplemental/'+f))
W,H=595.28,841.89;out='output/pdf/Danny_Kuvonchbek_CV.pdf';c=canvas.Canvas(out,pagesize=(W,H));c.setTitle('Danny Kuvonchbek | Engineering Profile');c.setAuthor('Danny Kuvonchbek')
ink='#232323';muted='#656463';accent='#9E4F35';paper='#FAF8F3'
def box(x,y,w,h,col):c.setFillColor(HexColor(col));c.rect(x,H-y-h,w,h,fill=1,stroke=0)
def txt(x,y,s,size=10,font='Body',col=ink):c.setFillColor(HexColor(col));c.setFont(font,size);c.drawString(x,H-y-size,s)
def p(x,y,w,s,size=9.2,col=ink,leading=None):
 q=Paragraph(s,ParagraphStyle('p',fontName='Body',fontSize=size,leading=leading or size*1.36,textColor=HexColor(col)));_,h=q.wrap(w,800);q.drawOn(c,x,H-y-h);return y+h

def rule(y):box(36,y,523,.6,'#CFCBC4')
def section(y,n,title):
 rule(y);txt(36,y+12,n,8,'Bold',accent);txt(63,y+10,title,10,'Bold');return y+36
box(0,0,W,H,paper)
txt(36,25,'ENGINEERING / PRODUCT / APPLIED AI',8,'Bold',accent)
txt(33,48,'Danny',31,'Display');txt(32,81,'Kuvonchbek',43,'Display')
c.saveState();clip=c.beginPath();clip.circle(494,H-96,62);c.clipPath(clip,stroke=0,fill=0);c.drawImage(ImageReader('tmp/pdfs/portrait.png'),432,H-164,width=124,height=135,mask='auto');c.restoreState()
txt(36,142,'Full-Stack Developer · DevOps Engineer',11,'Bold');txt(36,159,'AI Engineer · Agentic AI Developer',11,'Bold')
p(36,184,500,'Building scalable web platforms and practical AI solutions.',10,accent)
rule(209)
txt(36,220,'Wonju, South Korea',8,'Body',muted);txt(185,220,'+82 10-6761-9777',8,'Body',muted);txt(350,220,'sobirovich9702@gmail.com',8,'Body',muted)
txt(36,238,'hadijam.com',9,'Bold',accent);txt(139,238,'maen.site',9,'Bold',accent);txt(350,238,'Visa: D-10',9,'Bold',ink)
for x,w,u in [(36,90,'https://hadijam.com'),(139,80,'https://maen.site')]:c.linkURL(u,(x,H-252,x+w,H-236),relative=0)
c.linkURL('mailto:sobirovich9702@gmail.com',(350,H-234,558,H-218),relative=0)
p(36,263,523,'Full-stack developer working across React and Next.js interfaces, NestJS and FastAPI services, and deployment workflows. Applies Cursor and Codex to practical implementation and refactoring.',9.6,ink,13.5)
y=section(307,'01','EXPERIENCE / 4 YEARS 9 MONTHS')
def role(y,date,company,title,body):
 txt(36,y,date,8,'Bold',accent)
 txt(159,y-2,company,10.2,'Bold');txt(159,y+14,title,9,'Bold',muted)
 end=p(159,y+34,400,body,9.2,ink,12.6)
 return end+19

y=role(y,'2024.09 - 2026.08','NOVASTACK TECHNOLOGIES','Full-Stack Developer',
'Built Next.js, NestJS and FastAPI platforms with REST and GraphQL services. Developed reusable React components and applied Redis caching.<br/>Used Cursor and Codex for implementation and refactoring; supported Docker, Terraform and CI/CD workflows.')
y=role(y,'2021.01 - 2022.09','LUMEN SOFTWARE LAB','Backend Developer',
'Collaborated on REST API integration and data exchange between frontend applications and backend services.')
y=role(y,'2019.10 - 2020.09','NESTTECH DIGITAL','Frontend Developer',
'Developed responsive React applications, reusable UI components and API integrations with Redux or Context API.')
y=section(y-2,'02','SELECTED WORK')
box(36,y,255,62,'#ECE8E0');box(303,y,256,62,'#ECE8E0')
txt(47,y+8,'HaDiJaM',12,'Display');p(47,y+27,233,'Marketplace, private chat, seller onboarding and GraphQL APIs. / hadijam.com',8.5,ink,11)
txt(314,y+8,'Maen',12,'Display');p(314,y+27,232,'Web project / maen.site',8.5,ink,11)
c.linkURL('https://hadijam.com',(36,H-y-62,291,H-y),relative=0);c.linkURL('https://maen.site',(303,H-y-62,559,H-y),relative=0)
y+=76;y=section(y,'03','TOOLKIT & EDUCATION')
a=p(36,y,255,'<font name="Bold">Engineering</font><br/>TypeScript, Python, Java / Node.js<br/>React, Next.js, NestJS, FastAPI, Express, Django<br/>REST, GraphQL, Redis<br/>Docker, Terraform, Kubernetes, PM2, CI/CD<br/>Cursor, Codex, Claude',8.1,ink,11)
b=p(303,y,256,'<font name="Bold">Joongbu University</font> / 2024 - 2026<br/>Master\'s, Business Administration<br/><font name="Bold">Seojeong University</font> / 2020 - 2024<br/>Bachelor\'s, Global Korean Language<br/><font name="Bold">Languages</font> / Korean: Level 4; English: Basic',8.1,ink,11)
assert max(a,b)<818,(a,b)
c.save();doc=pymupdf.open(out);doc[0].get_pixmap(matrix=pymupdf.Matrix(1.6,1.6)).save('tmp/pdfs/cv-preview.png');print('Content bottom:',max(a,b))
