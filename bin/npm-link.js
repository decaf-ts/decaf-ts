const libs = require("./modules");
const {execSync} = require("child_process");
const path = require("path");
const fs = require("fs");

let operation = process.argv.find(a => a.startsWith("--"));
operation = operation ? operation.substring(2, operation.length) : "link"

if (operation === "link"){
    try {
        const exists = fs.statSync(path.join(process.cwd(), "web-components/dist"))
    } catch (e){
        fs.mkdirSync("web-components/dist/aeon-web-components", {recursive: true})
    }

    libs.forEach(l => {
        const iterations = l.includes("control-panel") ? [`${l}/frontend`, `${l}/backend`] : [l]
        iterations.forEach(l => {
            const pkg = require(path.join(process.cwd(), l, "package.json"))
            const dependencies = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})].filter(d => d.startsWith("@aeon/"));
            dependencies.forEach(d => {
                try {

                    let pathToRemove = `node_modules/${d}`
                    let linkRel = `../../../${l.includes("control-panel") ? "../" : ""}`
                    let name = d.split("/")[1]
                    let linkPath = name === "web-components" ? `${name}/dist/aeon-web-components` : name;
                    let linkName = name;
                    let cwd = path.join(process.cwd(), l, "node_modules/@aeon")

                    if (l.includes("control-panel/backend")){
                        let p;
                        if (d.includes("fabric-integration")){
                            p = path.join(l, pathToRemove, "build")
                            try {
                                fs.statSync(p);
                            } catch (e) {
                                fs.mkdirSync(p)
                            }
                            pathToRemove = `node_modules/${d}/build`;
                            linkName = "build";
                        } else {
                            p = path.join(l, pathToRemove, "lib")
                            try {
                                fs.statSync(p);
                            } catch (e) {
                                fs.mkdirSync(p)
                            }
                            pathToRemove = `node_modules/${d}/lib`;
                            linkName = "lib";
                        }
                        linkRel = path.join(linkRel, "../")
                        name = d.split("/")[1]
                        linkPath = name + "/" + linkName;
                        cwd = path.join(process.cwd(), l, "node_modules/@aeon", name)
                    }

                    console.log(`${operation}ing ${d} as a dependency of ${l}`)
                    execSync(`rm -rf ${pathToRemove}`, {
                        cwd: path.join(process.cwd(), l),
                        env: process.env
                    })
                    execSync(`ln -s ${linkRel}${linkPath} ${linkName}`, {
                        cwd: cwd,
                        env: process.env
                    })
                } catch (e){
                    process.exit(1)
                }

            })
        })
    })
} else if (operation === "unlink"){
    libs.forEach(l => {
        const iterations = l.includes("control-panel") ? [`${l}/frontend`, `${l}/backend`] : [l]
        iterations.forEach(l => {
            const pkg = require(path.join(process.cwd(), l, "package.json"))
            const dependencies = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})].filter(d => d.startsWith("@aeon/"));
            dependencies.forEach(d => {
                console.log(`${operation}ing ${d} as a dependency of ${l}`)
                try {
                    execSync(`rm -rf  node_modules/@aeon/${d}`, {
                        cwd: path.join(process.cwd(), l),
                        env: process.env
                    })
                } catch (e){
                    process.exit(1)
                }
            })
            try {
                execSync(`npm install`, {
                    cwd: path.join(process.cwd(), l),
                    env: process.env
                })
            } catch (e){
                process.exit(1)
            }
        })
    })
} else {
    libs.forEach(l => {
        console.log(`${operation}ing ${l}`)
        try {
            execSync(`npm ${operation}`, {
                cwd: path.join(process.cwd(), l),
                env: process.env
            })
        } catch (e){
            process.exit(1)
        }

    })
}

