mkdir uploads
cd uploads
mkdir notes
mkdir question-paper
mkdir question-bank
mkdir mocktest
cd ..
call npm install

@echo off

REM Define the MongoDB connection details
set mongo_host=localhost
set mongo_port=27017
set database_name=ela

REM Create the JavaScript code file
echo const document = { name: 'admin', userId: '123456', password: '$2b$10$YTKS08yEEB8TCaMdnlDrxukhc8CdeFTkSvLF00DU6Lq2Vlv0wfENm', branch: 'cse', userType: 'admin' }; > insert.js
echo use('%database_name%'); >> insert.js
echo const collection = db.getCollection('users'); >> insert.js
echo collection.createIndex({ userId: 1 }, { unique: true }); >> insert.js
echo const existingUser = collection.findOne({ userId: document.userId }); >> insert.js
echo if (!existingUser) { >> insert.js
echo   collection.insertOne(document); >> insert.js
echo   print('Document inserted successfully'); >> insert.js
echo } else { >> insert.js
echo   print('Document already exists'); >> insert.js
echo } >> insert.js

REM Execute the MongoDB script using mongosh
mongosh --host %mongo_host%:%mongo_port% --shell insert.js

REM Delete the JavaScript code file
del insert.js

REM Pause the script to view the output (optional)
pause
