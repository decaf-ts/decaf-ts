![Banner](./workdocs/assets/Banner.png)

## Decaf
##### Decaf's almost a framework

##### Why we need yet another TS almost framework?

I know... like there aren't enough right?!... Good thing DECAF is not quite a Framework.

No. Really,


![Licence](https://img.shields.io/github/license/decaf-ts/decaf-ts.svg?style=plastic)
![GitHub language count](https://img.shields.io/github/languages/count/decaf-ts/decaf-ts?style=plastic)
![GitHub top language](https://img.shields.io/github/languages/top/decaf-ts/decaf-ts?style=plastic)

[![Build & Test](https://github.com/decaf-ts/decaf-ts/actions/workflows/nodejs-build-prod.yaml/badge.svg)](https://github.com/decaf-ts/decaf-ts/actions/workflows/nodejs-build-prod.yaml)
[![CodeQL](https://github.com/decaf-ts/decaf-ts/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/decaf-ts/decaf-ts/actions/workflows/codeql-analysis.yml)[![Snyk Analysis](https://github.com/decaf-ts/decaf-ts/actions/workflows/snyk-analysis.yaml/badge.svg)](https://github.com/decaf-ts/decaf-ts/actions/workflows/snyk-analysis.yaml)
[![Pages builder](https://github.com/decaf-ts/decaf-ts/actions/workflows/pages.yaml/badge.svg)](https://github.com/decaf-ts/decaf-ts/actions/workflows/pages.yaml)
[![.github/workflows/release-on-tag.yaml](https://github.com/decaf-ts/decaf-ts/actions/workflows/release-on-tag.yaml/badge.svg?event=release)](https://github.com/decaf-ts/decaf-ts/actions/workflows/release-on-tag.yaml)

![Open Issues](https://img.shields.io/github/issues/decaf-ts/decaf-ts.svg)
![Closed Issues](https://img.shields.io/github/issues-closed/decaf-ts/decaf-ts.svg)
![Pull Requests](https://img.shields.io/github/issues-pr-closed/decaf-ts/decaf-ts.svg)
![Maintained](https://img.shields.io/badge/Maintained%3F-yes-green.svg)

![Forks](https://img.shields.io/github/forks/decaf-ts/decaf-ts.svg)
![Stars](https://img.shields.io/github/stars/decaf-ts/decaf-ts.svg)
![Watchers](https://img.shields.io/github/watchers/decaf-ts/decaf-ts.svg)

![Node Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fbadges%2Fshields%2Fmaster%2Fpackage.json&label=Node&query=$.engines.node&colorB=blue)
![NPM Version](https://img.shields.io/badge/dynamic/json.svg?url=https%3A%2F%2Fraw.githubusercontent.com%2Fbadges%2Fshields%2Fmaster%2Fpackage.json&label=NPM&query=$.engines.npm&colorB=purple)

Documentation available [here](https://decaf-ts.github.io/decaf-ts/)

## Description

The Decaf Project presents a modular approach. 
Several modules can be added to your project according to your needs, adding up to the smallest footprint possible.

#### Stable Releases:

| Distribution                                                               | Description                                                                             | Version |
|----------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|---------|
| ![decorator-validation](https://github.com/decaf-ts/decorator-validation ) | Holds the Model class.                                                                  |         |
| ![Decaf Lite]()                                                            | Introduces the Repository base class<br/>allowing you to use it for your projects       |         |
| ![Decaf Base]()                                                            | Further extends the Repository, making it<br/>suitable for all persistence layers       |         |
| ![Decaf For Nano]()                                                        | Adds the persistence layer for CouchDB using nano<br/>suitable for all CouchDB projects |         |
| ![Decaf For Pouch]()                                                       | Adds the persistence layer for CouchDB using PouchDB<br/>suitable for digital wallets   |         |
| ![Decaf For Angular]()                                                     | Angular UI Engine. Converts Models into functional CRUD and Listing screens             |         |
|                                                                            |                                                                                         |         |

### Core Modules

[![Readme Card](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=reflection)](https://github.com/decaf-ts/reflection)
[![Readme Card](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=decorator-validation)](https://github.com/decaf-ts/decorator-validation)
[![Readme Card](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=db-decorators)](https://github.com/decaf-ts/db-decorators)
[![Readme Card](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=core)](https://github.com/decaf-ts/core)

### Persistence Adapters

[![Readme Card](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=for-couchdb)](https://github.com/decaf-ts/for-couchdb)
[![Readme Card](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=for-fabric)](https://github.com/decaf-ts/for-fabric)

### UI Engines

[![Readme Card](https://github-readme-stats.vercel.app/api/pin/?username=decaf-ts&repo=for-angular)](https://github.com/decaf-ts/for-angular)

## Bundled Distribution Structure Template

### DECAF Lite

- @decaf-ts/reflection;
- @decaf-ts/decorator-validation;
- @decaf-ts/injectable-decorators;
- @decaf-ts/db-decorators;

### Persistence DECAF suite

- @decaf-ts/reflection;
- @decaf-ts/decorator-validation;
- @decaf-ts/injectable-decorators;
- @decaf-ts/db-decorators;
- @decaf-ts/transactional-decorators;
- @decaf-ts/core;
- @decaf-ts/<persistence adapter>;

### Fullstack DECAF suite

- @decaf-ts/decorator-validation;
- @decaf-ts/db-decorators;
- @decaf-ts/injectable-decorators;
- @decaf-ts/transactional-decorators; (optional)
- @decaf-ts/core;
- @decaf-ts/<persistence adapter>;
- @decaf-ts/ui-decorators;
- @decaf-ts/<rendering engine>; Suited for your frontend Framework (or several);

### How to Use

- [Initial Setup](./tutorials/For%20Developers.md#_initial-setup_)
- [Installation](./tutorials/For%20Developers.md#installation)
- [Scripts](./tutorials/For%20Developers.md#scripts)
- [Linting](./tutorials/For%20Developers.md#testing)
- [CI/CD](./tutorials/For%20Developers.md#continuous-integrationdeployment)
- [Publishing](./tutorials/For%20Developers.md#publishing)
- [Structure](./tutorials/For%20Developers.md#repository-structure)
- [IDE Integrations](./tutorials/For%20Developers.md#ide-integrations)
  - [VSCode(ium)](./tutorials/For%20Developers.md#visual-studio-code-vscode)
  - [WebStorm](./tutorials/For%20Developers.md#webstorm)
- [Considerations](./tutorials/For%20Developers.md#considerations)

### Social

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/decaf-ts/)




#### Languages

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![NodeJS](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![ShellScript](https://img.shields.io/badge/Shell_Script-121011?style=for-the-badge&logo=gnu-bash&logoColor=white)

## Getting help

If you have bug reports, questions or suggestions please [create a new issue](https://github.com/decaf-ts/ts-workspace/issues/new/choose).

## Contributing

I am grateful for any contributions made to this project. Please read [this](./workdocs/98-Contributing.md) to get started.

## Supporting

The first and easiest way you can support it is by [Contributing](./workdocs/98-Contributing.md). Even just finding a typo in the documentation is important.

Financial support is always welcome and helps keep both me and the project alive and healthy.

So if you can, if this project in any way. either by learning something or simply by helping you save precious time, please consider donating.

## License

This project is released under the [MIT License](./LICENSE.md).

By developers, for developers...