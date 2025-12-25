the user need to give a <base_path> representing  where to run commands on, and where to consider the root folder.
escaping this root folder for anything must be granted explicit permission by the user.

task 1 - read all files under `<base_path>/src/**/*.ts` and store them in <files>.
task 2 - understand the content of each file, the repository as a whole. Identify main Classes, Functions, and overall functionality
task 3 - read all files under `<base_path>/tests/**/*.ts` and store them in <tests>.
task 4 - understand the content of each test file, and how to use the main objects of the repository and what for.
task 5 - if there's a file `<base_path>/workdocs/ai/focus-areas.md`, read it. if not ask the user for focus points for the description and examples (user can say no)
task 6 - from the identified elements and eventual focus provided, elaborate a short summary of the intent of the library and write in `<base_path>/workdocs/1-Header.md` under the banner and title
task 7 - write examples in the `workdocs/5-HowToUse.md` file for all the identified elements, giving high priority to the focus points if provided
- each item MUST contain:
    - Description of the use case;
    - complex items should be accompanied by a detailed sequence diagram in mermaid (using appropriate markdown mermaid notation). it should be colorized using pleasant pastel colors and ensure color consistency between similar entities across different mermaid charts 
    - typescript example(s) using the appropriate typescript code notation in md format
    - many sure to provide EXACT WORKING examples for the <files>, not examples for similar apis.