const axios = require('axios');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load the environment variables from the .env file
dotenv.config();

const owner = 'Bin-Huang';
const repo = 'chatbox-pro';
const outputDir = './tmp/download';
const token = process.env.GITHUB_TOKEN

// Set up the GitHub API base URL and headers
const githubApiBaseUrl = 'https://api.github.com';


async function downloadRelease() {
    try {
        // Get the latest release
        const { data: release } = await axios.get(
            `${githubApiBaseUrl}/repos/${owner}/${repo}/releases/latest`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        // Create a directory for the latest release
        const releaseDir = path.join(
            outputDir,
            `${release.tag_name}`
        );
        fs.mkdirSync(releaseDir, { recursive: true });

        // Download all assets in the release
        for (const asset of release.assets) {
            console.log(`Downloading ${asset.name}...`);

            console.log(asset);
            const response = await axios.get(asset.url, {
                responseType: 'stream',
                headers: {
                    Accept: 'application/octet-stream',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.status !== 200) {
                throw new Error(
                    `Unexpected response status ${response.status}`
                );
            }

            const filePath = path.join(releaseDir, asset.name);

            // Save the file to the release directory
            const fileStream = fs.createWriteStream(filePath);
            response.data.pipe(fileStream);

            await new Promise((resolve, reject) => {
                fileStream.on('finish', resolve);
                fileStream.on('error', reject);
            });

            console.log(`Downloaded ${asset.name} to ${filePath}`);
        }

        console.log('All assets downloaded successfully.');
    } catch (error) {
        console.error('Error downloading release:', error.message);
    }
}

downloadRelease();
