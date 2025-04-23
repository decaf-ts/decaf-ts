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