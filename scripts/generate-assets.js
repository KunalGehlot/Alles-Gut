const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Paths adapted to the new location in packages/assets
const SOURCE_DIR = path.join(__dirname, '../packages/assets');
const DEST_DIR = path.join(__dirname, '../apps/mobile/assets');

const conversions = [
    {
        src: 'alles-gut-appicon-light.svg',
        dest: 'icon.png',
        width: 1024,
        height: 1024,
        flatten: { background: '#ffffff' }
    },
    {
        src: 'alles-gut-mark.svg',
        dest: 'splash-icon.png',
        width: 1024,
        height: 1024,
        fit: 'contain',
        background: '#FFFFFF'
    },
    {
        src: 'alles-gut-mark.svg',
        dest: 'adaptive-icon.png',
        width: 1024,
        height: 1024,
        fit: 'contain',
        background: '#FFFFFF'
    },
    {
        src: 'alles-gut-mark-mono-dark.svg',
        dest: 'notification-icon.png',
        width: 96,
        height: 96,
        toFormat: 'png'
    }
];

async function run() {
    if (!fs.existsSync(SOURCE_DIR)) {
        console.error(`Source directory not found: ${SOURCE_DIR}`);
        process.exit(1);
    }

    for (const task of conversions) {
        const srcPath = path.join(SOURCE_DIR, task.src);
        const destPath = path.join(DEST_DIR, task.dest);

        console.log(`Converting ${task.src} to ${task.dest}...`);

        try {
            let pipeline = sharp(srcPath);

            if (task.width || task.height) {
                pipeline = pipeline.resize(task.width, task.height, {
                    fit: task.fit || 'cover',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                });
            }

            if (task.flatten) {
                pipeline = pipeline.flatten(task.flatten);
            }

            await pipeline.toFile(destPath);
            console.log(`Done: ${destPath}`);
        } catch (err) {
            console.error(`Error converting ${task.src}:`, err);
        }
    }
}

run();
