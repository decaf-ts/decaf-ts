import gulp from "gulp";
const {src, dest, parallel, series} = gulp;
import replace from "gulp-replace";
import run from "gulp-run-command";
import pkg from './package.json' assert {type: "json"}

let {name, version, type} = pkg

if (name.includes("/"))
    name = name.split("/")[1] // for scoped packages
const VERSION_STRING = "##VERSION##"

function patchFiles(isDev) {
    return function patchFile() {

        const doPatch = (basePath) => {
            const jsFiles = [`${basePath}/**/*.js`]
            return src(jsFiles)
                .pipe(replace(VERSION_STRING, `${version}`))
                .pipe(dest(`${basePath}/`))
        }

        if (!isDev)
            return doPatch("dist")
        return doPatch("lib");
    }
}

function makeDocs() {
    const copyFiles = (source, destination) => {
        return function copyFiles() {
            try {
                return src(source + "/**/*", {base: source}).pipe(dest(destination));
            } catch (e) {
                throw e
            }
        }
    }

    function compileReadme() {
        return run.default("npx markdown-include ./mdCompile.json")()
    }

    function compileDocs() {
        return run.default("npx jsdoc -c jsdocs.json -t ./node_modules/better-docs")()
    }

    return series(
        compileReadme,
        compileDocs,
        parallel(...[
            {
                src: "workdocs/assets",
                dest: "./docs/workdocs/assets"
            },
            {
                src: "workdocs/coverage",
                dest: "./docs/workdocs/coverage"
            },
            {
                src: "workdocs/badges",
                dest: "./docs/workdocs/badges"
            },
            {
                src: "workdocs/resources",
                dest: "./docs/workdocs/resources"
            }
        ].map(e => copyFiles(e.src, e.dest)))
    )
}

export const docs = makeDocs()