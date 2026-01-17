const fs = require('fs');
const path = require('path');

const WORK_DIR = path.join(__dirname, '../content/work');

function fixDates() {
    if (!fs.existsSync(WORK_DIR)) {
        console.error(`Directory not found: ${WORK_DIR}`);
        return;
    }

    const projects = fs.readdirSync(WORK_DIR).filter(f => fs.statSync(path.join(WORK_DIR, f)).isDirectory());

    projects.forEach(project => {
        const projectDir = path.join(WORK_DIR, project);
        const files = fs.readdirSync(projectDir).filter(f => f.endsWith('.md'));

        files.forEach(file => {
            const filePath = path.join(projectDir, file);
            let content = fs.readFileSync(filePath, 'utf8');

            if (content.includes('date: undefined')) {
                console.log(`Fixing ${project}/${file}...`);

                // Create regex to find date in the body (ARCHIVE_DATA section usually)
                const dateMatch = content.match(/date: (\d{4}-\d{2}-\d{2})/);

                let newDate = '2024-01-01'; // Default fallback
                if (dateMatch) {
                    newDate = dateMatch[1];
                    console.log(`  Found date in content: ${newDate}`);
                } else {
                    console.log(`  No date found in content, using default: ${newDate}`);
                }

                // Replace date: undefined with the found date
                content = content.replace('date: undefined', `date: ${newDate}`);
                fs.writeFileSync(filePath, content);
            }
        });
    });

    console.log('Date fix complete.');
}

fixDates();
