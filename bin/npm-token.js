const libs = require("./modules");
const {execSync} = require("child_process");
const path = require("path");

libs.forEach(l => {
    try {
        console.log(`linking .token to ${l}`)
        execSync(`rimraf .token && ln -s ../.token .token`, {
            cwd: path.join(process.cwd(), l),
            env: process.env
        })
        console.log(`linking .npmtoken to ${l}`)
        execSync(`rimraf .npmtoken && ln -s ../.npmtoken .npmtoken`, {
            cwd: path.join(process.cwd(), l),
            env: process.env
        })
    } catch (e){
        process.exit(1)
    }

})
