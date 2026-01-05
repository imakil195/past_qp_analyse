const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function checkConnection() {
    let uri = 'mongodb://localhost:27017/exam-ace';

    // Try to read .env.local manually since we don't have dotenv installed/setup in this script
    try {
        const envPath = path.join(__dirname, '.env.local');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const match = envContent.match(/MONGODB_URI=(.+)/);
            if (match && match[1]) {
                uri = match[1].trim();
                console.log('Found URI in .env.local');
            }
        }
    } catch (e) {
        console.log('Could not read .env.local, using default URI');
    }

    console.log('Testing connection to:', uri.replace(/:([^:@]{1,})@/, ':****@')); // Hide password in logs

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log('✅ MongoDB Connected Successfully!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        process.exit(1);
    }
}

checkConnection();
