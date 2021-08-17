""" file: webscraper.py
    author: Priyanka Byahatti, Kiran Babu
    Description: Python file to scrape data from Auslanderbehorde webpage and store it in Firestore Database
    Department: Digital Engineering """



import sys
import io
import requests
import firebase_admin
from firebase_admin import credentials 
from firebase_admin import firestore
from bs4 import BeautifulSoup, NavigableString

#to make connection to firestore Database
try:
    app = firebase_admin.get_app()
except ValueError as e:
    # credentials.Certificate("location of the firestore authentication file")
    cred = credentials.Certificate('./firebase_connection_file.json')
    firebase_admin.initialize_app(cred)

#db object 
db=firestore.client()

# Get the url and parse it using BeautifulSoup
def get_soup(url):
    page = requests.get(url)
    # print(page.status_code)
    soup = BeautifulSoup(page.content, 'html.parser')
    return soup


# Get and return address and contact information
def get_address(url):
    soup_new = get_soup(url)
    address = soup_new.find("div", class_='randspalte_box')
    address_val = address.find('h2').text + '\n' + "Breiter Weg 222" + '\n' + "D - 39104 Magdeburg" + '\n' + address.find('div', class_='adressen_titel').text.strip() \
                  + '\n' + address.find('a').text + '\n' + address.find('a')['href'] + '\n' + "115 (Hotline)" \
                  + '\n' + "(0391) 5 40-43 89" + '\n' + "(0391) 5 40-43 50" \
                  + '\n' + address.find('a').findNext('a')['href']
    return address_val


# Get and return tram connectivity to foreigner's office
def get_accessibility(url):
    soup = get_soup(url)
    s = soup.find('div', attrs={'class': 'randspalte'})
    trams_info = s.find('h4').findNext('h4').text + ':' + '\n' + s.find('p').findNext('p').text
    return trams_info


# get and return opening_hours of office
def opening_hours(url):
    soup_hours = get_soup(url)
    hours = soup_hours.find("div", class_='randspalte')
    title = hours.find('h4').text
    a = []
    for i in soup_hours.select('.wd_oeff_main .wd_oeff_row div'):
        a.append(i.text)
    # print('\n'.join([ str(myelement) for myelement in a]))
    return title + '\n' + '\n'.join([str(myelement) for myelement in a])


# get some information on Magdeburg
def about_magdeburg(url):
    soup_new = get_soup('https://www.magdeburg.de/Home/index.php?NavID=37.199.2&La=2&')
    md = soup_new.find('div', class_ = 'inhalt_teaser')
    return md.find('p').text


# get and return documents needed by students for visa extension
def checklist_docs(url):
    soup1 = get_soup(url)
    checklist_docs = soup1.select_one('.inhalt_text_wide p').text + '\n' + soup1.select_one(
        '.inhalt_text_wide h2').text + '\n' + soup1.select_one('.inhalt_text_wide ul').text
    return checklist_docs

# Residence Permit data web crawling
url5 = 'https://www.magdeburg.de/Home/CitizenPortal/Migrants-Refugees/Foreigners-Authority-and-Citizens-Office/index.php?NavID=37.199&object=tx|37.7279.2&La=2&'
soup5 = get_soup(url5)
germanCourseRP = soup5.select_one('.inhalt_text_wide ul').text.capitalize()
applicableRP = soup5.find('div', class_ = 'inhalt_text_wide')
applicableRP = applicableRP.find('ul').findNext('ul').text.capitalize()
divTag = soup5.find("div", {"class": "inhalt_text_wide"})
documentsRP = soup5.find_all('p')[9].get_text() + '\n' + soup5.find_all('p')[10].get_text() + '\n' + divTag.find('ul').findNext('ul').findNext('ul').text
applicationFee = soup5.find_all('p')[11].get_text()


# Create python dict to store all residence permit related data
residencePermitDict = {
    "GermanCourseRP": germanCourseRP,
    "applicableRP": applicableRP,
    "documentsRP": documentsRP,
    "applicationFee": applicationFee
}

