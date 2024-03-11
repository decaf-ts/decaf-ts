const libs = require("./modules");
const {execSync} = require("child_process");
const path = require("path");

libs.forEach(l => {
    console.log(`linking .token to ${l}`)
    try {
        execSync(`rimraf .token && ln -s ../.token .token`, {
            cwd: path.join(process.cwd(), l),
            env: process.env
        })
    } catch (e){
        process.exit(1)
    }

})
