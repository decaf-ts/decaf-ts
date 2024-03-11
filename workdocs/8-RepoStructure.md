### Repository Structure

```
decaf-ts
│
│   .gitignore              <-- Defines files ignored to git
│   gulpfile.js             <-- Gulp build scripts. used for building na other features (eg docs)
│   jest.config.ts          <-- Tests Configuration file
│   mdCompile.json          <-- md Documentation generation configuration file
│   jsdocs.json             <-- jsdoc Documentation generation configuration file
│   LICENCE.md              <-- Licence disclamer
│   package.json
│   package-lock.json
│   README.md               <-- Readme File dynamically compiled from 'workdocs' via the 'docs' npm script
│
└───bin
│   │   tag_release.sh      <-- Script to help with releases
│   
└───docs
│   │   ...                 <-- Dinamically generated folder, containing the compiled documentation for this repository. generated via the 'docs' npm script
│   
└───decorator-validation
│   │   ...                 <-- Source code for this repository
│   
└───src
│   │   ...                 <-- Source code for this repository
│   
└───workdocs                <-- Folder with all pre-compiled documentation
    │───assets              <-- Documentation asset folder
    │───badges              <-- Auto generated coverage badges folder
    │───coverage            <-- Auto generated coverage results
    │───drawings            <-- DrawIO folder. Drawings (*.drawio) here will be processed to generate documentation (requires docker)
    │───uml                 <-- PlantUML folder. Diagrams (*.puml) here will be processed to generate documentation (requires docker)
    │───tutorials           <-- Tutorial folder
    │   ...                 <-- Categorized *.md files that are merged to generate the final readme (via md compile)
    │   Readme.md           <-- Entry point to the README.md   

```
