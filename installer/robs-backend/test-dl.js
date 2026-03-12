const path = require('path');
const fs = require('fs');
const { pipeline } = require('stream/promises');

async function downloadSoftware(downloadUrl, destPath, licenseKey, domain) {
    console.log(`DEBUG: Starting streaming download from ${downloadUrl}`);

    const isPostRoute = downloadUrl.includes('/api/download-product');
    const options = isPostRoute ? {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/zip, application/json',
        },
        body: JSON.stringify({
            license_key: licenseKey,
            domain: domain
        })
    } : {
        method: 'GET',
        headers: {
            'Accept': 'application/zip, application/json'
        }
    };

    const response = await fetch(downloadUrl, options);

    if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
        throw new Error('No response body from download server');
    }

    const fileStream = fs.createWriteStream(destPath);
    const { Readable } = require('stream');

    console.log('Download started');
    const reader = response.body.getReader();
    const stream = new ReadableStream({
        start(controller) {
            function push() {
                reader.read().then(({ done, value }) => {
                    if (done) {
                        controller.close();
                        return;
                    }
                    controller.enqueue(value);
                    push();
                }).catch((err) => {
                    controller.error(err);
                });
            }
            push();
        }
    });

    const interval = setInterval(() => {
        console.log('Download progress');
    }, 2000);

    await pipeline(Readable.fromWeb(stream), fileStream);
    clearInterval(interval);

    if (fs.existsSync(destPath)) {
        const stats = fs.statSync(destPath);
        console.log(`Download completed. File size: ${stats.size} bytes`);
    } else {
        throw new Error('Download completed but file is missing from disk!');
    }
}

async function extractSoftware() {
    const zipPath = path.resolve(__dirname, 'downloads', 'project.zip');
    const targetDir = path.resolve(__dirname, 'installed');

    console.log(`DEBUG: Target extraction directory: ${targetDir}`);

    if (!fs.existsSync(zipPath)) {
        throw new Error('Software package (project.zip) not found in downloads directory.');
    }

    const extract = require('extract-zip');

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    console.log('Extraction started');
    await extract(zipPath, { dir: targetDir });
    console.log('Extraction completed');

    const extractedItems = fs.readdirSync(targetDir).filter(item => {
        const fullPath = path.join(targetDir, item);
        return fs.statSync(fullPath).isDirectory();
    });

    let foundRoot = false;
    for (const item of extractedItems) {
        const possibleRoot = path.join(targetDir, item);
        if (fs.existsSync(path.join(possibleRoot, 'package.json'))) {
            foundRoot = true;
            console.log(`DEBUG: Found project root at: ${possibleRoot}`);
            break;
        }
    }

    if (!foundRoot) {
        throw new Error('Extraction failed: Essential project files (package.json) are missing after extraction. Please check your ZIP structure.');
    }
}

async function runTest() {
    try {
        const downloadsDir = path.resolve(__dirname, 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }

        let downloadUrl = 'https://github.com/rohitappsaga-debug/RMS.git';

        // Simulating the URL conversion in controllers.ts
        if (downloadUrl.endsWith('.git')) {
            downloadUrl = downloadUrl.replace(/\.git$/, '/archive/refs/heads/main.zip');
            console.log(`DEBUG: Converted Git URL to ZIP URL: ${downloadUrl}`);
        }

        const destZip = path.join(downloadsDir, 'project.zip');

        await downloadSoftware(downloadUrl, destZip, 'test-license', 'localhost');
        await extractSoftware();

        console.log('✅ TEST PASSED: Download and extraction successful.');
    } catch (err) {
        console.error('❌ TEST FAILED:', err);
    }
}

runTest();
