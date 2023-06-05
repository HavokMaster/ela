const document = { name: 'admin', userId: '123456', password: '$2b$10$YTKS08yEEB8TCaMdnlDrxukhc8CdeFTkSvLF00DU6Lq2Vlv0wfENm', branch: 'cse', userType: 'admin' }; 
use('ela'); 
const collection = db.getCollection('users'); 
collection.createIndex({ userId: 1 }, { unique: true }); 
const existingUser = collection.findOne({ userId: document.userId }); 
if (!existingUser) { 
  collection.insertOne(document); 
  print('Document inserted successfully'); 
} else { 
  print('Document already exists'); 
} 
