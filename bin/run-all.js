const libs = require("./modules");
const {execSync} = require("child_process");
const path = require("path");

const command = process.argv.splice(2, process.argv.length).join(" ")

libs.forEach(l => {
    console.log(`running ${command} ${l}`)
    try {
        execSync(command, {
            cwd: path.join(process.cwd(), l),
            env: process.env
        })
    } catch (e){
        process.exit(1)
    }

})
