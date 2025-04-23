const data = require("fs").readFileSync(".gitmodules", "utf8");

const modules = data.toString().match(/(?<=").*?(?="])/g);

module.exports = modules;
