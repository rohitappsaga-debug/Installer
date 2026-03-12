const fs = require('fs');
const path = require('path');

// Mock fetch if not available (Node < 18)
if (typeof fetch === 'undefined') {
    console.log('Node version < 18, fetch not globally available. Using primitive mock for verification script logic.');
}

async function testDownloadProxy() {
    const licenseKey = 'TEST_LICENSE_KEY';
    const domain = 'localhost';
    const proxyUrl = 'http://127.0.0.1:8000/api/download-rms';
    const destZip = path.join(__dirname, 'test-project.zip');

    console.log(`Testing proxy download from ${proxyUrl}...`);

    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/zip, application/json',
            },
            body: JSON.stringify({
                license_key: licenseKey,
                domain: domain
            })
        });

        if (!response.ok) {
            console.error(`Download failed: ${response.status} ${response.statusText}`);
            const data = await response.json();
            console.error('Error detail:', data);
            return;
        }

        console.log('Download response OK. Streaming to file...');
        const fileStream = fs.createWriteStream(destZip);

        // This is a simplified version of the logic in controllers.ts
        const { Readable } = require('stream');
        const { pipeline } = require('stream/promises');

        await pipeline(Readable.fromWeb(response.body), fileStream);

        const stats = fs.statSync(destZip);
        console.log(`Download complete! Size: ${stats.size} bytes`);

        if (stats.size > 1000) {
            console.log('Verification SUCCESS: ZIP file received.');
        } else {
            console.log('Verification FAILED: ZIP file too small, probably contains error JSON.');
            const content = fs.readFileSync(destZip, 'utf8');
            console.log('Content:', content);
        }

    } catch (err) {
        console.error('Test failed with error:', err.message);
        console.log('\nNote: Make sure the Product-Manager server is running on port 8000 and GITHUB_TOKEN is set.');
    } finally {
        if (fs.existsSync(destZip)) {
            // fs.unlinkSync(destZip);
        }
    }
}

testDownloadProxy();
