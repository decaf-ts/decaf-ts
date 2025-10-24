if no <file_path> is provided, <file_path> is  `./all_slogans.json`;
for each inner repo in this repository (can re read from `./bin/modules.js`), references as REPO:
- in `./<REPO>` look for a slogans.json or slogans.ts file;
- extract the matching json and add it to a JSON like {REPO: REPO_SLOGANS_JSON}
- the result json where each key (REPO) there should have all it's slogans in json format;
- store the resulting json under <file_path>