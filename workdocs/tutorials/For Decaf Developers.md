### Logging:

The logging module, outside the utils module was designed to wrap any enterprise logging solution under a common interface.

In the decaf project, it is meant to be used:

 - main logger should be instantiated on the constructor:
```typescript
class ClassName {
  
  protected log: Logger;
  
  constructor() {
    this.log = Logging.for(ClassName);
  }
}
 
```


 - on methods logger should be instantiated at start:
```typescript
class ClassName {
  method(): any {
    const log = this.log.for(this.method);
    log.info("something")
  }
}
 
```

#### Using logger levels

 - error: meant only for business non expected errors. should never be logged when working under decaf
 - info: meant only for business standard logging. should rarely be used under decaf
 - verbose: meant only for business additional logging. Can be found often in decaf, with ***verbosity 3***
 - debug: meant only for business logging that exposes critical data. Should never be found in decaf except in adapters, rendering engine and cli
 - silly: meant only for exceptional levels of logging (or those that pass the verbosity level eg if set to 2, all decaf verbose logging would show up as silly). May be used in decaf for silly purposes


### Errors:

Errors should only be wrapped when comming from a decaf outside source.

Whenever that is not the case, letting the error pass or wrapping it in a new one without message are the options

