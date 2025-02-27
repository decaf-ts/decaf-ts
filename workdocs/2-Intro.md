## Decaf
##### Decaf's almost a framework

##### Why we need a yet another TS almost framework?

I know... like there aren't enough... Good this DECAF is not quite a Framework.

No. Really,

Often when developing distinct Typescript based R&D projects, I often struggled (or kept reinventing the wheel) to find standard ORM features other languages already offer. Be it because
- For some specific reason fell off the usual tech stacks:
  - unusual storage systems (eg: Blockchain);
  - strict lightweight requirements (near vanilla JS developments);
  - lack of consistent model validation for node;
  - non-relational storage;
- Or in more classical projects:
  - Insufficient/complex model control (validation, serialization, hashing, equality) that other languages typically support;
  - Consistent ORM behaviour in the frontend and backend;
  - Consistent Validation behaviour;
  - Boiler plate code in services/repositories;
- Or even when just considering the UI:
  - Boiler plate code in views for CRUD and listing;
  - Boiler plate code in controllers/services;
  - Lack of code portability;
  - Hi dependency-volume (hi bundle sizes);

Over time I started standardizing the functionality I really required (and that for the nature of the projects and some of the reasons above,
standard WebFrameworks were not desirable) into very small, lightweight modules that can be combined according to the feature required for each project

***Under development***

Wait for it...
Typescript library suite meant to fill the void of cross-platform, stable Typescript ORM frameworks 

