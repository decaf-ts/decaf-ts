You are preparing release notes for this repo.
1) Summarize notable changes since the last tag:
   a) compile the unique TICKETS for the commits since the last tag (TICKETS follow the pattern DECAF-XXX in the commit message);
   b) if there's a file `<base_path>/workdocs/ai/tracked-files.json` read the file list and:
      1 - analyze all changes in those files since the last tag (if there isn't reference the last 10 tags);
      2 - identify any breaking changes in the api;
      3 - identify any extended/corrected functionality from those changes;
2) Create a <base_path>/workdocs/reports/CHANGELOG.md file (or append a new version section on top of existing file):
   a) for the new section add:
      1 - new features section (bullet points with detailed description of each new feature);
      2 - fixed bugs section (bullet points with detailed description of each fixed bug);
      3 - breaking changes section (bullet points with detailed description of breaking changes);
   b) all bullet points must match a TICKET. Do not repeat TICKETS between features|bugs|breaking changes. summarize them into one (TICKETS can repeat in different sections, just not in the same one)
3) Create (or replace) a <base_path>/workdocs/reports/DEPENDENCIES.md file:
   a) include section for dependencies including the output from `npm ls --prod --all --include=peer` wrapped in a shell code block;
   b) if any of the listed packages has vulnerabilities include section vulnerabilities, detailing the package, how it's used, the vulnerability, if it affects the code, and if so, the impact (and or fix/mitigating conditions)
4) Create (or replace) a <base_path>/workdocs/reports/RELEASE_NOTES.md file:
   a) include, for each TICKET a succint description of the changes and their impact;
   b) include upgrade instructions if applicable;
   c) include summary of breaking changes if applicable, along with link to CHANGELOG file;
   d) include summary of vulnerabilities if applicable, along with link to DEPENDENCIES file;
   e) include a markdown table with a human readable version of the coverage report;