#Studies_Doctoral_val
doc_req=get_soup('https://www.magdeburg.de/Home/CitizenPortal/Migrants-Refugees/Foreigners-Authority-and-Citizens-Office/index.php?NavID=37.199&object=tx|37.11576.2&La=2&')
studies_doctoral= doc_req.find('div', class_='inhalt_text_wide')
Studies_Doctoral_val='1)'+studies_doctoral.find_all('li')[0].text+'\n2)'+studies_doctoral.find_all('li')[1].text+'\n3)'+studies_doctoral.find_all('li')[2].text \
                      +'\n4)'+studies_doctoral.find_all('li')[3].text +'\n5)'+studies_doctoral.find_all('li')[4].text+'\n6)'+studies_doctoral.find_all('li')[5].text+'\n7)'+studies_doctoral.find_all('li')[6].text

#Employment_After_Studies_val
Employment_after_studies=studies_doctoral.find_all('h2')[1]
Employment_After_Studies_val='1)'+Employment_after_studies.find_all_next('li')[0].text+'\n2)'+Employment_after_studies.find_all_next('li')[1].text\
                             +'\n3)'+Employment_after_studies.find_all_next('li')[2].text\
                             +'\n4)'+Employment_after_studies.find_all_next('li')[3].text+'\n5)'+Employment_after_studies.find_all_next('li')[4].text\
                             +'\n6)'+Employment_after_studies.find_all_next('li')[5].text+'\n7)'+Employment_after_studies.find_all_next('li')[6].text

#Residence_Expiry_val
residence_expiry=get_soup('https://www.magdeburg.de/Home/CitizenPortal/Migrants-Refugees/Foreigners-Authority-and-Citizens-Office/index.php?NavID=37.199&object=tx|37.7278.2&La=2&')
Residence_Expiry_val=residence_expiry.find('div',class_='inhalt_text_wide').find_all('h2')[4].findNext('p').text\
                     +"\n"+residence_expiry.find('div',class_='inhalt_text_wide').find_all('h2')[4].findNext('p').findNext('p').text\
                     +"\n"+residence_expiry.find('div',class_='inhalt_text_wide').find_all('h2')[4].findNext('p').findNext('p').findNext('p').text

#Electronic_Residence_Permit_Creditcard
Electronic_residence_permit=get_soup('https://www.magdeburg.de/Home/CitizenPortal/Migrants-Refugees/Foreigners-Authority-and-Citizens-Office/index.php?NavID=37.199&object=tx|37.7286.2&La=2&')
Electronic_Residence_Permit_Creditcard=Electronic_residence_permit.find('div',class_='inhalt_text_wide').find_all('h2')[0].findNext('p').text

#Electronic_Residence_Permit_Apply_when
Electronic_Residence_Permit_Apply_when=Electronic_residence_permit.find('div',class_='inhalt_text_wide').find_all('h2')[1].findNext('li').text\
                                       +'\n'+Electronic_residence_permit.find('div',class_='inhalt_text_wide').find_all('h2')[1].findNext('li').findNext('li').text\
                                       +'\n'+Electronic_residence_permit.find('div',class_='inhalt_text_wide').find_all('h2')[1].findNext('li').findNext('li').findNext('li').text
#Residence_Education_Purpose_val
Residence_education_purpose=get_soup('https://www.magdeburg.de/Home/CitizenPortal/Migrants-Refugees/Foreigners-Authority-and-Citizens-Office/index.php?NavID=37.199&object=tx|37.7279.2&La=2&')
Residence_Education_Purpose_val=Residence_education_purpose.find('div',class_='inhalt_text_wide').find_all('h2')[1].findNext('p').text \
                                +'\n'+Residence_education_purpose.find('div',class_='inhalt_text_wide').find_all('h2')[1].findNext('p').findNext('p').text 
#Visa_Procedure
Visa_Procedure=Residence_education_purpose.find('div',class_='inhalt_text_wide').find_all('h2')[1].find_all_next('p')[0].text\
               +'\n'+Residence_education_purpose.find('div',class_='inhalt_text_wide').find_all('h2')[1].find_all_next('p')[1].text

#Issue_Residence_Permit_val
issue_residence_permit=Residence_education_purpose.find('div',class_='inhalt_text_wide').find_all('h2')[2]
Issue_Residence_Permit_val=issue_residence_permit.findNext('p').text+'\n'+issue_residence_permit.findNext('p').findNext('p').text\
                           +'\n1)'+issue_residence_permit.find_all_next('li')[0].text+'\n2)'+issue_residence_permit.find_all_next('li')[1].text\
                           +'\n3)'+issue_residence_permit.find_all_next('li')[2].text+'\n4)'+issue_residence_permit.find_all_next('li')[3].text\
                           +'\n5)'+issue_residence_permit.find_all_next('li')[4].text+'\n6)'+issue_residence_permit.find_all_next('li')[5].text\
                           +'\n7)'+issue_residence_permit.find_all_next('li')[4].text

