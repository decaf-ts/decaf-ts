## Tabnine prompts to generate decent documentation

### Classes (/document-class)

`document the entire class and each of its functions including always including the @description tag with a short description of the target, and a@summary tag with a more detailed one. 
Include @class tags when applicable.
include @param tags in the class documentation and its type definitions
Include detailed @description for all properties.
For methods and functions:
  - include @description and @summary tags as defined for the target. also document every argument, including its type definition, and return type, referencing @template tags when necessary.
  - create mermaid sequence diagrams under the @mermaid tag;

The order of tags  (when applicable) should be as follows:
1 - @description;
2 - @summary;
3 - @template;
4 - @param;
5 - @return;
6 - @class
7 - @mermaid;
8 - @memberOf referencing the appropriate module using the appropriate syntax
`

### Interfaces and Types (/document-type)

`document the target code, always including the @description tag with a short description of the target, and a@summary tag with a more detailed one. 
Include @interface and @typeDef tags when appropriate.
Include detailed @description for all properties.
For methods, include @description and @summary tags as defined for the target. also document every argument, including its type definition, and return type, referencing @template tags when necessary.

The order of tags  (when applicable) should be as follows:
1 - @description;
2 - @summary;
3 - @template;
4 - @param;
5 - @return;
6 - @interface or @typeDef
7 - @mermaid;
8 - @memberOf referencing the appropriate module using the appropriate syntax
`