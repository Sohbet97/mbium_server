const fs = require("fs");
const path = require("path");

/**
 * Dynamically loads modules from a directory.
 * @param {string} dir - The directory to scan (usually __dirname).
 * @param {string} suffix - The file extension/suffix to filter by (e.g., ".model.js").
 * @param {Array} args - Arguments to pass to the exported function in each file.
 * @returns {Object} An object containing all loaded modules keyed by their name.
 */
const loadModules = (dir, suffix = ".model.js", args = []) => {
    const modules = {};

    fs.readdirSync(dir)
        .filter((file) => file.endsWith(suffix))
        .forEach((file) => {
            const filePath = path.join(dir, file);
            const loadedModule = require(filePath);

            // Calculate model name (e.g., "user.model.js" -> "user")
            const modelName = file.substring(0, file.indexOf(suffix));

            // If the module exports a function, call it with the provided args
            // Otherwise, just use the exported value
            modules[modelName] = typeof loadedModule === "function" 
                ? loadedModule(...args) 
                : loadedModule;
        });

    return modules;
};

module.exports = loadModules;