#Important_Info_val
important_info=Residence_education_purpose.find('div',class_='inhalt_text_wide').find_all('h2')[3]
Important_Info_val='1)'+important_info.find_all_next('li')[0].text+'\n2)'+important_info.find_all_next('li')[1].text\
                           +'\n3)'+issue_residence_permit.find_all_next('li')[2].text+'\n4)'+issue_residence_permit.find_all_next('li')[3].text\
                           +'\n5)'+issue_residence_permit.find_all_next('li')[4].text+'\n6)'+issue_residence_permit.find_all_next('li')[5].text\
                           +'\n7)'+issue_residence_permit.find_all_next('li')[6].text

#Residence_Permit_Fee
Residence_Permit_Fee=Residence_education_purpose.find('div',class_='inhalt_text_wide').find_all('h2')[4].findNext('p').text\
                     +'\n'+Residence_education_purpose.find('div',class_='inhalt_text_wide').find_all('h2')[4].findNext('p').findNext('p').text\
                     +"\nhttps://www.magdeburg.de/"+Residence_education_purpose.find('div',class_='inhalt_text_wide').find_all('h2')[4].findNext('p').findNext('a')['href']


#Immigration_Law_val                           
immigration_law=get_soup('https://www.uni-magdeburg.de/unimagdeburg/en/International/Incoming+_+Ways+to+the+University/International+Students/Organizing+Your+Stay/Foreigners_+Office-p-54296.html').find('div',id='maincontent').find_all('h3')[1]
immigration_law_val_0=immigration_law.findNext('p').text
print(immigration_law.findNext('p').text)
immigration_law_val_1=immigration_law.findNext('li').text
print(immigration_law_val_1)
immigration_law_val_2=immigration_law.findNext('li').findNext('li').text
print(immigration_law_val_2)
immigration_law_val_3=immigration_law.findNext('li').findNext('li').findNext('li').text
print(immigration_law_val_3)
immigration_law_val_4=immigration_law.find_all_next('p')[3].text
print(immigration_law_val_4)

Immigration_Law_val = {
    "immigration_law_val_0": immigration_law_val_0,
    "immigration_law_val_1": immigration_law_val_1,
    "immigration_law_val_2": immigration_law_val_2,
    "immigration_law_val_3": immigration_law_val_3,
    "immigration_law_val_4": immigration_law_val_4
}

#EuStudentstate & EUGraduatestate
soup6=get_soup('https://www.topuniversities.com/student-info/careers-advice/how-work-germany-during-or-after-your-studies#:~:text=You%20can%20work%20up%20to,negative%20impact%20on%20your%20studies.&text=Non%2DEU%2FEEA%20students%20are,240%20half%20days%20per%20year')
TU = soup6.find('div', class_ = 'block block-layout-builder block-field-blocknodearticlebody').find('h2')
EU_Student=TU.findAllNext('p')[2].text
Non_EU_Student=TU.findAllNext('p')[4].text
EU_Graduate=TU.findNext('h2').findAllNext('p')[2].text
Non_EU_Graduate=TU.findNext('h2').findAllNext('p')[4].text

Student_Graduate = {
    "EU_Student": EU_Student,
    "Non_EU_Student": Non_EU_Student,
    "EU_Graduate": EU_Graduate,
    "Non_EU_Graduate": Non_EU_Graduate,
}



#''' RUN THE FUNCTIONS 
 #   STORE THE SCARPED DATA INTO DIFFERENT 
  #  VARIABLES '''

trams_access = get_accessibility('https://www.magdeburg.de/Home/index.php?NavID=37.199.2&La=2&')
# print(trams_access)
#store TramAccess Documents in firestore
db_trams_access=db.collection('UserData').document('TramAccess').get().to_dict()
if(db_trams_access['Data']!=trams_access) :
    doc_ref=db.collection('UserData').document('TramAccess')
    doc_ref.set({
    'Data':trams_access
    })




