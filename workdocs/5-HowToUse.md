### How to Use

- [Initial Setup](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#_initial-setup_)
- [Installation](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#installation)
- [Scripts](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#scripts)
- [Linting](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#testing)
- [CI/CD](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#continuous-integrationdeployment)
- [Publishing](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#publishing)
- [Structure](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#repository-structure)
- [IDE Integrations](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#ide-integrations)
  - [VSCode(ium)](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#visual-studio-code-vscode)
  - [WebStorm](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#webstorm)
- [Considerations](https://github.com/decaf-ts/decaf-ts/tree/main/decaf-ts/workdocs/tutorials/For%20Developers.md#considerations)

## Modules Overview

- **@decaf-ts/reflection**: Runtime type reflection. For when you want to see your types in the mirror.
- **@decaf-ts/decorator-validation**: Model validation. Because your models need boundaries too.
- **@decaf-ts/db-decorators**: Database model decorators. Dress up your classes for the big data party.
- **@decaf-ts/core**: Repository patterns, query engines, and more. The espresso shot of your app.
- **@decaf-ts/injectable-decorators**: Dependency injection. Like a barista for your services.
- **@decaf-ts/transactional-decorators**: Transaction management. Undo your mistakes, at least in code.
- **@decaf-ts/for-couchdb**: CouchDB adapter. For data that likes to chill.
- **@decaf-ts/for-pouch**: PouchDB adapter. For digital wallets and offline dreams.
- **@decaf-ts/for-nano**: Nano adapter for CouchDB. Small, but mighty.
- **@decaf-ts/for-typeorm**: TypeORM adapter. For the relationally inclined.
- **@decaf-ts/for-fabric**: Hyperledger Fabric adapter. Blockchain, minus the hype.
- **@decaf-ts/for-angular**: Angular UI engine. CRUD screens at the speed of light.
- **@decaf-ts/for-react**: React UI engine. Hooks, hooks, and more hooks.
- **@decaf-ts/ui-decorators**: UI decorators for all your rendering needs.
- **@decaf-ts/utils**: Utility functions. The duct tape of Decaf-TS.
- **@decaf-ts/logging**: Logging utilities. Know what went wrong, and laugh about it.
- **@decaf-ts/mcp-server**: Microservices, prompts, and more. For when you want to go big, but stay decaf.
- **@decaf-ts/as-zod**: Zod integration. Schema validation that’s actually fun.
- **@decaf-ts/decoration**: Advanced decoration utilities. Because your code deserves to look good.

## Quickstart

1. Pick your modules (see above).
2. `npm install @decaf-ts/<module>`
3. Add some decorators.
4. Build something cool.

## Coding Principles

- group similar functionality in folders (analog to namespaces but without any namespace declaration)
- one class per file;
- one interface per file (unless interface is just used as a type);
- group types as other interfaces in a types.ts file per folder;
- group constants or enums in a constants.ts file per folder;
- group decorators in a decorators.ts file per folder;
- always import from the specific file, never from a folder or index file (exceptions for dependencies on other packages);
- prefer the usage of established design patters where applicable:
  - Singleton (can be an anti-pattern. use with care);
  - factory;
  - observer;
  - strategy;
  - builder;
  - etc;
