import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

async function testExtraction() {
    const testDir = path.join(__dirname, 'test-output');
    const zipPath = path.join(__dirname, 'test.zip');

    if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir);
    }

    try {
        // Create a mock zip
        const zip = new AdmZip();
        zip.addFile('.env', Buffer.from('TEST=true'));
        zip.addLocalFolder(path.join(__dirname, '../src'), 'src');
        zip.writeZip(zipPath);

        console.log('Mock zip created at:', zipPath);

        // Test extraction
        const extractor = new AdmZip(zipPath);
        extractor.extractAllTo(testDir, true);
        console.log('Extraction complete to:', testDir);

        // Verify
        if (fs.existsSync(path.join(testDir, '.env'))) {
            console.log('Verification SUCCESS: .env found');
        } else {
            console.error('Verification FAILED: .env missing');
        }

    } catch (err) {
        console.error('Test failed:', err);
    } finally {
        // Cleanup if needed
        // fs.rmSync(testDir, { recursive: true, force: true });
        // fs.unlinkSync(zipPath);
    }
}

testExtraction();
