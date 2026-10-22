from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
import pymupdf
for n,f in [('Body','Arial.ttf'),('Bold','Arial Bold.ttf'),('Display','Georgia.ttf')]:pdfmetrics.registerFont(TTFont(n,'/System/Library/Fonts/Supplemental/'+f))
W,H=595.28,841.89
out='output/pdf/Danny_Kuvonchbek_CV.pdf';c=canvas.Canvas(out,pagesize=(W,H));c.setTitle('Danny Kuvonchbek | Full-Stack Developer');c.setAuthor('Danny Kuvonchbek')
navy='#203A3D';white='#FFFFFF';ink='#263A41';muted='#64747A';accent='#A8C9B5';cream='#F7F5F0'
def box(x,y,w,h,col):c.setFillColor(HexColor(col));c.rect(x,H-y-h,w,h,fill=1,stroke=0)
def txt(x,y,s,size=10,font='Body',col=ink):c.setFillColor(HexColor(col));c.setFont(font,size);c.drawString(x,H-y-size,s)
def p(x,y,w,s,size=9.2,col=ink,leading=None):
 q=Paragraph(s,ParagraphStyle('x',fontName='Body',fontSize=size,leading=leading or size*1.38,textColor=HexColor(col)));_,h=q.wrap(w,800);q.drawOn(c,x,H-y-h);return y+h

def line(x,y,w,col):box(x,y,w,.6,col)
def section(y,n,title):
 txt(218,y,n,8,'Bold','#426A77');txt(242,y,title,9,'Bold',navy);line(218,y+20,345,'#D9DFDA');return y+32

def bullet(y,s):box(219,y+5,2.5,2.5,'#426A77');return p(229,y,332,s,9.1)+3
# Reference-inspired masthead, portrait and two-column timeline.
box(0,0,W,H,'#FFFFFF')
box(0,18,W,149,'#244C61')
box(0,18,188,149,'#E9EFF0')
c.drawImage(ImageReader('tmp/pdfs/portrait.png'),43,H-167,width=124,height=135,mask='auto')
txt(211,35,'DANNY',11,'Bold','#BCD3D9')
txt(208,54,'Kuvonchbek',34,'Display','#FFFFFF')
txt(211,103,'Full-Stack Developer · DevOps Engineer',10,'Bold','#FFFFFF')
txt(211,120,'AI Engineer · Agentic AI Developer',10,'Bold','#FFFFFF')
txt(211,145,'Building scalable web platforms and practical AI solutions.',8.1,'Body','#DAE5E8')
# Light sidebar with disciplined section rhythm.
box(23,189,165,610,'#F1F5F4')
txt(37,205,'CONTACT',8,'Bold','#426A77')
p(37,227,138,'Wonju, South Korea<br/>+82 10-6761-9777',8.7,ink,14)
p(37,263,139,'sobirovich9702@gmail.com',8,ink)
txt(37,289,'hadijam.com',10,'Bold',navy);txt(37,310,'maen.site',9,'Body',muted)
c.linkURL('mailto:sobirovich9702@gmail.com',(36,H-279,181,H-262),relative=0)
for yy,u in [(289,'https://hadijam.com'),(310,'https://maen.site')]:c.linkURL(u,(36,H-yy-17,180,H-yy),relative=0)
line(37,345,137,'#CEDBDA');txt(37,362,'TECHNICAL SKILLS',8,'Bold','#426A77')
y=387
for title,body in [('LANGUAGES','TypeScript / Python / Java'),('FRONTEND','React / Next.js'),('BACKEND','Node.js / NestJS / FastAPI<br/>Express / Django<br/>REST / GraphQL / Redis'),('DEVOPS','Docker / Terraform<br/>Kubernetes / PM2 / CI/CD'),('AGENTIC AI TOOLS','Cursor / Codex / Claude')]:
 txt(37,y,title,7,'Bold','#426A77');y=p(37,y+15,139,body,8.4,ink,12)+17
line(37,666,137,'#CEDBDA');txt(37,684,'LANGUAGES',8,'Bold','#426A77');p(37,707,139,'Korean: Level 4<br/>English: Basic',8.7,ink,14)
# Profile and experience.
p(218,189,344,'Builds across React and Next.js interfaces, NestJS and FastAPI services, and deployment workflows. Combines frontend and backend delivery with practical Cursor and Codex development workflows.',9.6,ink,14)
y=section(250,'01','EXPERIENCE / 4 YEARS 9 MONTHS')
timeline_start=y+5
txt(218,y,'NOVASTACK TECHNOLOGIES',10,'Bold');y+=18
txt(218,y,'Full-Stack Developer',9,'Bold','#426A77');txt(435,y,'2024.09 - 2026.08',8,'Body',muted);y+=20
for s in ['Built and operated Next.js, NestJS and FastAPI platforms with REST and GraphQL services.','Developed reusable React components and applied Redis caching to support API performance.','Used Cursor and Codex for implementation and refactoring; supported Docker, Terraform and CI/CD workflows.']:y=bullet(y,s)
y+=4
timeline_second=y+5
txt(218,y,'LUMEN SOFTWARE LAB',10,'Bold');y+=18
txt(218,y,'Backend Developer',9,'Bold','#426A77');txt(435,y,'2021.01 - 2022.09',8,'Body',muted);y+=20
y=bullet(y,'Collaborated on REST API integration and data exchange between frontend and backend services.')
y+=4
timeline_end=y+5
txt(218,y,'NESTTECH DIGITAL',10,'Bold');y+=18
txt(218,y,'Frontend Developer',9,'Bold','#426A77');txt(435,y,'2019.10 - 2020.09',8,'Body',muted);y+=20
y=bullet(y,'Developed responsive React applications, reusable UI components and API integrations with Redux or Context API.')
box(207,timeline_start,0.7,timeline_end-timeline_start,'#B9CDD0')
for ty in [timeline_start,timeline_second,timeline_end]:
 c.setFillColor(HexColor('#426A77'));c.circle(207.35,H-ty,2.7,fill=1,stroke=0)
y+=9;y=section(y,'02','SELECTED WORK')
# horizontal project feature
box(218,y,345,66,'#EDF3F4');txt(229,y+8,'HaDiJaM',14,'Display');p(229,y+29,320,'Marketplace and services: private chat, seller onboarding and GraphQL APIs.  <font color="#557461">hadijam.com</font>',8.8,ink,12)
c.linkURL('https://hadijam.com',(218,H-y-66,563,H-y),relative=0)
y+=76;txt(218,y,'Maen',11,'Display');txt(276,y+2,'Web project / maen.site',8.6,'Body',muted);c.linkURL('https://maen.site',(218,H-y-17,500,H-y),relative=0)
y+=30;y=section(y,'03','EDUCATION')
y=p(218,y,345,'<font name="Bold">Joongbu University</font> / 2024 - 2026<br/>Master\'s, Business Administration',8.8,ink,12)
y+=5;y=p(218,y,345,'<font name="Bold">Seojeong University</font> / 2020 - 2024<br/>Bachelor\'s, Global Korean Language',8.8,ink,12)
assert y<800,y

c.save();doc=pymupdf.open(out);doc[0].get_pixmap(matrix=pymupdf.Matrix(1.6,1.6)).save('tmp/pdfs/cv-preview.png');print('Created; content bottom:',y)
