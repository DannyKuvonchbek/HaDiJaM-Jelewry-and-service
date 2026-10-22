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
 txt(218,y,n,8,'Bold','#688777');txt(242,y,title,9,'Bold',navy);line(218,y+20,345,'#D9DFDA');return y+32

def bullet(y,s):box(219,y+5,2.5,2.5,'#688777');return p(229,y,332,s,9.1)+3
# Warm editorial composition: full-width masthead, narrow information rail.
box(0,0,W,H,'#FBFAF7')
box(0,0,W,5,navy)
box(27,29,3,105,'#A87D5A')
txt(43,30,'DANNY',10,'Bold',muted)
txt(40,48,'Kuvonchbek',37,'Display',navy)
txt(43,103,'Full-Stack Developer · DevOps Engineer',10.5,'Bold',navy)
txt(43,120,'AI Engineer · Agentic AI Developer',10.5,'Bold',navy)
p(43,143,400,'Building scalable web platforms and practical AI solutions.',9,muted,12)
c.saveState()
clip=c.beginPath();clip.roundRect(469,H-153,93,109,4);c.clipPath(clip,stroke=0,fill=0)
c.drawImage(ImageReader('tmp/pdfs/portrait.png'),469,H-153,width=93,height=109,mask='auto');c.restoreState()
line(28,179,535,'#D7DBD5')
# Information rail
box(27,204,159,585,'#EDF0EA')
txt(40,221,'CONTACT',8,'Bold','#557461')
p(40,245,133,'Wonju, South Korea<br/>+82 10-6761-9777',8.7,ink,14)
p(40,282,135,'sobirovich9702@gmail.com',7.9,ink)
txt(40,307,'hadijam.com',10,'Bold',navy);txt(40,328,'maen.site',9,'Body',muted)
c.linkURL('mailto:sobirovich9702@gmail.com',(39,H-296,178,H-280),relative=0)
for yy,u in [(307,'https://hadijam.com'),(328,'https://maen.site')]:c.linkURL(u,(39,H-yy-17,177,H-yy),relative=0)
line(40,360,133,'#CCD5CB');txt(40,378,'TECHNICAL TOOLKIT',8,'Bold','#557461')
y=403
for title,body in [('LANGUAGES','TypeScript / Python / Java'),('FRONTEND','React / Next.js'),('BACKEND','Node.js / NestJS / FastAPI<br/>Express / Django<br/>REST / GraphQL / Redis'),('DELIVERY','Docker / Terraform<br/>Kubernetes / PM2 / CI/CD'),('AI WORKFLOW','Cursor / Codex / Claude')]:
 txt(40,y,title,7,'Bold','#557461');y=p(40,y+15,134,body,8.3,ink,12)+17
line(40,681,133,'#CCD5CB');txt(40,699,'LANGUAGES',8,'Bold','#557461');p(40,722,133,'Korean: Level 4<br/>English: Basic',8.7,ink,14)
# Main narrative
p(218,204,344,'Builds across React and Next.js interfaces, NestJS and FastAPI services, and deployment workflows. Combines frontend and backend delivery with practical Cursor and Codex development workflows.',9.6,ink,14)
y=section(265,'01','EXPERIENCE / 4 YEARS 9 MONTHS')
txt(218,y,'NOVASTACK TECHNOLOGIES',10,'Bold');y+=18
txt(218,y,'Full-Stack Developer',9,'Bold','#557461');txt(435,y,'2024.09 - 2026.08',8,'Body',muted);y+=20
for s in ['Built and operated Next.js, NestJS and FastAPI platforms with REST and GraphQL services.','Developed reusable React components and applied Redis caching to support API performance.','Used Cursor and Codex for implementation and refactoring; supported Docker, Terraform and CI/CD workflows.']:y=bullet(y,s)
y+=4
txt(218,y,'LUMEN SOFTWARE LAB',10,'Bold');y+=18
txt(218,y,'Backend Developer',9,'Bold','#557461');txt(435,y,'2021.01 - 2022.09',8,'Body',muted);y+=20
y=bullet(y,'Collaborated on REST API integration and data exchange between frontend and backend services.')
y+=4
txt(218,y,'NESTTECH DIGITAL',10,'Bold');y+=18
txt(218,y,'Frontend Developer',9,'Bold','#557461');txt(435,y,'2019.10 - 2020.09',8,'Body',muted);y+=20
y=bullet(y,'Developed responsive React applications, reusable UI components and API integrations with Redux or Context API.')
y+=9;y=section(y,'02','SELECTED WORK')
# horizontal project feature
box(218,y,345,66,'#E9EEE7');txt(229,y+8,'HaDiJaM',14,'Display');p(229,y+29,320,'Marketplace and services: private chat, seller onboarding and GraphQL APIs.  <font color="#557461">hadijam.com</font>',8.8,ink,12)
c.linkURL('https://hadijam.com',(218,H-y-66,563,H-y),relative=0)
y+=76;txt(218,y,'Maen',11,'Display');txt(276,y+2,'Web project / maen.site',8.6,'Body',muted);c.linkURL('https://maen.site',(218,H-y-17,500,H-y),relative=0)
y+=30;y=section(y,'03','EDUCATION')
y=p(218,y,345,'<font name="Bold">Joongbu University</font> / 2024 - 2026<br/>Master\'s, Business Administration',8.8,ink,12)
y+=5;y=p(218,y,345,'<font name="Bold">Seojeong University</font> / 2020 - 2024<br/>Bachelor\'s, Global Korean Language',8.8,ink,12)
assert y<800,y

c.save();doc=pymupdf.open(out);doc[0].get_pixmap(matrix=pymupdf.Matrix(1.6,1.6)).save('tmp/pdfs/cv-preview.png');print('Created; content bottom:',y)
