// ------------------------------------------------------------------
// APP CONFIGURATION
// ------------------------------------------------------------------

module.exports = {
  logging: true,

  intentMap: {
    'Default Fallback Intent': 'Unhandled',
  },
  user: {
    metaData: {
        enabled: true,
    },
  },

  
  db: {
    Firestore: {
      credential: require('./firebase_connection_file.json'),
      databaseURL:'https://digengproject03-296516-default-rtdb.europe-west1.firebasedatabase.app/'
    }
  },
 
};
