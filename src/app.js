'use strict';

const { App } = require('jovo-framework');
const { GoogleAssistant } = require('jovo-platform-googleassistant');
const { Dialogflow, Slack } = require('jovo-platform-dialogflow');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { Firestore } = require('jovo-db-firestore');

//firestore connection for db object 
const admin = require("firebase-admin");
const serviceAccount = require('./firebase_connection_file.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://digengproject03-296516-default-rtdb.europe-west1.firebasedatabase.app/'
});

const db = admin.firestore();

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const app = new App();

// prettier-ignore
app.use(
  new GoogleAssistant(),
  new Dialogflow().use(new Slack()),
  new JovoDebugger(),
  new Firestore({}, db),
  //new uuid()
);

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
  LAUNCH() {
    return this.toIntent('HelloWorldIntent');
  },
  Unhandled() {
    return this.ask("Sorry i did not understand you. Can you please rephrase your question? ", "I don't know what to do. Please rephrase your question");
  },

  async HelloWorldIntent() {

    const userId = this.$user.getId();
    const name_val = await test('UserID', userId);
    if (name_val) {
      this.tell('Hello ' + name_val.name + '!' + ' Welcome back, How can I help you today?')
    } 
    else{
      this.followUpState('NameState').ask("Hello, My name is Otto! :robot_face: I'm your chat assistant for the Foreigner's office (Ausländerbehörde). I can help you resolve queries regarding the residence permit, visa extension, work permit, immigration information and the documents required for submitting an application"+"\n \n Before that I'd like to know a few details about you. Could you please tell me your name?");  
    }
  

  },

  async UpdateIntent() {
    const FieldValue = admin.firestore.FieldValue;
    const userId = this.$user.getId();
    const get_name = db.collection('UserID').doc(userId);
    var change = await this.getInput('pic').value;
    console.log(change);
    change=change.toUpperCase();
    if (change == "USERNAME"|| change == "USER NAME" || change == "MY NAME") {
      // Remove the 'name' field from the document
      const res = await get_name.update({
        name: FieldValue.delete()
      });
      this.followUpState('NameState').ask("Please provide your name to be updated")
      // this.followUpState('RPApplystate').ask("Is this your first time issuance?");
    }
    else if (change === "CATEGORY" || change === "MY CATEGORY" || change ==="THE CATEGORY") {
      //this.tell("change my category");
      this.toStateIntent('State', 'CheckforUserStatusIntent');
    }
    else {
      this.tell('Could you please specify if you want to update your username or category');
    }
  },

  DeleteIntent(){
      this.followUpState('DeleteState').ask("Are you sure you would like to delete the user data that is stored?")
  },

  DeleteState:{
    Unhandled(){
    this.ask("Warning! Please confirm yes or no to delete your data.")
    },
    async YesIntent() {
      const userId = this.$user.getId();
      const res = await db.collection('UserID').doc(userId).delete();
      this.tell("Your data has been deleted. Please type hi to start the conversation or bye to end it.");
   this.removeState();
    },
    NoIntent() {
      this.tell("Alright, Please proceed to ask any questions or type bye to end the conversation");
      this.removeState();
    }
  },
  

  NameState:{
 Unhandled() {
      this.tell("Could you please provide your name before we proceed?")
    },
  async MyNameIsIntent() {
    const userId = this.$user.getId();
    const name_val = this.$inputs.name.value;
    let test_val = await test('UserID', userId);
      if (!test_val) {
      await db.collection('UserID').doc(userId).set(
        {
          'name': name_val
        }, { merge: true });
      test_val = await test('UserID', userId);
       return this.toStateIntent('State', 'CheckforUserStatusIntent');
    }
    else if (test_val.name == undefined){
      await db.collection('UserID').doc(userId).set(
      {
        'name': name_val
      }, { merge: true });
    test_val = await test('UserID', userId);
    this.tell ("Hello " + test_val.name+ ", Your username has been updated! Kindly proceed to ask your question")
    this.removeState();
    }
   else {
      this.followUpState('State').ask('Hey ' + test_val.name + ', Welcome back, How can I help you today?');
    }
   

  }
  },
  State: {
    
   async  CheckforUserStatusIntent() {
      const userId = this.$user.getId();
      let test_val = await test('UserID', userId);
      let speech = 'Hey '+test_val.name+', Could you please choose category that you belong to :\n a) EU Student' + '\n' + 'b) EU Graduate' + '\n' + 'c) Non-EU Student' + '\n' + 'd) Non-EU Graduate';
      let reprompt = 'Please type a, b, c or d';
      this.followUpState('State.CategoryState').ask(speech, reprompt);
      
    },
    CategoryState: {
      Unhandled() {
        this.tell("I'm sorry, I didn't get that. Could you please type a, b, c, or d.")
      },
      async StatusIntent() {
        var category = await this.getInput('plugin').value;
        category = category.toUpperCase();
        const userId = this.$user.getId();
        if (category === "EU STUDENT" || category === "EU STUD" || category === "A") {
          await db.collection('UserID').doc(userId).set(
            {
              'status': 'Student',
              'Region': 'EU'
            }, { merge: true });
        }
        else if (category === "EU GRADUATE" || category === "EU GRAD" || category === "B") {
          await db.collection('UserID').doc(userId).set(
            {
              'status': 'Graduate',
              'Region': 'EU'
            }, { merge: true });
        }
        else if (category === "NON-EU STUDENT" || category === "NON EU STUDENT" || category === "NON EU STUD" || category === "C") {
          await db.collection('UserID').doc(userId).set(
            {
              'status': 'Student',
              'Region': 'Non-EU'
            }, { merge: true });
        }
        else if (category === "NON-EU GRADUATE" || category === "NON EU GRADUATE" || category === "NON EU GRAD" || category === "D") {
          await db.collection('UserID').doc(userId).set(
            {
              'status': 'Graduate',
              'Region': 'Non-EU'
            }, { merge: true });
        }

        var check_val = await test('UserID', userId);
        if (typeof check_val.Region == 'undefined') {
          this.toStateIntent('State', 'CheckforUserStatusIntent');

        }
        if (typeof check_val.Region != 'undefined') {
          this.tell("Thanks for providing us the information. Please let me know what can I do for you ?");
          this.removeState();
        }
      }
    },
  },
  async WorkPermitIntent() {
    let userId = this.$user.getId();
    let status = await test('UserID', userId);
    let work_permit = await test('UserData', 'Student_Graduate');

    if (status.status === "Student" && status.Region === "EU") {
      this.followUpState('ConfirmState').ask(work_permit.EU_Student + ' Students can earn up to €450 (~US$491) per month tax-free. For more information about this please contact the Foreigners\' Office.'+'\n \n Do you have any futher questions?');
    }
    else if (status.status === "Graduate" && status.Region === "EU") {
      this.followUpState('ConfirmState').ask(work_permit.EU_Graduate)+' For more information about this please contact the Foreigners\' Office.'+'\n \n Do you have any futher questions?';
    }
    else if (status.status === "Student" && status.Region === "Non-EU") {
      this.followUpState('ConfirmState').ask(work_permit.Non_EU_Student +' Students can earn up to €450 (~US$491) per month tax-free.'+ ' For more information about this please contact the Foreigners\' Office.'+'\n \n Do you have any futher questions?');
    }
    else if (status.status === "Graduate" && status.Region === "Non-EU") {
      this.followUpState('ConfirmState').ask(work_permit.Non_EU_Graduate+' For more information about this please contact the Foreigners\' Office.'+'\n \n Do you have any futher questions?');
    }
  },


  
  async OfficeHoursIntent() {
    const hrs = await test('UserData', 'Opening_hours');

    this.tell(hrs.Data);
  },

  async TramAccess() {
    const trm = await test('UserData', 'TramAccess');
    this.tell(trm.Data);
  },
  DocumentIntent() {
    let speech = 'Is it going to be your first issuance of residence?';
    this.ask(speech);
    this.followUpState('DocumentState');
  },
  DocumentState: {
    Unhandled() {
      this.ask('Kindly confirm yes or no');

    },
    async NoIntent() {
      let userId = this.$user.getId();
      let doc_status = await test('UserID', userId);
      if (doc_status.status === "Student") {
        let doc_val = await test('UserData', 'Studies_Doctoral_val');
        this.tell('Since you are a student, The documents required for extension of residence permit are as follows.\n' + doc_val.Data +'\n \n Please type \'links\' to take an appointment or to get the application forms.');
      }
      else if (doc_status.status === "Graduate") {
        let doc_val = await test('UserData', 'Employment_After_Studies_val');
        this.tell('Since you are a graduate, The documents required for extension of residence permit are as follows.\n' + doc_val.Data +'\n \n Please type \'links\' to take an appointment or to get the application forms.');
      }
      this.removeState();

    },
    //first issuance of residence permit//
    async YesIntent() {
    let doc_val = await test('UserData', 'Issue_Residence_Permit_val');
      let speech = doc_val.Data;
      this.tell(speech + '\n \n Please type \'links\' to take an appointment or to get the application forms.');
      this.removeState();
    }
  },

  async ImmigrationIntent() {
    const immigration = await test('UserData', 'Immigration_Law_val');
    let userId = this.$user.getId();
    let immigration_status = await test('UserID', userId);
    let speech = immigration.Data.immigration_law_val_0;
    if (immigration_status.Region === "EU") {
      speech = speech + " For the " + immigration.Data.immigration_law_val_1 + " when you register in the residents’ registration office, you " + "will be given a form in which you must enter certain data about yourself. This must be completed and returned to the foreigners’ office with a copy of your certificate of enrolment." +'\n \n Do you have any futher questions?';
    }
    else if (immigration_status.Region === "Non-EU") {
      speech = speech + " Since you are from the Non European Union, you" + " must apply for a study residence permit from the foreigners’ office in your place of residence within the validity period of your visa."+'\n \n Do you have any futher questions?'
    }
    this.followUpState('ConfirmState').tell(speech);
  },

  async ResidencePermitIntent() {
    var rp = await this.getInput('rp').value;
    rp=rp.toUpperCase();

    if (rp === "APPLY" || rp === "ISSUANCE") {
      this.followUpState('RPApplystate').ask("Is this your first time issuance?");
    }
    else if (rp === "RENEW" || rp === "EXPIRE") {
      this.followUpState('RPRenewState').ask("Are you planing to travel outside germany?");

    }
    else if (rp === "LOST") {
      let speech = 'Inform the Office about the loss of your eAT (in writing, by e-mail, phone or personally). If the electronic identity function was activated in your eAT, have it blocked. This is to protect you and to prevent any misuse of your data. Please type contact to reach out to the foreigners\' office to report the issue';
      this.tell(speech);
    }
    else {
      this.tell('Could you please specify if you want to apply/renew your residence permit');
    }
  },

  RPApplystate: {
    Unhandled() {
      this.ask('Kindly confirm yes or no');
    },

    NoIntent() {

      this.followUpState('RPApplystate.RPrenewdocstate1').ask('If your (temporary) residence title is about to expire – the application for a residence permit must be submitted at least four weeks prior to the expiration date.\n Would you like to know the documents required for the renewal process?');
    },
    RPrenewdocstate1:
    {
      async YesIntent() {
        let userId = this.$user.getId();
        let doc_status = await test('UserID', userId);
        if (doc_status.status === "Student") {
          let doc_val = await test('UserData', 'Studies_Doctoral_val');
          this.tell('Since you are a student, The Documents required for extension of residence permit are as follows.\n' + doc_val.Data+'\n \n Please type \'links\' to take an appointment or to get the application forms.');
          this.removeState();
        }
        else if (doc_status.status === "Graduate") {
          let doc_val = await test('UserData', 'Employment_After_Studies_val');
          this.tell('Since you are a graduate, The Documents required for extension of residence permit are as follows.\n' + doc_val.Data+'\n \n Please type \'links\' to take an appointment or to get the application forms.');
          this.removeState();
        }

      },
      NoIntent() { 
        this.tell('Alright, Please type your query for any further assistance or type bye to end the conversation.');
        this.removeState();
      }
    },

    async YesIntent() {
      let RPApply_val = await test('UserData', 'Issue_Residence_Permit_val_1');
      this.followUpState('RPApplystate.RPApplydocstate').ask(RPApply_val.Data.substr(0, 161) + "\n Would you like to know the documents required for the application?");
    },
    RPApplydocstate:
    {
      YesIntent() {
        this.toStateIntent('DocumentState', 'YesIntent');
        this.removeState();

      },
      NoIntent() {
        this.tell('Alright, Please type your query for any further assistance or type bye to end the conversation.');
        this.removeState();
      }
    },


  },
  RPRenewState:
  {
    Unhandled() {
      this.ask('Kindly confirm yes or no');
    },
    NoIntent() {
      this.followUpState('RPRenewState.RPrenewdocstate').ask('If your (temporary) residence title is about to expire – the application for a residence permit must be submitted at least four weeks prior to the expiration date.\n Would you like to know the documents required for the renewal process?');
    },
    async YesIntent() {
      let RPRenewState_val = await test('UserData', 'Residence_Expiry_val');
      this.followUpState('RPRenewState.RPrenewdocstate').ask(RPRenewState_val.Residence_Expiry_val_1 + '\n Would you like to know the documents required for the renewal process? ');
    },
    RPrenewdocstate:
    {
      async YesIntent() {
        let userId = this.$user.getId();
        let doc_status = await test('UserID', userId);
        console.log("here")
        if (doc_status.status === "Student") {
          let doc_val = await test('UserData', 'Studies_Doctoral_val');
          this.tell('Since you are a student, The Documents required for extension of residence permit are as follows.\n' + doc_val.Data+'\n \n Please type \'links\' to take an appointment or to get the application forms.');
          this.removeState();
        }
        else if (doc_status.status === "Graduate") {
          let doc_val = await test('UserData', 'Employment_After_Studies_val');
          this.tell('Since you are a graduate, The Documents required for extension of residence permit are as follows.\n' + doc_val.Data+'\n \n Please type \'links\' to take an appointment or to get the application forms.');
          this.removeState();
        }

      },
      NoIntent() {
        this.tell('Alright, Please type your query for any further assistance or type bye to end the conversation.');
        this.removeState();
      }
    },
  },

  

  async BlueCardIntent() {
     let blue_val = await test('UserData', 'Regular_Data');
    //let blue_val=this.$request.originalDetectIntentRequest.payload;
    //console.log(blue_val);
    this.followUpState('ConfirmState').ask(blue_val.Data.Blue_card+' For more information about this please contact the Foreigners\' Office.'+'\n \n Do you have any futher questions?');
    //this.tell(blue_val);
  },

  QuestionIntent(){
    this.tell("I'm always here to assist you. What queries do you have?")
  },

  ThankYouIntent(){
    this.followUpState('ConfirmState').tell("Alright, Is there anything else I can help you with?")
  },

  ConfirmState: {
    YesIntent() {
      this.tell("What queries do you have?");
    },
    NoIntent() {
      this.tell("Alright, Please type bye to end the conversation");
    }
  },
  
});


module.exports = { app };

// ------------------------------------------------------------------
// HELPER FUNCTIONS 
// ------------------------------------------------------------------

function urlify(text) {
  var urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  //var urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, function (url, b, c) {
    var url2 = (c == 'www.') ? 'http://' + url : url;
    return '<a href="' + url2 + '" target="_blank">' + url + '</a>';
  })
}

function emailLink() {
  var str = "Free Web Building Tutorials!";
  var result = str.link("https://www.w3schools.com");
  return result
}

async function test(collection, document) {
  const doc = await db.collection(collection).doc(document).get();
  if (!doc.exists) {
    console.log('No such document!');
  } else {
    console.log('Document data:', doc.data());
    return doc.data();
  }
}


