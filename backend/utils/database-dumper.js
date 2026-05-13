const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to generate the filename based on the current date and time
const generateFilename = () => {
    const date = new Date();
    const timestamp = date.toISOString().replace(/[:.-]/g, '_');
    return `db_backup_${timestamp}.sql`;
};

const dumpDatabase = async () => {
    // Database connection details - you can also fetch these from your Sequelize config
    const dbName = 'fiz2';
    const username = 'postgres';
    const host = 'localhost'; // e.g., localhost
    const port = '5432'; // e.g., 5432

    // Path for the dump file
    const workDir = path.join(__dirname, 'backups')
    const filename = path.join(__dirname, 'backups', generateFilename());

    if(!fs.existsSync(workDir)) fs.mkdirSync(workDir, {recursive:true})
    
    // Construct the pg_dump command
    const dumpCommand = `PGPASSWORD=5050 pg_dump -U ${username} -h ${host} -p ${port} ${dbName} > ${filename}`;

    exec(dumpCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error creating dump: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Database dump created successfully at ${filename}`);
    });
};

dumpDatabase()

module.exports = dumpDatabase;
