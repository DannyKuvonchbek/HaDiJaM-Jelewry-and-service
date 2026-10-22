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
navy='#192F37';white='#FFFFFF';ink='#263A41';muted='#64747A';accent='#A8C9B5';cream='#F7F5F0'
def box(x,y,w,h,col):c.setFillColor(HexColor(col));c.rect(x,H-y-h,w,h,fill=1,stroke=0)
def txt(x,y,s,size=10,font='Body',col=ink):c.setFillColor(HexColor(col));c.setFont(font,size);c.drawString(x,H-y-size,s)
def p(x,y,w,s,size=9.2,col=ink,leading=None):
 q=Paragraph(s,ParagraphStyle('x',fontName='Body',fontSize=size,leading=leading or size*1.38,textColor=HexColor(col)));_,h=q.wrap(w,800);q.drawOn(c,x,H-y-h);return y+h

def line(x,y,w,col):box(x,y,w,.6,col)
def section(y,n,title):
 txt(218,y,n,8,'Bold','#688777');txt(242,y,title,9,'Bold',navy);line(218,y+20,345,'#D9DFDA');return y+32

def bullet(y,s):box(219,y+5,2.5,2.5,'#688777');return p(229,y,332,s,9.1)+3
box(0,0,W,H,cream);box(0,0,190,H,navy)
# Portrait treatment
box(25,29,140,154,'#304950');c.drawImage(ImageReader('tmp/pdfs/portrait.png'),30,H-178,width=130,height=141,mask='auto')
txt(27,203,'BASED IN',7.2,'Bold',accent);txt(27,219,'Wonju, South Korea',9,'Body',white)
line(27,251,136,'#496168');txt(27,269,'CONTACT',8,'Bold',accent)
p(27,291,142,'+82 10-6761-9777',9,white)
p(27,314,142,'sobirovich9702@gmail.com',8.2,white)
txt(27,339,'hadijam.com',10,'Bold',white);txt(27,360,'maen.site',9,'Body',white)
c.linkURL('mailto:sobirovich9702@gmail.com',(25,H-330,170,H-312),relative=0)
for y,u in [(339,'https://hadijam.com'),(360,'https://maen.site')]:c.linkURL(u,(25,H-y-17,164,H-y),relative=0)
line(27,397,136,'#496168');txt(27,415,'CORE TOOLKIT',8,'Bold',accent)
y=439
for title,body in [('LANGUAGES','TypeScript / Python / Java'),('FRONTEND','React / Next.js'),('BACKEND','Node.js / NestJS / FastAPI<br/>Express / Django<br/>REST / GraphQL / Redis'),('DELIVERY','Docker / Terraform<br/>Kubernetes / PM2 / CI/CD'),('AI WORKFLOW','Cursor / Codex / Claude')]:
 txt(27,y,title,7,'Bold',accent);y=p(27,y+16,138,body,8.7,white,13)+18
line(27,718,136,'#496168');txt(27,736,'LANGUAGES',8,'Bold',accent);p(27,758,136,'Korean: Level 4<br/>English: Basic',9,white,14)
# Main column
box(218,35,27,3,'#688777');txt(218,51,'DANNY',11,'Bold',muted);txt(215,70,'Kuvonchbek',33,'Display',navy)
txt(218,117,'Full-Stack Developer · DevOps Engineer',10.5,'Bold',navy)
txt(218,134,'AI Engineer · Agentic AI Developer',10.5,'Bold',navy)
p(218,157,344,'Building scalable web platforms and practical AI solutions.',9,muted,12)
line(218,183,345,'#D9DFDA')
p(218,198,344,'Builds across React and Next.js interfaces, NestJS and FastAPI services, and deployment workflows. Combines frontend and backend delivery with practical Cursor and Codex development workflows.',9.6,ink,14)
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
