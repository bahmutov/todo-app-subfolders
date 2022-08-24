# TodoMVC app with api and Cypress tests

> Separate frontend, api, and Cypress test subfolders

Read the blog post [Caching Cypress On CircleCI](https://glebbahmutov.com/blog/cypress-circleci-subfolders/)

- [api](./api) is the Todo REST api created using [json-server](https://github.com/typicode/json-server), running at port `3000`
- [frontend](./frontend) serves a static TodoMVC app that uses the Todo REST API to load and store items, runs run port `5555` by default
- [e2e](./e2e) are Cypress end-to-end tests running against the local site
