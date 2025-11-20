## Description

The Decaf Project is your modular TypeScript espresso bar: pick your modules, mix and match, and get the smallest, most robust codebase possible (with a side of puns).

#### Stable Releases:

| Distribution                                                             | Description                                                                           | Version |
|--------------------------------------------------------------------------|---------------------------------------------------------------------------------------|---------|
| [decorator-validation](https://github.com/decaf-ts/decorator-validation) | Holds the Model class. Validates your models and your existential dread.              |         |
| Decaf Lite                                                               | Repository base class for your projects. Like a starter espresso shot.                |         |
| Decaf Base                                                               | Extends the Repository for all persistence layers. For when you need a double shot.   |         |
| Decaf For Nano                                                           | CouchDB persistence with nano. Small, strong, and effective.                          |         |
| Decaf For Pouch                                                          | PouchDB persistence. For digital wallets and offline dreams.                          |         |
| Decaf For Angular                                                        | Angular UI Engine. Turns Models into CRUD screens faster than you can say "ng serve". |         |

### Core Modules

- **@decaf-ts/reflection**: Runtime type reflection. Stare into the abyss of your types.
- **@decaf-ts/decorator-validation**: Validate your models and your life choices.
- **@decaf-ts/db-decorators**: Decorators for database models. Because plain classes are so last season.
- **@decaf-ts/core**: The heart of Decaf-TS. Repository patterns, query engines, and more.
- **@decaf-ts/injectable-decorators**: Dependency injection, but make it TypeScript.
- **@decaf-ts/transactional-decorators**: Transaction management. Because sometimes you need to roll back your mistakes.

### Persistence Adapters

- **@decaf-ts/for-couchdb**: CouchDB adapter. For when you want your data to lounge comfortably.
- **@decaf-ts/for-pouch**: PouchDB adapter. For digital wallets and offline dreams.
- **@decaf-ts/for-nano**: Nano adapter for CouchDB. Small, but mighty.
- **@decaf-ts/for-typeorm**: TypeORM adapter. For the relationally inclined.
- **@decaf-ts/for-fabric**: Hyperledger Fabric adapter. Blockchain, but with less hype.

### UI Engines

- **@decaf-ts/for-angular**: Angular UI engine. Turns your models into functional CRUD screens.
- **@decaf-ts/for-react**: React UI engine. Because hooks are the new black.
- **@decaf-ts/ui-decorators**: UI decorators for all your rendering needs.

### Utilities & More

- **@decaf-ts/utils**: Utility functions. The duct tape of Decaf-TS.
- **@decaf-ts/logging**: Logging utilities. Because you need to know what went wrong (and right).
- **@decaf-ts/mcp-server**: Microservices, prompts, and more. For when you want to go big, but stay decaf.
- **@decaf-ts/as-zod**: Zod integration. For schema validation that’s actually fun.
- **@decaf-ts/decoration**: Advanced decoration utilities. Because your code deserves to look good.

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