address_contact = get_address('https://www.magdeburg.de/Home/index.php?NavID=37.199.2&La=2&')
# print(address_contact)
#store AddressContact Documents in firestore
db_address_contact=db.collection('UserData').document('AddressContact').get().to_dict()
if(db_address_contact['Data']!=address_contact):
    doc_ref=db.collection('UserData').document('AddressContact')
    doc_ref.set({
    'Data':address_contact
     })



opening_hours = opening_hours('https://www.magdeburg.de/Home/index.php?NavID=37.199.2&La=2&')
# print(opening_hours)
#store Opening_hours Documents in firestore
db_opening_hours=db.collection('UserData').document('Opening_hours').get().to_dict()
if(db_opening_hours['Data']!=opening_hours):
    doc_ref=db.collection('UserData').document('Opening_hours')
    doc_ref.set({
    'Data':opening_hours
     })

about_md = about_magdeburg('https://www.magdeburg.de/Home/index.php?NavID=37.199.2&La=2&')
# print(about_md)
#store AboutMgd Documents in firestore
db_about_md=db.collection('UserData').document('AboutMgd').get().to_dict()
if(db_about_md['Data']!=about_md):
    doc_ref=db.collection('UserData').document('AboutMgd')
    doc_ref.set({
    'Data':about_md
     })

checklist_docs = checklist_docs('https://www.magdeburg.de/Home/CitizenPortal/Migrants-Refugees/Foreigners-Authority-and-Citizens'
                      '-Office/index.php?NavID=37.199&object=tx|37.11576.2&La=2&')
# print(checklist_docs)
#store ChecklistDocs Documents in firestore
db_checklist_docs=db.collection('UserData').document('ChecklistDocs').get().to_dict()
if(db_checklist_docs['Data']!=checklist_docs):
    doc_ref=db.collection('UserData').document('ChecklistDocs')
    doc_ref.set({
    'Data':checklist_docs
     })


# print(residencePermitDict)
#store residencePermitDict Documents in firestore
db_residencePermitDict=db.collection('UserData').document('residencePermit').get().to_dict()
if(db_residencePermitDict['GermanCourseRP']!=residencePermitDict['GermanCourseRP'] and db_residencePermitDict['applicableRP']!=residencePermitDict['applicableRP'] and db_residencePermitDict['documentsRP']!=residencePermitDict['documentsRP'] and db_residencePermitDict['applicationFee']!=residencePermitDict['applicationFee'] ):
    doc_ref=db.collection('UserData').document('residencePermit')
    doc_ref.set(residencePermitDict)

# print(Studies_Doctoral_val)
#store Studies_Doctoral_val Documents in firestore
db_Studies_Doctoral_val=db.collection('UserData').document('Studies_Doctoral_val').get().to_dict()
if(db_Studies_Doctoral_val['Data']!=Studies_Doctoral_val):
    doc_ref=db.collection('UserData').document('Studies_Doctoral_val')
    doc_ref.set({
    'Data':Studies_Doctoral_val
     })    


#print(Employment_After_Studies_val)
#store Employment_After_Studies_val Documents in firestore
db_Employment_After_Studies_val=db.collection('UserData').document('Employment_After_Studies_val').get().to_dict()
if(db_Employment_After_Studies_val['Data']!=Employment_After_Studies_val):
    doc_ref=db.collection('UserData').document('Employment_After_Studies_val')
    doc_ref.set({
    'Data':Employment_After_Studies_val
     })
 
#print(Residence_Expiry_val)
#store Employment_After_Studies_val Documents in firestore
db_Residence_Expiry_val=db.collection('UserData').document('Residence_Expiry_val').get().to_dict()
if(db_Residence_Expiry_val['Data']!=Residence_Expiry_val):
    doc_ref=db.collection('UserData').document('Employment_After_Studies_val')
    doc_ref.set({
    'Data':Residence_Expiry_val
     }) 

#print(Electronic_Residence_Permit_Creditcard)
#store Electronic_Residence_Permit_Creditcard Documents in firestore
db_Electronic_Residence_Permit_Creditcard=db.collection('UserData').document('Electronic_Residence_Permit_Creditcard').get().to_dict()
if(db_Electronic_Residence_Permit_Creditcard['Data']!=Electronic_Residence_Permit_Creditcard):
    doc_ref=db.collection('UserData').document('Electronic_Residence_Permit_Creditcard')
    doc_ref.set({
    'Data':Electronic_Residence_Permit_Creditcard
     })     


    





