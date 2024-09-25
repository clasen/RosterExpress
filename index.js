const express = require('express');
const vhost = require('vhost');
const fs = require('fs');
const path = require('path');
const Greenlock = require('greenlock-express');

class Roster {
    constructor(options = {}) {
        this.maintainerEmail = options.maintainerEmail || 'admin@example.com';
        this.wwwPath = options.wwwPath || path.join(__dirname, '..', '..', '..', 'www');
        this.greenlockConfigDir = options.greenlockConfigDir || path.join(__dirname, 'greenlock.d');
        this.staging = options.staging || false; // Set to true for testing
        this.domains = [];
        this.sites = {};
        this.app = express();
    }

    // Function to dynamically load domain applications
    loadSites() {
        fs.readdirSync(this.wwwPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .forEach((dirent) => {
                const domain = dirent.name;
                const domainPath = path.join(this.wwwPath, domain);
                const indexPath = path.join(domainPath, 'index.js');

                if (fs.existsSync(indexPath)) {
                    // Require the index.js file of each domain (the Express app for the domain)
                    const siteApp = require(indexPath);

                    // Add the main domain and 'www' subdomain by default
                    const domainEntries = [domain, `www.${domain}`];
                    this.domains.push(...domainEntries);
                    domainEntries.forEach(d => {
                        this.sites[d] = siteApp;
                    });

                    console.log(`✅ Loaded site: ${domain}`);
                } else {
                    console.warn(`⚠️ index.js not found in ${domainPath}`);
                }
            });
    }

    generateConfigJson() {
        const configDir = this.greenlockConfigDir;
        const configPath = path.join(configDir, 'config.json');

        // Create the directory if it does not exist
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }

        const sitesConfig = [];
        const uniqueDomains = new Set();

        this.domains.forEach(domain => {
            const rootDomain = domain.replace(/^www\./, '');
            uniqueDomains.add(rootDomain);
        });

        // Read the existing config.json if it exists
        let existingConfig = {};
        if (fs.existsSync(configPath)) {
            // Read the current content
            const currentConfigContent = fs.readFileSync(configPath, 'utf8');
            existingConfig = JSON.parse(currentConfigContent);
        }

        uniqueDomains.forEach(domain => {
            const altnames = [domain];
            if ((domain.match(/\./g) || []).length < 2) {
                altnames.push(`www.${domain}`);
            }

            // Find the existing site to preserve renewAt
            let existingSite = null;
            if (existingConfig.sites) {
                existingSite = existingConfig.sites.find(site => site.subject === domain);
            }

            const siteConfig = {
                subject: domain,
                altnames: altnames
            };

            // Preserve renewAt if it exists
            if (existingSite && existingSite.renewAt) {
                siteConfig.renewAt = existingSite.renewAt;
            }

            sitesConfig.push(siteConfig);
        });

        const newConfig = {
            defaults: {
                store: {
                    module: "greenlock-store-fs",
                    basePath: this.greenlockConfigDir
                },
                challenges: {
                    "http-01": {
                        module: "acme-http-01-standalone"
                    }
                },
                renewOffset: "-45d",
                renewStagger: "3d",
                accountKeyType: "EC-P256",
                serverKeyType: "RSA-2048",
                subscriberEmail: this.maintainerEmail
            },
            sites: sitesConfig
        };

        // Check if config.json already exists and compare
        if (fs.existsSync(configPath)) {
            // Read the current content
            const currentConfigContent = fs.readFileSync(configPath, 'utf8');
            const currentConfig = JSON.parse(currentConfigContent);

            // Compare the entire configurations
            const newConfigContent = JSON.stringify(newConfig, null, 2);
            const currentConfigContentFormatted = JSON.stringify(currentConfig, null, 2);

            if (newConfigContent === currentConfigContentFormatted) {
                console.log('ℹ️ Configuration has not changed. config.json will not be overwritten.');
                return; // Exit the function without overwriting
            } else {
                console.log('🔄 Configuration has changed. config.json will be updated.');
            }
        } else {
            console.log('🆕 config.json does not exist. A new one will be created.');
        }

        // Write the new config.json
        fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2));
        console.log(`📁 config.json generated at ${configPath}`);
    }

    configureRedirects() {
        this.app.use((req, res, next) => {
            if (req.headers.host.startsWith('www.')) {
                const newHost = req.headers.host.slice(4);
                return res.redirect(301, `https://${newHost}${req.originalUrl}`);
            }
            next();
        });
    }

    configureVHosts() {
        Object.keys(this.sites).forEach(domain => {
            const siteApp = this.sites[domain];
            this.app.use(vhost(domain, siteApp));
        });
    }

    initGreenlock() {
        const greenlock = Greenlock.init({
            packageRoot: __dirname,
            configDir: this.greenlockConfigDir,
            maintainerEmail: this.maintainerEmail,
            cluster: false,
            staging: this.staging, // Set to true for testing, false for production
            manager: { module: "@greenlock/manager" },
            // Function to approve domains and subdomains dynamically
            approveDomains: (opts, certs, cb) => {
                // If certs is defined, we already have a certificate and are renewing it
                if (certs) {
                    opts.domains = certs.altnames;
                } else {
                    // If it's a new request, verify if the domain is in our list
                    if (this.domains.includes(opts.domain)) {
                        opts.email = this.maintainerEmail;
                        opts.agreeTos = true;
                        opts.domains = [opts.domain];
                    } else {
                        console.warn(`⚠️ Domain not approved: ${opts.domain}`);
                        return cb(new Error(`Domain not approved: ${opts.domain}`));
                    }
                }
                cb(null, { options: opts, certs });
            }
        });

        greenlock.serve(this.app);
    }

    start() {
        this.loadSites();
        this.generateConfigJson();
        this.configureRedirects(); // Add this line to configure redirects
        this.configureVHosts();
        this.initGreenlock();
    }
}

module.exports = Roster;